import type { SupabaseClient } from "@supabase/supabase-js";
import { DEPARTMENTS, GOALS } from "@/lib/game/creation";
import { newMessageId } from "@/lib/email/resend";

/* Personal Goals and the season standings. A goal's text and points are
   player-facing; the condition that decides it is in secret canon and is
   judged by the showrunner in the console. Score is the sum of points awarded
   on met goals. Table: character_goals (migration 0010). */

export type GoalStatus = "open" | "met" | "failed" | "withdrawn";
export type Goal = { id: string; goalKey: string | null; text: string; deadline: string | null; points: number; status: GoalStatus; awarded: number | null; note: string | null; assignedRound: number | null; decidedRound: number | null };

const COLS = "id, goal_key, text, deadline, points, status, awarded, note, assigned_round, decided_round";
const toGoal = (r: Record<string, unknown>): Goal => ({ id: r.id as string, goalKey: (r.goal_key as string | null) ?? null, text: r.text as string, deadline: (r.deadline as string | null) ?? null, points: r.points as number, status: r.status as GoalStatus, awarded: (r.awarded as number | null) ?? null, note: (r.note as string | null) ?? null, assignedRound: (r.assigned_round as number | null) ?? null, decidedRound: (r.decided_round as number | null) ?? null });

/* Give a character a goal from the pool. Idempotent: a character holds a pooled goal once. */
export async function assignGoal(db: SupabaseClient, p: { campaignId: string; characterId: string; goalKey: string; round?: number | null }) {
  const g = GOALS[p.goalKey];
  if (!g) throw new Error(`unknown goal ${p.goalKey}`);
  await db.from("character_goals").upsert({ campaign_id: p.campaignId, character_id: p.characterId, goal_key: p.goalKey, text: g.text, deadline: g.deadline, points: g.points, assigned_round: p.round ?? 1 }, { onConflict: "character_id,goal_key", ignoreDuplicates: true });
}

/* The episode's pool, dealt out. On days 1 and 2 of an episode every goal in that
   episode's pool that nobody holds goes to a player: one whose department the
   pool names for it where it names one, otherwise whoever has the fewest open
   goals; nobody takes a third open goal. The supervisor writes to say so, and
   the letter threads so the reply reaches them. Idempotent per goal. A cohort of
   six drew six of Episode 1's nine in sim-ep1-pulls and nobody worked the vote. */
export async function dealUnheldGoals(db: SupabaseClient, campaignId: string, round: { id: string; number: number; episode: number; episodeRound: number }): Promise<{ dealt: number }> {
  if (round.episodeRound > 2) return { dealt: 0 };
  const pool = Object.keys(GOALS).filter((k) => k.startsWith(`ep${round.episode}-`));
  if (!pool.length) return { dealt: 0 };
  const { data: pcs } = await db.from("characters").select("id, name, slug, supervisor_id, divisions(slug), players(email)").eq("campaign_id", campaignId).eq("status", "active").not("player_id", "is", null);
  const players = (pcs ?? []).map((c) => ({ id: c.id as string, name: c.name as string, division: ((Array.isArray(c.divisions) ? c.divisions[0] : c.divisions) as { slug: string } | null)?.slug ?? null, supervisor: (c.supervisor_id as string | null) ?? null, email: ((Array.isArray(c.players) ? c.players[0] : c.players) as { email: string } | null)?.email ?? null }));
  if (!players.length) return { dealt: 0 };
  const { data: held } = await db.from("character_goals").select("character_id, goal_key, status").eq("campaign_id", campaignId).in("goal_key", pool);
  const taken = new Set((held ?? []).filter((g) => g.status !== "withdrawn").map((g) => g.goal_key as string));
  const { data: open } = await db.from("character_goals").select("character_id").eq("campaign_id", campaignId).eq("status", "open");
  const openCount = new Map<string, number>(); for (const g of open ?? []) openCount.set(g.character_id as string, (openCount.get(g.character_id as string) ?? 0) + 1);
  let dealt = 0;
  for (const key of pool.filter((k) => !taken.has(k)).sort()) {
    const wanted = Object.entries(DEPARTMENTS).filter(([, d]) => d.goals.includes(key)).map(([slug]) => slug);
    const eligible = players.filter((p) => (openCount.get(p.id) ?? 0) < 3);
    const pick = [...eligible].sort((a, b) => (Number(wanted.includes(b.division ?? "")) - Number(wanted.includes(a.division ?? ""))) || ((openCount.get(a.id) ?? 0) - (openCount.get(b.id) ?? 0)) || a.name.localeCompare(b.name))[0];
    if (!pick) break;
    await assignGoal(db, { campaignId, characterId: pick.id, goalKey: key, round: round.number });
    openCount.set(pick.id, (openCount.get(pick.id) ?? 0) + 1); dealt++;
    const g = GOALS[key];
    const { data: sup } = pick.supervisor ? await db.from("characters").select("id, name, title").eq("id", pick.supervisor).maybeSingle() : { data: null };
    const body = `${pick.name.split(" ")[0]},\n\nPersonnel has placed a second matter on your file, and it falls to this office to tell you so. ${g.text} The deadline is ${g.deadline}; the particulars, and where to begin, are on your personnel file under Goals.\n\nThis is in addition to anything already on your file, not in place of it.\n\n${sup ? `${sup.name}${sup.title ? `, ${sup.title}` : ""}` : "Personnel & Administration"}`;
    const { data: row } = await db.from("correspondence").insert({ campaign_id: campaignId, round_id: round.id, direction: "outbound", message_id: newMessageId(), from_character: sup?.id ?? null, to_characters: [pick.id], to_addresses: pick.email ? [pick.email] : [], subject: "A second matter for your file", body_text: body, raw: { letter_kind: "memo", classification: "Confidential", goal_offer: key, office: sup ? null : { office: "Personnel & Administration" } } }).select("id").single();
    if (row && pick.email) await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
    await db.from("events").insert({ campaign_id: campaignId, round_id: round.id, phase: "open", kind: "goal.offered", payload: { character: pick.id, goal_key: key, text: g.text, round: round.number, correspondence_id: row?.id ?? null }, idempotency_key: `goal-offer:${campaignId}:${key}`, visible_to: [pick.id] });
  }
  return { dealt };
}

export async function goalsFor(db: SupabaseClient, characterId: string): Promise<Goal[]> {
  const { data } = await db.from("character_goals").select(COLS).eq("character_id", characterId).neq("status", "withdrawn").order("created_at");
  return (data ?? []).map(toGoal);
}

export const scoreOf = (goals: Goal[]) => goals.reduce((n, g) => n + (g.status === "met" ? g.awarded ?? g.points : 0), 0);

export type Standing = { characterId: string; name: string; title: string | null; divisionId: string | null; score: number; met: number; open: number; rank: number };

/* Every player character in the season, highest score first; ties share a rank. */
export async function standings(db: SupabaseClient, campaignId: string): Promise<Standing[]> {
  const [{ data: chars }, { data: goals }] = await Promise.all([
    db.from("characters").select("id, name, title, division_id").eq("campaign_id", campaignId).not("player_id", "is", null).in("status", ["active", "missing"]),
    db.from("character_goals").select("character_id, status, points, awarded").eq("campaign_id", campaignId),
  ]);
  const rows = (chars ?? []).map((c) => {
    const mine = (goals ?? []).filter((g) => g.character_id === c.id);
    return {
      characterId: c.id as string, name: c.name as string, title: (c.title as string | null) ?? null, divisionId: (c.division_id as string | null) ?? null,
      score: mine.reduce((n, g) => n + (g.status === "met" ? (g.awarded as number | null) ?? (g.points as number) : 0), 0),
      met: mine.filter((g) => g.status === "met").length, open: mine.filter((g) => g.status === "open").length, rank: 0,
    };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  rows.forEach((r, i) => { r.rank = i && rows[i - 1].score === r.score ? rows[i - 1].rank : i + 1; });
  return rows;
}
