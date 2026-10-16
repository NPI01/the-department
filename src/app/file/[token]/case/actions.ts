"use server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ballotNotices, characterForToken, currentRound, letterKey, type CaseNote } from "@/lib/game/case-file";
import { sendDocumentCopy } from "@/lib/game/transfer";
import { fileWithCommittee } from "@/lib/game/filing";

/* The player's notes. The file token is the only key (as for the personnel
   file), so every action resolves it to a character and touches only that
   character's notes. Item keys are checked against what the character holds.
   No refresh(): the page keeps notes in client state, and a router refresh
   would drop the #item hash the open item lives in. */

const Note = z.object({
  token: z.string(),
  itemKey: z.string().max(80).nullable(),
  quote: z.string().trim().max(600).nullable(),
  body: z.string().trim().min(1).max(8000),
  links: z.array(z.string().max(80)).max(20),
});

async function heldKeys(db: ReturnType<typeof supabaseAdmin>, characterId: string, campaignId: string) {
  const [{ data: items }, { data: letters }] = await Promise.all([
    db.from("case_items").select("slug").eq("character_id", characterId),
    db.from("correspondence").select("id").eq("campaign_id", campaignId).not("from_character", "is", null)
      .or(`from_character.eq.${characterId},to_characters.cs.{${characterId}},cc_characters.cs.{${characterId}}`).limit(500),
  ]);
  const { data: notices } = await ballotNotices(db, campaignId, characterId);
  return new Set([...(items ?? []).map((i) => i.slug as string), ...[...(letters ?? []), ...(notices ?? [])].map((l) => letterKey(l.id as string))]);
}

export async function addNote(input: z.input<typeof Note>): Promise<{ note?: CaseNote; error?: string }> {
  const parsed = Note.safeParse(input);
  if (!parsed.success) return { error: "A note needs some writing in it." };
  const n = parsed.data;
  const db = supabaseAdmin();
  const me = await characterForToken(db, n.token);
  if (!me) return { error: "This link is not valid." };
  const held = await heldKeys(db, me.id, me.campaignId);
  if (n.itemKey && !held.has(n.itemKey)) return { error: "That item is not in your Case File." };
  const links = [...new Set(n.links.filter((l) => held.has(l) && l !== n.itemKey))];
  const round = await currentRound(db, me.campaignId);
  const { data, error } = await db.from("case_notes").insert({ character_id: me.id, item_key: n.itemKey, quote: n.quote || null, body: n.body, links, round })
    .select("id, item_key, quote, body, links, round, created_at").single();
  if (error) return { error: "The note did not save. Try again." };
  return { note: { id: data.id, itemKey: data.item_key, quote: data.quote, body: data.body, links: data.links ?? [], round: data.round, createdAt: data.created_at } };
}

export async function editNote(token: string, id: string, body: string): Promise<{ error?: string }> {
  const text = body.trim();
  if (!text || text.length > 8000) return { error: "A note needs some writing in it." };
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) return { error: "This link is not valid." };
  const { error } = await db.from("case_notes").update({ body: text, updated_at: new Date().toISOString() }).eq("id", id).eq("character_id", me.id);
  if (error) return { error: "The note did not save. Try again." };
  return {};
}

export async function deleteNote(token: string, id: string): Promise<{ error?: string }> {
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) return { error: "This link is not valid." };
  await db.from("case_notes").delete().eq("id", id).eq("character_id", me.id);
  return {};
}

/* Hand a copy of an item to another character. The original stays; a cover letter goes with it. */
export async function sendCopy(token: string, itemKey: string, toSlug: string, note: string): Promise<{ ok?: true; title?: string; error?: string }> {
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) return { error: "This link is not valid." };
  const { data: to } = await db.from("characters").select("id").eq("campaign_id", me.campaignId).eq("slug", toSlug).eq("status", "active").maybeSingle();
  if (!to) return { error: "No one by that name." };
  const round = await currentRound(db, me.campaignId);
  const r = await sendDocumentCopy(db, { campaignId: me.campaignId, fromCharacterId: me.id, toCharacterId: to.id as string, itemSlug: itemKey, round, note: note.trim().slice(0, 600) || null });
  return r.ok ? { ok: true, title: r.title } : { error: r.error };
}

/* File an item with a committee: evidence before the body, every member told. */
export async function fileWith(token: string, itemKey: string, orgName: string): Promise<{ ok?: true; summary?: string; error?: string }> {
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) return { error: "This link is not valid." };
  const round = await currentRound(db, me.campaignId);
  const { data: r } = await db.from("rounds").select("id").eq("campaign_id", me.campaignId).eq("status", "open").maybeSingle();
  const out = await fileWithCommittee(db, { campaignId: me.campaignId, characterId: me.id, itemSlug: itemKey, orgName, round, roundId: r?.id ?? null });
  return out.ok ? { ok: true, summary: `Filed with the ${out.org}. ${out.members} members have it${out.moved.length ? `; ${out.moved.join(", ")} moved` : ""}.` } : { error: out.error };
}
