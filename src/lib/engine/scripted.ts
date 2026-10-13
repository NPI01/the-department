/* Scheduled mail: what the beat sheet says arrives on a given day goes out
   once per recipient, as a letter from its sender (an NPC or an office) with
   a Case File item where the item is a document. Idempotent per key and
   recipient. Called at the morning before the dispatches are written, so the
   dispatch can list what came. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { SCHEDULED, type Route } from "./world/episode-01-mail";
import { newMessageId } from "@/lib/email/resend";

type PC = { id: string; slug: string; name: string; division: string | null; email: string | null; created_at: string; goal_key: string | null };

async function recipients(db: SupabaseClient, campaignId: string, route: Route, pcs: PC[], delivered: Map<string, string[]>): Promise<PC[]> {
  if (!pcs.length) return [];
  const newest = [...pcs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if ("all" in route) return pcs;
  if ("newest" in route) return [newest];
  if ("departments" in route) { const hit = pcs.filter((p) => p.division && route.departments.includes(p.division)); return hit.length ? hit : [newest]; }
  if ("goal" in route) {
    const { data } = await db.from("character_goals").select("character_id").eq("campaign_id", campaignId).eq("goal_key", route.goal).eq("status", "open");
    const ids = new Set((data ?? []).map((g) => g.character_id as string));
    const hit = pcs.filter((p) => ids.has(p.id) || p.goal_key === route.goal);
    return hit.length ? hit : [newest];
  }
  if ("sameAs" in route) { const ids = delivered.get(route.sameAs) ?? []; const hit = pcs.filter((p) => ids.includes(p.id)); return hit.length ? hit : [newest]; }
  return [];
}

export async function deliverScheduledMail(db: SupabaseClient, campaignId: string, round: { id: string; number: number; episodeRound: number; episodeNumber: number }): Promise<{ delivered: number }> {
  if (round.episodeNumber !== 1) return { delivered: 0 };
  const { data: chars } = await db.from("characters").select("id, slug, name, created_at, goal_key, divisions(slug), players(email)").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null);
  const pcs: PC[] = (chars ?? []).map((c) => ({ id: c.id as string, slug: c.slug as string, name: c.name as string, created_at: c.created_at as string, goal_key: (c.goal_key as string | null) ?? null, division: ((Array.isArray(c.divisions) ? c.divisions[0] : c.divisions) as { slug: string } | null)?.slug ?? null, email: ((Array.isArray(c.players) ? c.players[0] : c.players) as { email: string } | null)?.email ?? null }));
  const { data: npcs } = await db.from("characters").select("id, slug").eq("campaign_id", campaignId).is("player_id", null);
  const npcId = (slug: string) => (npcs ?? []).find((n) => n.slug === slug)?.id as string | undefined;
  const { data: done } = await db.from("events").select("payload").eq("campaign_id", campaignId).eq("kind", "mail.scripted");
  const delivered = new Map<string, string[]>();
  for (const e of done ?? []) { const v = e.payload as { key: string; character: string }; delivered.set(v.key, [...(delivered.get(v.key) ?? []), v.character]); }
  let n = 0;
  // Everything due on or before today, in order, so a late joiner still gets the pack.
  for (const item of SCHEDULED.filter((i) => i.round <= round.episodeRound).sort((a, b) => a.round - b.round)) {
    const to = await recipients(db, campaignId, item.route, pcs, delivered);
    for (const pc of to) {
      if ((delivered.get(item.key) ?? []).includes(pc.id)) continue;
      const ctx = { name: pc.name, department: pc.division };
      const bodyText = typeof item.body === "function" ? item.body(ctx) : item.body;
      const routing = item.original_to ? `[Copy routed to your tray. Original to ${item.original_to}.]\n\n` : "";
      const from = "npc" in item.from ? npcId(item.from.npc) ?? null : null;
      const { data: row, error } = await db.from("correspondence").insert({
        campaign_id: campaignId, round_id: round.id, direction: "outbound", message_id: newMessageId(), from_character: from,
        to_characters: [pc.id], to_addresses: pc.email ? [pc.email] : [], subject: item.subject, body_text: routing + bodyText,
        raw: { letter_kind: item.kind === "document" ? "notice" : item.kind, classification: item.classification ?? null, scripted: item.key, office: "office" in item.from ? item.from : null },
      }).select("id").single();
      if (error) throw new Error(error.message);
      if (pc.email) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
      if (item.caseItem) {
        const ci = item.caseItem;
        await db.from("case_items").upsert({ campaign_id: campaignId, character_id: pc.id, slug: ci.slug, kind: ci.kind, drawer: ci.drawer, title: ci.title, from_label: "npc" in item.from ? null : item.from.office, written_label: ci.written ?? null, body: typeof ci.body === "function" ? ci.body({ department: pc.division }) : ci.body, round_received: round.number, how_obtained: "Arrived in the morning mail.", copy_note: "Your copy, as issued.", grade: "evidence", status: "held" }, { onConflict: "character_id,slug", ignoreDuplicates: true });
      }
      await db.from("events").insert({ campaign_id: campaignId, round_id: round.id, phase: "open", kind: "mail.scripted", payload: { key: item.key, character: pc.id, correspondence_id: row.id }, idempotency_key: `scripted:${item.key}:${pc.id}`, visible_to: [pc.id] });
      delivered.set(item.key, [...(delivered.get(item.key) ?? []), pc.id]);
      n++;
    }
  }
  return { delivered: n };
}
