/* The induction grace (rulebook §4.5; after Quest's No Attack status). For a
   new hire's first rounds nobody can take from their desk or report them to
   Security, hostile colleagues' sightings of them are not passed on, and they
   can do none of those things themselves. It ends on its own after
   GRACE_ROUNDS rounds, or the first time the new hire takes a hostile act
   (OBTAIN from a colleague, REPORT a colleague, ATTITUDE … HOSTILE), or when
   they send WAIVE GRACE. It never comes back. The end is a fact; the start is
   the first round that opened after the character was hired. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { rule } from "./rounds";

type Db = SupabaseClient;
export const GRACE_ROUNDS = 5;

export type Grace = { until: number } | null;

export async function underGrace(db: Db, campaignId: string, characterId: string, roundNo: number): Promise<Grace> {
  const { data: ended } = await db.from("facts").select("key").eq("campaign_id", campaignId).eq("key", `grace.${characterId}.ended`).maybeSingle();
  if (ended) return null;
  const { data: ch } = await db.from("characters").select("created_at, player_id").eq("id", characterId).single();
  if (!ch?.player_id) return null;
  const { data: first } = await db.from("rounds").select("number").eq("campaign_id", campaignId).gte("opens_at", ch.created_at as string).order("number").limit(1).maybeSingle();
  const start = Number(first?.number ?? roundNo);
  const n = Number(await rule(db, campaignId, "grace.rounds", GRACE_ROUNDS));
  const until = start + n - 1;
  return roundNo <= until ? { until } : null;
}

export async function graceSet(db: Db, campaignId: string, roundNo: number, characterIds: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  for (const id of characterIds) if (await underGrace(db, campaignId, id, roundNo)) out.add(id);
  return out;
}

export async function endGrace(db: Db, campaignId: string, characterId: string, roundNo: number, why: string): Promise<boolean> {
  const had = await underGrace(db, campaignId, characterId, roundNo);
  if (!had) return false;
  await db.from("facts").upsert({ campaign_id: campaignId, key: `grace.${characterId}.ended`, value: { round: roundNo, why }, established_round: roundNo, secret: true }, { onConflict: "campaign_id,key" });
  await db.from("events").insert({ campaign_id: campaignId, kind: "grace.ended", payload: { character: characterId, round: roundNo, why }, idempotency_key: `grace:${characterId}:ended`, visible_to: [characterId] });
  return true;
}
