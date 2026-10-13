/* Rounds and episodes: opening the next round at dispatch time. Round 1 is
   Monday, October 10, 1977; fourteen rounds to an episode. The lock cron
   closes a round at the campaign's lock time; this opens the next one at the
   campaign's dispatch time, so between the two there is no open round and
   orders wait for the morning (letters, forms and commands still work). */
import type { SupabaseClient } from "@supabase/supabase-js";

export const EPISODE_TITLES = ["Orientation", "The Harvest", "The Devil Cult", "The Church at Tagus", "The Unfinished Descent", "The Sons of Sam", "SENTINEL", "The Minot Winter", "The Omega Hypothesis", "Drawing 68-24", "The Threshold", "The Opening"];

/* The next occurrence of a wall-clock time (HH:MM[:SS]) in a time zone, strictly after `from`. */
export function nextWallClock(tz: string, hhmm: string, from = new Date()): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const local = new Date(from.toLocaleString("en-US", { timeZone: tz }));
  const offset = from.getTime() - local.getTime();       // how far local-as-UTC sits from real UTC
  const at = new Date(local); at.setHours(h, m ?? 0, 0, 0);
  if (at <= local) at.setDate(at.getDate() + 1);
  return new Date(at.getTime() + offset);
}

export type RoundRow = { id: string; number: number; episode_round: number | null; episode_id: string | null; opens_at: string; locks_at: string; status: string };

export async function rule<T>(db: SupabaseClient, campaignId: string, key: string, fallback: T): Promise<T> {
  const { data } = await db.from("rules").select("value").eq("campaign_id", campaignId).eq("key", key).maybeSingle();
  return (data?.value as T | undefined) ?? fallback;
}

/* Open the next round unless one is open. Returns the open round and whether this call opened it. */
export async function openNextRound(db: SupabaseClient, campaignId: string, now = new Date()): Promise<{ round: RoundRow; opened: boolean }> {
  const { data: open } = await db.from("rounds").select("id, number, episode_round, episode_id, opens_at, locks_at, status").eq("campaign_id", campaignId).eq("status", "open").maybeSingle();
  if (open) return { round: open as RoundRow, opened: false };
  const { data: campaign } = await db.from("campaigns").select("timezone, lock_time").eq("id", campaignId).single();
  const { data: latest } = await db.from("rounds").select("number").eq("campaign_id", campaignId).order("number", { ascending: false }).limit(1).maybeSingle();
  const perEpisode = Number(await rule(db, campaignId, "episode.rounds", 14));
  const number = (latest?.number ?? 0) + 1;
  const epNo = Math.floor((number - 1) / perEpisode) + 1;
  const epRound = ((number - 1) % perEpisode) + 1;
  const { data: ep0 } = await db.from("episodes").select("id").eq("campaign_id", campaignId).eq("number", epNo).maybeSingle();
  let episodeId = ep0?.id as string | undefined;
  if (!episodeId) {
    const { data: ep } = await db.from("episodes").insert({ campaign_id: campaignId, number: epNo, title: EPISODE_TITLES[epNo - 1] ?? `Episode ${epNo}`, starts_round: (epNo - 1) * perEpisode + 1, status: "active" }).select("id").single();
    episodeId = ep?.id as string;
    if (epNo > 1) await db.from("episodes").update({ status: "complete" }).eq("campaign_id", campaignId).eq("number", epNo - 1);
  } else if (epRound === 1) await db.from("episodes").update({ status: "active" }).eq("id", episodeId);
  const locksAt = nextWallClock(campaign?.timezone ?? "America/New_York", (campaign?.lock_time as string | undefined) ?? "20:00", now);
  const { data: round, error } = await db.from("rounds").insert({ campaign_id: campaignId, episode_id: episodeId, number, episode_round: epRound, opens_at: now.toISOString(), locks_at: locksAt.toISOString(), status: "open" }).select("id, number, episode_round, episode_id, opens_at, locks_at, status").single();
  if (error) throw new Error(error.message);
  await db.from("events").insert({ campaign_id: campaignId, round_id: round.id, phase: "open", kind: "round.opened", payload: { number, episode: epNo, episode_round: epRound, locks_at: locksAt.toISOString() }, idempotency_key: `open:${round.id}` });
  return { round: round as RoundRow, opened: true };
}

/* Queue a morning dispatch for every active player character in a round, once each. */
export async function queueMorningDispatches(db: SupabaseClient, campaignId: string, roundId: string): Promise<number> {
  const { data: pcs } = await db.from("characters").select("id").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null);
  const { data: done } = await db.from("events").select("payload").eq("round_id", roundId).eq("kind", "dispatch.sent");
  const sent = new Set((done ?? []).map((e) => (e.payload as { character: string }).character));
  const { data: queued } = await db.from("jobs").select("payload").eq("kind", "morning_dispatch").is("done_at", null);
  const pending = new Set((queued ?? []).map((j) => `${(j.payload as { round_id: string }).round_id}:${(j.payload as { character_id: string }).character_id}`));
  const todo = (pcs ?? []).filter((c) => !sent.has(c.id) && !pending.has(`${roundId}:${c.id}`));
  if (todo.length) await db.from("jobs").insert(todo.map((c) => ({ kind: "morning_dispatch", payload: { round_id: roundId, character_id: c.id } })));
  return todo.length;
}
