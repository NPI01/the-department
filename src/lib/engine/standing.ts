/* Standing orders (rulebook §6.4): an order that repeats every round until
   cancelled. STANDING ORDER: <order> files it (a menu letter doubled, "CC",
   does the same for option C); CANCEL STANDING <n> ends it; the dispatch and
   every receipt list them by number. Each night the validate phase copies
   every active one into the character's packet before funding, at the full
   price the first night and the upkeep after, so an unfunded standing order
   simply does not run that night. A missed turn suspends them; a hold keeps
   them. The price and steps were fixed when it was filed. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { rule } from "./rounds";

type Db = SupabaseClient;
export const STANDING_UPKEEP = 2;

export type Standing = { id: string; seq: number; verb: string; args: Record<string, unknown>; label: string; created_round: number; last_run_round: number | null };

export async function listStanding(db: Db, characterId: string): Promise<Standing[]> {
  const { data } = await db.from("standing_orders").select("id, seq, verb, args, label, created_round, last_run_round").eq("character_id", characterId).eq("status", "active").order("seq");
  return (data ?? []) as Standing[];
}

export async function fileStanding(db: Db, p: { campaignId: string; characterId: string; round: number; verb: string; args: Record<string, unknown>; label: string }): Promise<Standing> {
  const { data: last } = await db.from("standing_orders").select("seq").eq("character_id", p.characterId).order("seq", { ascending: false }).limit(1).maybeSingle();
  const seq = Number(last?.seq ?? 0) + 1;
  const { data, error } = await db.from("standing_orders").insert({ campaign_id: p.campaignId, character_id: p.characterId, seq, verb: p.verb, args: p.args, label: p.label, created_round: p.round }).select("id, seq, verb, args, label, created_round, last_run_round").single();
  if (error) throw new Error(error.message);
  return data as Standing;
}

export async function cancelStanding(db: Db, characterId: string, seq: number, round: number): Promise<Standing | null> {
  const { data } = await db.from("standing_orders").select("id, seq, verb, args, label, created_round, last_run_round").eq("character_id", characterId).eq("seq", seq).eq("status", "active").maybeSingle();
  if (!data) return null;
  await db.from("standing_orders").update({ status: "cancelled", cancelled_round: round }).eq("id", data.id);
  return data as Standing;
}

/* At the validate phase, before funding: every active standing order into its
   character's packet. A character with no packet, or a missed turn, has them
   suspended for the night. Idempotent on (packet, standing id). */
export async function enqueueStanding(db: Db, round: { campaignId: string; id: string; number: number }): Promise<{ queued: number; suspended: number }> {
  const upkeep = Number(await rule(db, round.campaignId, "au.standing_upkeep", STANDING_UPKEEP));
  const { data: rows } = await db.from("standing_orders").select("id, character_id, seq, verb, args, label, created_round, last_run_round").eq("campaign_id", round.campaignId).eq("status", "active").order("character_id").order("seq");
  let queued = 0, suspended = 0;
  for (const so of rows ?? []) {
    const { data: pk } = await db.from("order_packets").select("id, mode").eq("round_id", round.id).eq("character_id", so.character_id).maybeSingle();
    if (!pk || pk.mode === "missed") { suspended++; continue; }
    const { data: dup } = await db.from("orders").select("id").eq("packet_id", pk.id).eq("standing", true).contains("args", { standing_id: so.id }).maybeSingle();
    if (dup) continue;
    const { data: last } = await db.from("orders").select("seq").eq("packet_id", pk.id).order("seq", { ascending: false }).limit(1).maybeSingle();
    const first = so.last_run_round === null;
    const args = so.args as Record<string, unknown>;
    const cost = first ? Number(args.cost ?? 5) : upkeep;
    await db.from("orders").insert({ packet_id: pk.id, seq: Number(last?.seq ?? 0) + 1, verb: so.verb, args: { ...args, cost, standing: so.seq, standing_id: so.id, first_night: first }, standing: true });
    await db.from("standing_orders").update({ last_run_round: round.number }).eq("id", so.id);
    queued++;
  }
  return { queued, suspended };
}
