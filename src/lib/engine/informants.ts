/* RECRUIT <person> (rulebook §6.3): a contact becomes an informant, a holding
   on the personnel file that costs upkeep and sends a short note each round
   in their own voice, through the same staff-reply pipeline as every letter
   (npc.ts: voice, memory, the word guard, the quote-verified Skeptic).

   The engine decides, never the model:
     who may be asked     a staff member or local who has answered the player
                          at least twice, or whom the player has sat down with
     who agrees           anyone asked who meets that, unless they are
                          Corporate Security (they report the approach instead)
     what they saw        presence rows at their post this round (overt verbs)
     what it costs        UPKEEP AU at each world phase; short of it, they lapse
     how it ends          DISMISS <name>; Security's summons warns them off
   The note's words are the model's; its facts are the lines the engine hands it. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { gameDate } from "@/lib/email/letter";
import { gameMailbox, newMessageId } from "@/lib/email/resend";

type Db = SupabaseClient;
export const UPKEEP = 2;

type Person = { id: string; slug: string; name: string; division: string | null };

/* Does this person know the player well enough to be asked? */
export async function acquainted(db: Db, campaignId: string, playerId: string, npcId: string): Promise<{ ok: boolean; why: string }> {
  const [{ count: letters }, { data: rel }] = await Promise.all([
    db.from("correspondence").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("from_character", npcId).contains("to_characters", [playerId]),
    db.from("relationships").select("obligation").eq("from_character", npcId).eq("to_character", playerId).maybeSingle(),
  ]);
  if ((letters ?? 0) >= 2) return { ok: true, why: "they have written more than once" };
  if (Number(rel?.obligation ?? 0) >= 0.1) return { ok: true, why: "you have sat down together" };
  return { ok: false, why: (letters ?? 0) === 1 ? "one letter is not an acquaintance; write again, or go and see them" : "they do not know you; write to them, or go and see them, first" };
}

export async function informantsOf(db: Db, characterId: string): Promise<{ id: string; npcId: string; name: string; since: number }[]> {
  const { data } = await db.from("assets").select("id, name, provenance").eq("holder_id", characterId).eq("kind", "informant").eq("status", "held");
  return (data ?? []).map((a) => { const p = a.provenance as { npc: string; round: number }; return { id: a.id as string, npcId: p.npc, name: a.name as string, since: p.round }; });
}

/* The approach: decided by rule; the person's own answer comes in the morning note. */
export async function recruit(db: Db, p: { campaignId: string; roundId: string; roundNo: number; player: Person; target: Person; text: string }): Promise<{ ok: true; summary: string; noticed: boolean } | { ok: false; error: string }> {
  const have = (await informantsOf(db, p.player.id)).find((i) => i.npcId === p.target.id);
  if (have) return { ok: false, error: `${p.target.name} already informs for ${p.player.name}.` };
  const acq = await acquainted(db, p.campaignId, p.player.id, p.target.id);
  if (!acq.ok) return { ok: false, error: `${p.target.name} would not take the question from a stranger: ${acq.why}.` };
  const security = p.target.division === "corporate-security";
  const date = gameDate(p.roundNo);
  if (!security) {
    await db.from("assets").insert({ campaign_id: p.campaignId, holder_id: p.player.id, kind: "informant", slug: `informant-${p.target.slug}-${p.player.slug}`, name: `${p.target.name} (informant)`, description: `Sends a note each morning with what they saw and heard. ${UPKEEP} AU a round; DISMISS ${p.target.name.split(" ").pop()} to end it.`, provenance: { npc: p.target.id, round: p.roundNo, how: "Recruited in person." }, tier: null, secret: true, status: "held", status_round: p.roundNo });
  }
  // The person remembers being asked, and answers in their own words tomorrow morning.
  await db.from("knowledge").insert({ character_id: p.target.id, fact_key: `told:${p.player.slug}:recruited:${p.roundNo}`, value: { kind: "info_share", text: security ? `${p.player.name} asked me, on ${date}, to pass along what I see for a consideration; I reported the approach` : `${p.player.name} asked me, on ${date}, to pass along what I see and hear, for a consideration; I agreed`, from: p.player.id, from_name: p.player.name, round: p.roundNo }, confidence: 1, source_kind: "told", source_ref: null, learned_round: p.roundNo });
  const { data: row } = await db.from("correspondence").insert({ campaign_id: p.campaignId, round_id: p.roundId, direction: "inbound", message_id: newMessageId(), from_character: p.player.id, from_address: null, to_characters: [p.target.id], to_addresses: [gameMailbox().address], subject: `In person: ${p.player.name} asks for a quiet arrangement`, body_text: `[In person, ${date}.] ${p.player.name} came to see ${p.target.name} and asked them to pass along what they see and hear, for a consideration: "${p.text.slice(0, 200)}".`, trusted: true, raw: { letter_kind: "recruit", source: "order", agreed: !security } }).select("id").single();
  if (row) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: row.id, character_id: p.target.id }, run_after: new Date(Date.now() + 60_000).toISOString() });
  if (security) {
    const { data: sec } = await db.from("characters").select("id, divisions!inner(slug)").eq("campaign_id", p.campaignId).is("player_id", null).eq("divisions.slug", "corporate-security");
    for (const s of sec ?? []) await db.from("knowledge").insert({ character_id: s.id, fact_key: `noticed:${p.player.slug}:recruit:${p.roundNo}`, value: { kind: "noticed", text: `${p.player.name} tried to recruit ${p.target.name} as an informant, Round ${p.roundNo}.`, from: p.player.id, from_name: p.player.name, round: p.roundNo }, confidence: 1, source_kind: "told", source_ref: null, learned_round: p.roundNo });
    return { ok: true, summary: `${p.player.name} put the question to ${p.target.name}, who is Corporate Security. They listened to the end. What they said arrives in the morning; what they did with it is Security's business.`, noticed: true };
  }
  return { ok: true, summary: `${p.player.name} put the question to ${p.target.name}, who agreed, for ${UPKEEP} AU a round. They are under Holdings on the personnel file; their first note comes with tomorrow's mail.`, noticed: false };
}

export async function dismiss(db: Db, p: { campaignId: string; roundNo: number; playerId: string; playerSlug: string; target: Person }): Promise<boolean> {
  const inf = (await informantsOf(db, p.playerId)).find((i) => i.npcId === p.target.id);
  if (!inf) return false;
  await db.from("assets").update({ status: "returned", status_round: p.roundNo, status_note: "Dismissed." }).eq("id", inf.id);
  await db.from("knowledge").insert({ character_id: p.target.id, fact_key: `told:${p.playerSlug}:dismissed:${p.roundNo}`, value: { kind: "info_share", text: `the arrangement with the player ended on ${gameDate(p.roundNo)}, at their asking`, from: p.playerId, round: p.roundNo }, confidence: 1, source_kind: "told", source_ref: null, learned_round: p.roundNo });
  return true;
}

/* The world phase: upkeep, lapses, and tonight's note from every informant still on the books. */
export async function informantReports(db: Db, round: { campaignId: string; id: string; number: number }): Promise<{ notes: number; lapsed: number }> {
  const { data: rows } = await db.from("assets").select("id, holder_id, name, provenance").eq("campaign_id", round.campaignId).eq("kind", "informant").eq("status", "held");
  let notes = 0, lapsed = 0;
  for (const a of rows ?? []) {
    const p = a.provenance as { npc: string; round: number };
    const holder = a.holder_id as string;
    const { data: au } = await db.from("resources").select("balance").eq("character_id", holder).eq("kind", "au").maybeSingle();
    const balance = Number(au?.balance ?? 0);
    if (balance < UPKEEP) {
      await db.from("assets").update({ status: "lost", status_round: round.number, status_note: "Stopped answering when the consideration stopped." }).eq("id", a.id);
      await db.from("events").insert({ campaign_id: round.campaignId, round_id: round.id, phase: "world", kind: "informant.lapsed", payload: { character: holder, name: a.name, round: round.number }, idempotency_key: `lapsed:${a.id}:${round.number}`, visible_to: [holder] });
      lapsed++; continue;
    }
    await db.from("resources").update({ balance: balance - UPKEEP }).eq("character_id", holder).eq("kind", "au");
    // What they saw at their post: players who were overtly at the informant's place tonight.
    const { data: npc } = await db.from("characters").select("id, name, npc_state, player_id").eq("id", p.npc).maybeSingle();
    if (!npc) continue;
    const place = (npc.npc_state as { place?: string } | null)?.place ?? null;
    const seen: string[] = [];
    if (place) {
      const { data: pres } = await db.from("presence").select("character_id, verb, target_name, characters(name)").eq("round_id", round.id).eq("target_kind", "place").eq("target_slug", place).neq("character_id", holder).eq("covert", false);
      for (const r of pres ?? []) { const nm = ((Array.isArray(r.characters) ? r.characters[0] : r.characters) as { name: string } | null)?.name; if (nm && r.verb !== "surveil") seen.push(`${nm} was at ${r.target_name} on ${gameDate(round.number)} (${r.verb.replace(/_/g, " ")})`); }
    }
    const { data: holderRow } = await db.from("characters").select("name, slug").eq("id", holder).single();
    const { data: row } = await db.from("correspondence").insert({ campaign_id: round.campaignId, round_id: round.id, direction: "inbound", message_id: newMessageId(), from_character: holder, from_address: null, to_characters: [npc.id], to_addresses: [gameMailbox().address], subject: `Informant's note for ${gameDate(round.number)}`, body_text: `[Not a letter. ${holderRow?.name ?? "The player"} is paying you ${UPKEEP} AU this week to pass along what you see and hear. Seen from your post tonight: ${seen.length ? seen.join("; ") : "nobody in particular"}.]`, trusted: true, raw: { letter_kind: "informant", source: "engine", seen, since: p.round } }).select("id").single();
    if (row) { await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: row.id, character_id: npc.id }, run_after: new Date(Date.now() + 2 * 60_000).toISOString() }); notes++; }
    if (seen.length) await db.from("knowledge").insert(seen.map((t) => ({ character_id: holder, fact_key: `informant:${npc.id}:${round.number}:${t.slice(0, 40)}`, value: { kind: "seen", text: t, via: npc.name, round: round.number }, confidence: 0.8, source_kind: "told", source_ref: row?.id ?? null, learned_round: round.number })));
  }
  return { notes, lapsed };
}
