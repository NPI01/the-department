import type { SupabaseClient } from "@supabase/supabase-js";
import { GOALS } from "@/lib/game/creation";

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
