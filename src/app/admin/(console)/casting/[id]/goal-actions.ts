"use server";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentRound } from "@/lib/game/case-file";
import { assignGoal } from "@/lib/game/goals";

export async function decideGoal(fd: FormData) {
  await requireAdmin();
  const db = supabaseAdmin();
  const id = String(fd.get("goal_id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!["met", "failed", "open"].includes(status)) return;
  const { data: g } = await db.from("character_goals").select("campaign_id, character_id, points").eq("id", id).single();
  if (!g) return;
  const awarded = Math.max(0, Math.min(100, Number(fd.get("awarded") ?? g.points) || 0));
  const note = String(fd.get("note") ?? "").trim().slice(0, 400) || null;
  const round = await currentRound(db, g.campaign_id as string);
  await db.from("character_goals").update(status === "open"
    ? { status, awarded: null, note, decided_round: null, decided_at: null }
    : { status, awarded: status === "met" ? awarded : null, note, decided_round: round, decided_at: new Date().toISOString() }).eq("id", id);
  await db.from("events").insert({ campaign_id: g.campaign_id, kind: `goal.${status}`, payload: { goal: id, character: g.character_id, awarded: status === "met" ? awarded : null }, visible_to: [g.character_id] });
  refresh();
}

export async function assignGoalAction(fd: FormData) {
  await requireAdmin();
  const db = supabaseAdmin();
  const goalKey = String(fd.get("goal_key") ?? "");
  const characterId = String(fd.get("character_id") ?? "");
  const campaignId = String(fd.get("campaign_id") ?? "");
  if (!goalKey || !characterId || !campaignId) return;
  await assignGoal(db, { campaignId, characterId, goalKey, round: await currentRound(db, campaignId) });
  refresh();
}
