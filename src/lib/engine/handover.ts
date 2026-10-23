/* A staff member handing over a file they keep. Until now a file kept by a
   person (DocumentDef.access.via, or holder = the person) could reach a
   player only by clearance, by theft or by directive: a letter asking for it
   was answered in words and nothing arrived. Now the keeper's reply may carry
   a GIVES line naming one file they keep, and the clerk delivers a copy into
   the writer's Case File with the file's knowledge, as Records would. The
   keeper decides in character, under the cast sheet and the pacing limits;
   the engine only checks that the file is theirs to give and not sealed.
   Records also forwards a referred request to its keeper as a letter
   (resolve.ts), so asking Records for a personal file is no longer a dead
   end. PROPOSED 2026-10-23. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { documentsFor, matchDocument } from "./world";
import type { DocumentDef } from "./world/types";
import { logLines } from "./equipment";

/* The files a person keeps, for their prompt: by slug, with what it takes to get one from Records. */
export function filesKeptBy(slug: string, episode: number): DocumentDef[] {
  return documentsFor(episode).filter((d) => d.holder === slug || d.access.via === slug);
}

export function keepsBlock(slug: string, episode: number): string {
  const kept = filesKeptBy(slug, episode).filter((d) => !d.access.sealed);
  if (!kept.length) return "";
  return `\nFILES YOU KEEP (Records refers requests for these to you; only you can hand one over)\n${kept.map((d) => `- "${d.title}"${d.access.clearance ? ` (Records would want clearance ${d.access.clearance})` : ""}`).join("\n")}\nYou may hand ONE of these to the writer with this letter by writing its exact title on the GIVES line, and only when you would: because they have given you a reason you accept, or offered something you want (say so in WANTS), or because it is theirs to see. The LIMITS below govern this too: in a writer's first week you hand over nothing. What you give is on the record as given by you.\n`;
}

export async function giveDocument(db: SupabaseClient, p: { campaignId: string; roundId: string | null; roundNo: number; replyId: string; npc: { id: string; slug: string; name: string }; player: { id: string; name: string }; title: string }): Promise<DocumentDef | null> {
  const episode = Math.max(1, Math.ceil(p.roundNo / 14));
  const mine = filesKeptBy(p.npc.slug, episode).filter((d) => !d.access.sealed);
  if (!mine.length) return null;
  const hit = matchDocument(p.title, episode);
  const d = hit && mine.some((m) => m.slug === hit.slug) ? hit : mine.find((m) => m.title.toLowerCase() === p.title.toLowerCase()) ?? null;
  if (!d) return null;
  const key = `gave:${p.replyId}:${d.slug}`;
  const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
  if (dup) return d;
  const extra = d.logKey ? await logLines(db, p.campaignId, d.logKey) : [];
  const body = extra.length ? `${d.body}\n\n*Entries added since the page was typed:*\n${extra.map((l) => `- ${l}`).join("\n")}` : d.body;
  await db.from("case_items").upsert({ campaign_id: p.campaignId, character_id: p.player.id, slug: d.slug, kind: d.kind === "map" ? "map" : d.kind === "letter" ? "letter" : d.kind === "memo" ? "memo" : d.kind === "report" ? "report" : d.kind === "object" ? "object" : "document", drawer: d.kind === "map" ? "maps" : "documents", title: d.title, from_label: d.from ?? null, written_label: d.written ?? null, body, round_received: p.roundNo, how_obtained: `Handed over by ${p.npc.name}, Round ${p.roundNo}, with a letter.`, copy_note: "A copy, from the person who keeps the original.", grade: "evidence", status: "held" }, { onConflict: "character_id,slug" });
  if (d.grants.length) await db.from("knowledge").insert(d.grants.map((k) => ({ character_id: p.player.id, fact_key: k, value: { true: true, round: p.roundNo, from: p.npc.id }, confidence: 0.8, source_kind: "document", source_ref: p.replyId, learned_round: p.roundNo })));
  await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "intake", kind: "npc.gave", payload: { npc: p.npc.slug, npc_name: p.npc.name, character: p.player.id, slug: d.slug, title: d.title, round: p.roundNo, reply: p.replyId }, idempotency_key: key, visible_to: [p.player.id] });
  return d;
}
