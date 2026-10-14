/* FILE <item> WITH <committee>: a document goes before a body as evidence.
   Every member gets it (a copy in a player's Case File; a memory row for
   staff), the chair may answer through the staff pipeline, the filer's copy
   is marked as filed, and any member whose price on the body's open ballot
   the document meets moves. Free, like a letter: paperwork, not an order. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { newMessageId, gameMailbox } from "@/lib/email/resend";
import { gameDate } from "@/lib/email/letter";
import { documentsFor, episodeOf } from "@/lib/engine/world";
import { getStance, setStance } from "@/lib/engine/governance";

export function committeeByName(text: string): string | null {
  const t = text.toLowerCase();
  if (/research/.test(t)) return "Research Committee";
  if (/safety/.test(t)) return "Safety Committee";
  if (/board|directors/.test(t)) return "Board of Directors";
  return null;
}

export async function fileWithCommittee(db: SupabaseClient, p: { campaignId: string; characterId: string; itemSlug: string; orgName: string; round: number | null; roundId?: string | null; dry?: boolean }): Promise<{ ok: true; title: string; org: string; moved: string[]; members: number } | { ok: false; error: string }> {
  const { data: item } = await db.from("case_items").select("*").eq("character_id", p.characterId).eq("slug", p.itemSlug).eq("status", "held").maybeSingle();
  if (!item) return { ok: false, error: "You do not hold that item." };
  const { data: org } = await db.from("organizations").select("id, name, slug").eq("campaign_id", p.campaignId).eq("name", p.orgName).maybeSingle();
  if (!org) return { ok: false, error: "No such body." };
  const { data: filer } = await db.from("characters").select("id, slug, name").eq("id", p.characterId).single();
  const { data: members } = await db.from("memberships").select("character_id, role, characters(id, slug, name, player_id, players(email))").eq("organization_id", org.id);
  const round = p.round ?? 1;
  const baseSlug = String(item.slug).replace(/-from-.*$/, "");
  // What the document establishes: the world's keys for it, plus its wrong detail if the filer has noticed it.
  const def = documentsFor(episodeOf(round)).find((d) => d.slug === baseSlug);
  const { data: noticed } = def?.wrongDetail ? await db.from("knowledge").select("fact_key").eq("character_id", p.characterId).eq("fact_key", def.wrongDetail.grants).maybeSingle() : { data: null };
  const establishes = [...(def?.grants ?? []), ...(noticed && def?.wrongDetail ? [def.wrongDetail.grants] : [])];
  const moved: string[] = [];
  if (p.dry) return { ok: true, title: item.title as string, org: org.name as string, moved: [`(dry) would establish: ${establishes.join(", ") || "nothing on the index"}`], members: (members ?? []).length };

  for (const m of members ?? []) {
    const ch = (Array.isArray(m.characters) ? m.characters[0] : m.characters) as { id: string; slug: string; name: string; player_id: string | null } | null;
    if (!ch) continue;
    if (ch.player_id) {
      if (ch.id === p.characterId) continue;
      await db.from("case_items").upsert({ campaign_id: p.campaignId, character_id: ch.id, slug: `${baseSlug}-filed-${org.slug}`.slice(0, 60), kind: item.kind, drawer: item.drawer, title: item.title, from_label: item.from_label, written_label: item.written_label, written_on: item.written_on, body: item.body, image_path: item.image_path, caption: item.caption, round_received: round, how_obtained: `Filed with the ${org.name} by ${filer?.name ?? "a colleague"}, Round ${round}; circulated to members.`, copy_note: "The committee's copy.", grade: "evidence", status: "held" }, { onConflict: "character_id,slug", ignoreDuplicates: true });
    } else {
      await db.from("knowledge").insert({ character_id: ch.id, fact_key: `told:${filer?.slug ?? "unknown"}:filed:${baseSlug}:${org.slug}`, value: { kind: "document", text: `${filer?.name ?? "A colleague"} filed "${item.title}" with the ${org.name}`, from: p.characterId, from_name: filer?.name ?? null, round }, confidence: 1, source_kind: "told", learned_round: round });
      // A member whose price the document meets moves on the body's open ballot.
      const { data: motions } = await db.from("motions").select("number").eq("campaign_id", p.campaignId).eq("organization_id", org.id).eq("status", "open").lte("opens_round", round);
      for (const mo of motions ?? []) {
        const s = await getStance(db, p.campaignId, mo.number as string, ch.slug);
        if (s.price?.any_of.some((k) => establishes.includes(k))) {
          s.lean = s.price.sets; s.moved = [...(s.moved ?? []), { by: p.characterId, round, how: `filed ${baseSlug}: ${s.price.note}` }].slice(-12);
          await setStance(db, p.campaignId, mo.number as string, ch.slug, s, round);
          moved.push(`${ch.name} on ${mo.number}`);
        }
      }
    }
  }
  await db.from("case_items").update({ grade: "evidence", copy_note: `${item.copy_note ? item.copy_note + " " : ""}Filed with the ${org.name}, Round ${round}.` }).eq("id", item.id);
  await db.from("facts").upsert({ campaign_id: p.campaignId, key: `filed.${org.slug}.${baseSlug}`, value: { by: p.characterId, round, establishes }, established_round: round, secret: true }, { onConflict: "campaign_id,key" });
  await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId ?? null, phase: "intake", kind: "committee.filed", payload: { by: p.characterId, org: org.slug, item: baseSlug, establishes, moved }, idempotency_key: `filed:${org.slug}:${baseSlug}:${p.characterId}:${round}`, visible_to: [p.characterId] });
  // The chair answers, in their own words, through the staff pipeline.
  const chair = (members ?? []).map((m) => ({ role: m.role as string | null, ch: (Array.isArray(m.characters) ? m.characters[0] : m.characters) as { id: string; player_id: string | null } | null })).find((m) => /chair/i.test(m.role ?? "") && m.ch && !m.ch.player_id)?.ch;
  if (chair) {
    const { data: row } = await db.from("correspondence").insert({ campaign_id: p.campaignId, round_id: p.roundId ?? null, direction: "inbound", message_id: newMessageId(), from_character: p.characterId, to_characters: [chair.id], to_addresses: [gameMailbox().address], subject: `Filed with the ${org.name}: ${item.title}`, body_text: `[Filed, ${gameDate(round)}.] ${filer?.name ?? "A colleague"} filed "${item.title}" with the ${org.name}, for the record and for the members' attention.`, trusted: true, raw: { letter_kind: "interview", verb: "file", source: "filing" } }).select("id").single();
    if (row) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: row.id, character_id: chair.id }, run_after: new Date(Date.now() + 90_000).toISOString() });
  }
  return { ok: true, title: item.title as string, org: org.name as string, moved, members: (members ?? []).length };
}
