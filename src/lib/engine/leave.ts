/* Absence, leave and leaving (rulebook §11). Deterministic, at the lock.

     one missed turn        default behaviour, no hold bonus, standing orders
                            paused (validate phase, as before)
     three in a row         placed on leave: staff stop expecting replies, a
                            committee seat abstains, holdings are safe,
                            informants wait; any order or RETURN brings you back
     seven in a row         reassigned out of Station R: the character retires
     LEAVE <rounds>         leave on purpose, up to MAX_LEAVE rounds, no
                            penalty; RETURN or any order ends it early
   State: facts leave.<char> {kind: voluntary|absence, since, until|null} and
   facts absence.<char> {streak, round}. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { gameDate } from "@/lib/email/letter";
import { newMessageId } from "@/lib/email/resend";

type Db = SupabaseClient;
export const MAX_LEAVE = 5;
export const LEAVE_AFTER = 3;
export const REASSIGN_AFTER = 7;

export type Leave = { kind: "voluntary" | "absence"; since: number; until: number | null };

export async function onLeave(db: Db, campaignId: string, characterId: string): Promise<Leave | null> {
  const { data } = await db.from("facts").select("value").eq("campaign_id", campaignId).eq("key", `leave.${characterId}`).maybeSingle();
  return (data?.value as Leave | undefined) ?? null;
}
export async function leaveSet(db: Db, campaignId: string): Promise<Set<string>> {
  const { data } = await db.from("facts").select("key").eq("campaign_id", campaignId).like("key", "leave.%");
  return new Set((data ?? []).map((f) => (f.key as string).slice("leave.".length)));
}

export async function startLeave(db: Db, p: { campaignId: string; characterId: string; round: number; rounds: number }): Promise<Leave> {
  const n = Math.max(1, Math.min(MAX_LEAVE, Math.floor(p.rounds)));
  const leave: Leave = { kind: "voluntary", since: p.round, until: p.round + n - 1 };
  await db.from("facts").upsert({ campaign_id: p.campaignId, key: `leave.${p.characterId}`, value: leave, established_round: p.round, secret: true }, { onConflict: "campaign_id,key" });
  await db.from("facts").delete().eq("campaign_id", p.campaignId).eq("key", `absence.${p.characterId}`);
  return leave;
}

export async function endLeave(db: Db, campaignId: string, characterId: string): Promise<boolean> {
  const was = await onLeave(db, campaignId, characterId);
  if (!was) return false;
  await db.from("facts").delete().eq("campaign_id", campaignId).eq("key", `leave.${characterId}`);
  await db.from("facts").delete().eq("campaign_id", campaignId).eq("key", `absence.${characterId}`);
  return true;
}

async function notice(db: Db, p: { campaignId: string; roundId: string; character: { id: string; name: string; email: string | null }; subject: string; body: string }) {
  const { data: row } = await db.from("correspondence").insert({ campaign_id: p.campaignId, round_id: p.roundId, direction: "outbound", message_id: newMessageId(), from_character: null, to_characters: [p.character.id], to_addresses: p.character.email ? [p.character.email] : [], subject: p.subject, body_text: p.body, raw: { letter_kind: "notice", classification: "Personal & Confidential", office: { office: "Personnel & Administration", department: "Royce Industries" } } }).select("id").single();
  if (row && p.character.email) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
}

/* At the validate phase, after missed-turn defaults: count absences, place on
   leave, reassign, and let voluntary leaves run out. */
export async function absenceTick(db: Db, round: { campaignId: string; id: string; number: number }): Promise<{ placed: string[]; reassigned: string[]; returned: string[] }> {
  const out = { placed: [] as string[], reassigned: [] as string[], returned: [] as string[] };
  const { data: pcs } = await db.from("characters").select("id, name, players(email)").eq("campaign_id", round.campaignId).eq("status", "active").not("player_id", "is", null);
  const { data: packets } = await db.from("order_packets").select("character_id, mode, source").eq("round_id", round.id);
  const mode = new Map((packets ?? []).map((p) => [p.character_id as string, { mode: p.mode as string, source: p.source as string }]));
  for (const pc of pcs ?? []) {
    const id = pc.id as string; const name = pc.name as string;
    const email = ((Array.isArray(pc.players) ? pc.players[0] : pc.players) as { email: string } | null)?.email ?? null;
    const leave = await onLeave(db, round.campaignId, id);
    const pk = mode.get(id);
    const missed = !pk || (pk.mode === "missed" && pk.source === "default");
    // A voluntary leave runs out on its own.
    if (leave?.kind === "voluntary" && leave.until !== null && leave.until < round.number) { await endLeave(db, round.campaignId, id); out.returned.push(name); continue; }
    if (leave?.kind === "voluntary") continue;
    if (!missed) { if (leave) { await endLeave(db, round.campaignId, id); out.returned.push(name); } else await db.from("facts").delete().eq("campaign_id", round.campaignId).eq("key", `absence.${id}`); continue; }
    const { data: a } = await db.from("facts").select("value").eq("campaign_id", round.campaignId).eq("key", `absence.${id}`).maybeSingle();
    const streak = Number((a?.value as { streak?: number } | null)?.streak ?? 0) + 1;
    await db.from("facts").upsert({ campaign_id: round.campaignId, key: `absence.${id}`, value: { streak, round: round.number }, established_round: round.number, secret: true }, { onConflict: "campaign_id,key" });
    if (streak >= REASSIGN_AFTER) {
      await db.from("characters").update({ status: "retired" }).eq("id", id);
      await db.from("facts").delete().eq("campaign_id", round.campaignId).eq("key", `leave.${id}`);
      await db.from("events").insert({ campaign_id: round.campaignId, round_id: round.id, phase: "validate", kind: "leave.reassigned", payload: { character: id, streak, round: round.number }, idempotency_key: `reassigned:${id}`, visible_to: [id] });
      await notice(db, { campaignId: round.campaignId, roundId: round.id, character: { id, name, email }, subject: "Reassignment", body: `${name},\n\nSeven working days without word, and Personnel has done what it does: your position at Station R is reassigned as of ${gameDate(round.number)}. Your file is closed here. There are other Royce sites, and other cohorts; if you want one, write to us.\n\n— Personnel & Administration` });
      out.reassigned.push(name); continue;
    }
    if (streak >= LEAVE_AFTER && !leave) {
      await db.from("facts").upsert({ campaign_id: round.campaignId, key: `leave.${id}`, value: { kind: "absence", since: round.number, until: null } satisfies Leave, established_round: round.number, secret: true }, { onConflict: "campaign_id,key" });
      await db.from("events").insert({ campaign_id: round.campaignId, round_id: round.id, phase: "validate", kind: "leave.placed", payload: { character: id, streak, round: round.number }, idempotency_key: `leave:${id}:${round.number}`, visible_to: [id] });
      await notice(db, { campaignId: round.campaignId, roundId: round.id, character: { id, name, email }, subject: "Placed on leave", body: `${name},\n\nThree working days without word, and Personnel has placed you on leave as of ${gameDate(round.number)}. Nothing is lost: your desk, your holdings and your seat, if you have one, are kept, and your seat abstains until you return. Staff will stop expecting replies. Any order, or the single word RETURN, brings you back the next morning. After seven days without word the position is reassigned.\n\n— Personnel & Administration` });
      out.placed.push(name);
    }
  }
  return out;
}

/* At the governance close: a seat on leave abstains. */
export async function leaveAbstentions(db: Db, p: { campaignId: string; motionId: string; organizationId: string; round: number }): Promise<number> {
  const away = await leaveSet(db, p.campaignId);
  if (!away.size) return 0;
  const { data: members } = await db.from("memberships").select("character_id, characters!inner(player_id)").eq("organization_id", p.organizationId);
  const { data: votes } = await db.from("votes").select("character_id").eq("motion_id", p.motionId);
  const voted = new Set((votes ?? []).map((v) => v.character_id as string));
  let n = 0;
  for (const m of members ?? []) {
    const id = m.character_id as string;
    if (!away.has(id) || voted.has(id)) continue;
    await db.from("votes").insert({ motion_id: p.motionId, character_id: id, choice: "abstain", weight: 1, cast_round: p.round, source: "leave", secret: false });
    n++;
  }
  return n;
}
