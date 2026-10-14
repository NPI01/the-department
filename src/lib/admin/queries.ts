import { cache } from "react";
import { cookies } from "next/headers";
import { adminDb } from "./auth";
import { activityWith, namesWith } from "./activity";

/* Every read the console makes. Each starts at adminDb(), which verifies the
   admin before handing out the service-role client. The DB client is untyped
   (no generated types yet), so the row shapes the console uses are named here. */

export type Campaign = { id: string; slug: string; title: string; timezone: string; lock_time: string; dispatch_time: string; status: string; created_at: string };
export type Episode = { id: string; campaign_id: string; number: number; title: string; premise: string | null; starts_round: number | null; status: string };
export type Round = { id: string; campaign_id: string; episode_id: string | null; number: number; episode_round: number | null; opens_at: string; locks_at: string; status: string; resolved_at: string | null };
export type Character = {
  id: string; campaign_id: string; player_id: string | null; slug: string; name: string; title: string | null; division_id: string | null;
  clearance: number; specialization: string | null; public_profile: string | null; npc_state: Record<string, unknown> | null; status: string; created_at: string;
};
export type Player = { id: string; user_id: string | null; email: string; display_name: string | null; consent_ai_processing_at: string | null; created_at: string };
export type Application = {
  id: string; status: string; name: string; bio: string | null; identity: string; specialization: string; dept_prefs: string[];
  trait_favorite: string | null; trait_hated: string | null; unexplained: boolean; unexplained_text: string | null; near_death: boolean; near_death_text: string | null; deja_vu: string | null;
  skills: string[]; knowledge: string[]; points_total: number; points_spent: number; timezone: string | null; submitted_at: string; decided_at: string | null; decision_note: string | null; character_id: string | null;
};
export type Subscription = {
  id: string; player_id: string; provider: string; plan: string; status: string; amount_cents: number | null; currency: string | null;
  started_at: string; current_period_end: string | null; cancel_at: string | null; canceled_at: string | null; notes: string | null; provider_customer_id: string | null;
};
export type Motion = {
  id: string; organization_id: string; number: string | null; title: string; text: string | null; kind: string; sponsor_id: string | null;
  threshold: { method: string; fraction?: number }; opens_round: number; closes_round: number; status: string;
};
export type Vote = { motion_id: string; character_id: string; choice: "for" | "against" | "abstain"; weight: number; cast_round: number; source: string; secret: boolean };
export type EventRow = { id: number; round_id: string | null; phase: string | null; kind: string; payload: Record<string, unknown>; visible_to: string[] | null; created_at: string };
export type Agreement = { id: string; kind: string; title: string | null; terms: unknown; parties: string[]; accepted_by: string[]; status: string; proposed_round: number | null; expires_round: number | null };
export type Mail = { id: string; direction: string; subject: string | null; body_text: string; from_character: string | null; from_address: string | null; to_characters: string[]; received_at: string; trusted: boolean; round_id: string | null };

const SEASON_COOKIE = "admin_season";

/* ---------- seasons ---------- */

export const getSeasons = cache(async () => {
  const db = await adminDb();
  const { data } = await db.from("campaigns").select("*").order("created_at", { ascending: false });
  const seasons = (data ?? []) as Campaign[];
  const chosen = (await cookies()).get(SEASON_COOKIE)?.value;
  const season = seasons.find((c) => c.slug === chosen) ?? seasons.find((c) => c.status === "active") ?? seasons[0] ?? null;
  return { season, seasons };
});

export { SEASON_COOKIE };

export const getCalendar = cache(async (campaignId: string) => {
  const db = await adminDb();
  const [{ data: episodes }, { data: rounds }] = await Promise.all([
    db.from("episodes").select("*").eq("campaign_id", campaignId).order("number"),
    db.from("rounds").select("*").eq("campaign_id", campaignId).order("number"),
  ]);
  return { episodes: (episodes ?? []) as Episode[], rounds: (rounds ?? []) as Round[] };
});

/* "Today" in the game: the open round; else the latest round that has opened;
   else the first scheduled one. */
export function todayOf(rounds: Round[], now = Date.now()): Round | null {
  const open = rounds.find((r) => r.status === "open");
  if (open) return open;
  const started = rounds.filter((r) => new Date(r.opens_at).getTime() <= now);
  return started.at(-1) ?? rounds[0] ?? null;
}

export async function getSeasonCounts(campaignId: string) {
  const db = await adminDb();
  const base = (table: string) => db.from(table).select("id", { count: "exact", head: true }).eq("campaign_id", campaignId);
  const count = async (q: ReturnType<typeof base>) => (await q).count ?? 0;
  const [episodes, rounds, characters, pcs, motions, mail] = await Promise.all([
    count(base("episodes")), count(base("rounds")), count(base("characters")),
    count(base("characters").not("player_id", "is", null)),
    count(base("motions")), count(base("correspondence")),
  ]);
  return { episodes, rounds, characters, npcs: characters - pcs, pcs, motions, mail };
}

export async function getRules(campaignId: string) {
  const db = await adminDb();
  const { data } = await db.from("rules").select("key, value, effective_from_round, effective_to_round, enacted_by").eq("campaign_id", campaignId).order("key").order("effective_from_round");
  return (data ?? []) as { key: string; value: unknown; effective_from_round: number; effective_to_round: number | null; enacted_by: string | null }[];
}

/* ---------- names ---------- */

export async function characterNames(campaignId: string) {
  return namesWith(await adminDb(), campaignId);
}

/* ---------- decisions, by day ---------- */

export type Decision = Motion & {
  organization: string; sponsor: string | null; votes: (Vote & { name: string; pc: boolean })[];
  seats: number; absent: string[]; tally: { for: number; against: number; abstain: number };
};

/* Motions that close on `round` (what is decided that day), with every vote. */
export async function decisionsFor(campaignId: string, round: number): Promise<{ closing: Decision[]; opening: Decision[]; agreements: Agreement[] }> {
  const db = await adminDb();
  const [{ data: closing }, { data: opening }, { data: agreements }, names] = await Promise.all([
    db.from("motions").select("*").eq("campaign_id", campaignId).eq("closes_round", round).order("number"),
    db.from("motions").select("*").eq("campaign_id", campaignId).eq("opens_round", round).neq("closes_round", round).order("number"),
    db.from("agreements").select("*").eq("campaign_id", campaignId).or(`expires_round.eq.${round},proposed_round.eq.${round}`),
    characterNames(campaignId),
  ]);
  const all = [...(closing ?? []), ...(opening ?? [])] as Motion[];
  const ids = all.map((m) => m.id);
  const orgIds = [...new Set(all.map((m) => m.organization_id))];
  const [{ data: votes }, { data: orgs }, { data: members }] = await Promise.all([
    ids.length ? db.from("votes").select("*").in("motion_id", ids) : Promise.resolve({ data: [] }),
    orgIds.length ? db.from("organizations").select("id, name").in("id", orgIds) : Promise.resolve({ data: [] }),
    orgIds.length ? db.from("memberships").select("organization_id, character_id").in("organization_id", orgIds) : Promise.resolve({ data: [] }),
  ]);
  const orgName = new Map(((orgs ?? []) as { id: string; name: string }[]).map((o) => [o.id, o.name]));
  const seatsOf = (orgId: string) => ((members ?? []) as { organization_id: string; character_id: string }[]).filter((m) => m.organization_id === orgId).map((m) => m.character_id);
  const enrich = (m: Motion): Decision => {
    const vs = ((votes ?? []) as Vote[]).filter((v) => v.motion_id === m.id).map((v) => ({ ...v, name: names.get(v.character_id)?.name ?? "Unknown", pc: Boolean(names.get(v.character_id)?.player_id) }));
    vs.sort((a, b) => a.choice.localeCompare(b.choice) || a.name.localeCompare(b.name));
    const w = (c: string) => vs.filter((v) => v.choice === c).reduce((n, v) => n + Number(v.weight), 0);
    return { ...m, organization: orgName.get(m.organization_id) ?? "—", sponsor: m.sponsor_id ? names.get(m.sponsor_id)?.name ?? null : null, votes: vs, seats: seatsOf(m.organization_id).length, absent: seatsOf(m.organization_id).filter((c) => !vs.some((v) => v.character_id === c)).map((c) => names.get(c)?.name ?? "Unknown").sort(), tally: { for: w("for"), against: w("against"), abstain: w("abstain") } };
  };
  return { closing: ((closing ?? []) as Motion[]).map(enrich), opening: ((opening ?? []) as Motion[]).map(enrich), agreements: (agreements ?? []) as Agreement[] };
}

/* Rounds that have at least one decision, for the timeline markers. */
export async function decisionRounds(campaignId: string) {
  const db = await adminDb();
  const { data } = await db.from("motions").select("closes_round").eq("campaign_id", campaignId);
  const m = new Map<number, number>();
  for (const r of (data ?? []) as { closes_round: number }[]) m.set(r.closes_round, (m.get(r.closes_round) ?? 0) + 1);
  return m;
}

export async function dayDetail(campaignId: string, round: Round) {
  const db = await adminDb();
  const [{ data: events }, { data: packets }, { count: mail }] = await Promise.all([
    db.from("events").select("id, round_id, phase, kind, payload, visible_to, created_at").eq("round_id", round.id).order("id"),
    db.from("order_packets").select("id, character_id, mode, source, locked_at, orders(seq, verb, args, status, ruling, standing)").eq("round_id", round.id),
    db.from("correspondence").select("id", { count: "exact", head: true }).eq("round_id", round.id),
  ]);
  return {
    events: (events ?? []) as EventRow[],
    packets: (packets ?? []) as { id: string; character_id: string; mode: string; source: string; locked_at: string | null; orders: { seq: number; verb: string; args: Record<string, unknown>; status: string; ruling: string | null; standing: boolean }[] }[],
    mail: mail ?? 0,
  };
}

/* ---------- casting call ---------- */

export async function getCast(campaignId: string) {
  const db = await adminDb();
  const [{ data: chars }, { data: divs }, { data: players }] = await Promise.all([
    db.from("characters").select("*").eq("campaign_id", campaignId).order("name"),
    db.from("divisions").select("id, name, slug").eq("campaign_id", campaignId),
    db.from("players").select("id, email, display_name"),
  ]);
  const division = new Map(((divs ?? []) as { id: string; name: string }[]).map((d) => [d.id, d.name]));
  const player = new Map(((players ?? []) as Player[]).map((p) => [p.id, p]));
  return ((chars ?? []) as Character[]).map((c) => ({ ...c, division: c.division_id ? division.get(c.division_id) ?? null : null, player: c.player_id ? player.get(c.player_id) ?? null : null }));
}

export async function getCharacter(id: string) {
  const db = await adminDb();
  const { data: c } = await db.from("characters").select("*").eq("id", id).maybeSingle();
  if (!c) return null;
  const ch = c as Character;
  const [{ data: div }, { data: player }, { data: resources }, { data: assets }, { data: memberships }, { data: rels }, { data: aliases }, { data: mail }, names] = await Promise.all([
    ch.division_id ? db.from("divisions").select("name").eq("id", ch.division_id).maybeSingle() : Promise.resolve({ data: null }),
    ch.player_id ? db.from("players").select("*").eq("id", ch.player_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("resources").select("kind, balance, cap").eq("character_id", id),
    db.from("assets").select("kind, name, tier, secret").eq("holder_id", id),
    db.from("memberships").select("role, voting_weight, since_round, until_round, organizations(name)").eq("character_id", id),
    db.from("relationships").select("to_character, trust, obligation, hostility").eq("from_character", id),
    db.from("aliases").select("mailbox, label").eq("character_id", id),
    db.from("correspondence").select("id, direction, subject, from_character, to_characters, received_at").or(`from_character.eq.${id},to_characters.cs.{${id}}`).order("received_at", { ascending: false }).limit(15),
    characterNames(ch.campaign_id),
  ]);
  return {
    character: ch,
    division: (div as { name: string } | null)?.name ?? null,
    player: player as Player | null,
    resources: (resources ?? []) as { kind: string; balance: number; cap: number | null }[],
    assets: (assets ?? []) as { kind: string; name: string; tier: string | null; secret: boolean }[],
    memberships: (memberships ?? []) as unknown as { role: string | null; voting_weight: number; since_round: number | null; until_round: number | null; organizations: { name: string } | null }[],
    relationships: ((rels ?? []) as { to_character: string; trust: number; obligation: number; hostility: boolean }[]).map((r) => ({ ...r, name: names.get(r.to_character)?.name ?? "Unknown" })),
    aliases: (aliases ?? []) as { mailbox: string; label: string | null }[],
    mail: (mail ?? []) as Mail[],
    names,
  };
}

/* ---------- players ---------- */

export async function getPlayers(campaignId: string | null) {
  const db = await adminDb();
  const { data: players } = await db.from("players").select("*").order("created_at", { ascending: false });
  const list = (players ?? []) as Player[];
  const ids = list.map((p) => p.id);
  if (!ids.length) return [];
  const [{ data: subs }, { data: chars }, { data: apps }] = await Promise.all([
    db.from("subscriptions").select("*").in("player_id", ids).order("started_at", { ascending: false }),
    campaignId ? db.from("characters").select("id, name, player_id, status").eq("campaign_id", campaignId).in("player_id", ids) : Promise.resolve({ data: [] }),
    campaignId ? db.from("applications").select("player_id, status").eq("campaign_id", campaignId).in("player_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const appByPlayer = new Map(((apps ?? []) as { player_id: string; status: string }[]).map((a) => [a.player_id, a]));
  const charByPlayer = new Map(((chars ?? []) as { id: string; name: string; player_id: string; status: string }[]).map((c) => [c.player_id, c]));
  const charIds = [...charByPlayer.values()].map((c) => c.id);
  const { data: lastMail } = charIds.length
    ? await db.from("correspondence").select("from_character, received_at").in("from_character", charIds).order("received_at", { ascending: false }).limit(1000)
    : { data: [] };
  const last = new Map<string, string>();
  for (const m of (lastMail ?? []) as { from_character: string; received_at: string }[]) if (!last.has(m.from_character)) last.set(m.from_character, m.received_at);
  return list.map((p) => {
    const sub = ((subs ?? []) as Subscription[]).find((s) => s.player_id === p.id) ?? null;
    const character = charByPlayer.get(p.id) ?? null;
    return { ...p, subscription: sub, character, application: appByPlayer.get(p.id) ?? null, lastActive: character ? last.get(character.id) ?? null : null };
  });
}

export async function getPlayer(id: string, campaignId: string | null) {
  const db = await adminDb();
  const { data: p } = await db.from("players").select("*").eq("id", id).maybeSingle();
  if (!p) return null;
  const player = p as Player;
  const [{ data: subs }, { data: chars }, { data: briefs }, { data: application }] = await Promise.all([
    db.from("subscriptions").select("*").eq("player_id", id).order("started_at", { ascending: false }),
    db.from("characters").select("*").eq("player_id", id),
    campaignId ? db.from("applications").select("*").eq("player_id", id).eq("campaign_id", campaignId).maybeSingle() : Promise.resolve({ data: null }),
    db.from("player_briefs").select("*").eq("player_id", id).order("created_at", { ascending: false }).limit(5),
  ]);
  const characters = (chars ?? []) as Character[];
  const character = characters.find((c) => c.campaign_id === campaignId) ?? characters[0] ?? null;
  const activity = character ? await characterActivity(character) : null;
  return {
    player,
    subscriptions: (subs ?? []) as Subscription[],
    character,
    activity,
    briefs: (briefs ?? []) as { id: string; status: string; body: string | null; model: string | null; through_round: number | null; error: string | null; created_at: string; finished_at: string | null }[],
    application: application as Application | null,
  };
}

export async function characterActivity(character: Character) {
  return activityWith(await adminDb(), character);
}

/* ---------- engine ---------- */

export async function getEngine() {
  const db = await adminDb();
  const [{ data: models }, { data: ledger }, { data: jobs }, { data: failed }, { data: cron }, { data: cronRecent }] = await Promise.all([
    db.from("admin_model_stats").select("*"),
    db.from("model_ledger").select("*").order("id", { ascending: false }).limit(25),
    db.from("admin_job_stats").select("*"),
    db.from("jobs").select("id, kind, attempts, max_attempts, error, run_after, done_at, created_at").not("error", "is", null).order("id", { ascending: false }).limit(10),
    db.from("admin_cron_latest").select("*"),
    db.from("cron_runs").select("*").order("id", { ascending: false }).limit(12),
  ]);
  return {
    models: (models ?? []) as { model: string; calls_24h: number; ok_24h: number; p50_ms: number | null; p95_ms: number | null; prompt_tokens_24h: number; completion_tokens_24h: number; last_ok_at: string | null; last_error_at: string | null }[],
    ledger: (ledger ?? []) as { id: number; tag: string; model: string; ok: boolean; status: number | null; ms: number | null; prompt_tokens: number | null; completion_tokens: number | null; error: string | null; created_at: string }[],
    jobs: (jobs ?? []) as { kind: string; queued: number; running: number; due: number; failed: number; retrying: number; done_24h: number; oldest_pending: string | null }[],
    failed: (failed ?? []) as { id: number; kind: string; attempts: number; max_attempts: number; error: string; run_after: string; done_at: string | null; created_at: string }[],
    cron: (cron ?? []) as { route: string; started_at: string; finished_at: string | null; ok: boolean | null; detail: Record<string, unknown> | null }[],
    cronRecent: (cronRecent ?? []) as { id: number; route: string; started_at: string; finished_at: string | null; ok: boolean | null; detail: Record<string, unknown> | null }[],
  };
}

/* Cron cadence from vercel.json, in ms, and how late counts as stale. */
export const CRON_EXPECT: Record<string, { every: string; staleAfter: number }> = {
  tick: { every: "daily, 00:00 UTC", staleAfter: 26 * 3600_000 },
  dispatch: { every: "daily, 13:00 UTC", staleAfter: 26 * 3600_000 },
  work: { every: "every minute", staleAfter: 5 * 60_000 },
};
