/* Handing a document on: a copy of a Case File item goes into another
   character's cabinet, with a cover letter from the sender. The original stays
   where it is. Both sides get an event; a staff recipient also remembers it. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { newMessageId } from "@/lib/email/resend";

export async function sendDocumentCopy(db: SupabaseClient, p: { campaignId: string; fromCharacterId: string; toCharacterId: string; itemSlug: string; round: number | null; note?: string | null }): Promise<{ ok: true; title: string; already: boolean } | { ok: false; error: string }> {
  const { data: item } = await db.from("case_items").select("*").eq("character_id", p.fromCharacterId).eq("slug", p.itemSlug).eq("status", "held").maybeSingle();
  if (!item) return { ok: false, error: "You do not hold that item." };
  const [{ data: from }, { data: to }] = await Promise.all([
    db.from("characters").select("id, slug, name, player_id, players(email)").eq("id", p.fromCharacterId).single(),
    db.from("characters").select("id, slug, name, player_id, players(email)").eq("id", p.toCharacterId).single(),
  ]);
  if (!from || !to) return { ok: false, error: "Unknown character." };
  const copySlug = `${item.slug}`.slice(0, 40) + `-from-${from.slug}`.slice(0, 20);
  const { data: existing } = await db.from("case_items").select("id").eq("character_id", to.id).eq("slug", copySlug).maybeSingle();
  if (!existing) {
    const { error } = await db.from("case_items").insert({
      campaign_id: p.campaignId, character_id: to.id, slug: copySlug, kind: item.kind, drawer: item.drawer, title: item.title, from_label: item.from_label, written_label: item.written_label, written_on: item.written_on,
      body: item.body, image_path: item.image_path, caption: item.caption, asset_id: item.asset_id, round_received: p.round,
      how_obtained: `Sent to you by ${from.name}${p.round ? `, Round ${p.round}` : ""}.`, copy_note: `A copy of ${from.name}'s copy.${item.copy_note ? ` (${item.copy_note})` : ""}`, grade: item.grade, status: "held",
    });
    if (error) return { ok: false, error: error.message };
  }
  // The cover letter, on the sender's paper, delivered like any letter; staff remember what they were handed.
  const toEmail = (Array.isArray(to.players) ? to.players[0]?.email : (to.players as { email: string } | null)?.email) ?? null;
  const body = `${to.name.split(" ")[0] === to.name ? to.name : `Mr. ${to.name.split(" ").pop()}`},\n\n${p.note?.trim() ? `${p.note.trim()}\n\n` : ""}Enclosed: a copy of "${item.title}".${to.player_id ? " It is in your Case File." : ""}\n\n— ${from.name}`;
  const { data: row } = await db.from("correspondence").insert({ campaign_id: p.campaignId, direction: "outbound", message_id: newMessageId(), from_character: from.id, to_characters: [to.id], to_addresses: toEmail ? [toEmail] : [], subject: `Enclosed: ${item.title}`, body_text: body, raw: { letter_kind: "letter", enclosure: copySlug, source: "transfer" } }).select("id").single();
  if (row && toEmail) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
  if (!to.player_id) await db.from("knowledge").insert({ character_id: to.id, fact_key: `told:${from.slug}:doc:${item.slug}`, value: { kind: "document", text: `${from.name} handed over a copy of "${item.title}"`, from: from.id, from_name: from.name, round: p.round }, confidence: 1, source_kind: "told", source_ref: row?.id ?? null, learned_round: p.round });
  await db.from("events").insert({ campaign_id: p.campaignId, kind: "document.sent", payload: { from: from.id, to: to.id, item: item.slug, copy: copySlug }, idempotency_key: `docsent:${from.id}:${to.id}:${item.slug}:${Date.now()}`, visible_to: [from.id, to.id] });
  return { ok: true, title: item.title as string, already: Boolean(existing) };
}
