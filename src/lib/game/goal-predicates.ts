/* Goals judged by the engine. A predicate is a small tree over what the engine
   already records: knowledge keys a character holds, Case File items, motion
   results, documents handed to members of a body. Judged every night; a goal
   whose predicate is true is met (points by timing where the goal says so).
   At the lock of its episode's last day an unmet goal fails, unless it is
   marked `review`, in which case it is left open and flagged for the
   showrunner. The predicates follow canon/secret/07; the knowledge keys are
   the ones the world files grant. PROPOSED 2026-10-13. */
import type { SupabaseClient } from "@supabase/supabase-js";

export type Pred =
  | { all: Pred[] } | { any: Pred[] }
  | { knows: string }                                   // a knowledge fact_key on the character
  | { holds: string }                                   // a Case File item slug (copies match by prefix)
  | { motion: string; result: "passed" | "failed" | "instructed" }   // instructed: facts goal.instruction.<goalId>, default "passed"
  | { sent_doc: { any_of: string[]; to_org: string } }  // handed a copy of one of these to a member of this body
  | { filed_form: string };                             // a form on file

export type GoalRule = {
  episode: number;
  pred: Pred;
  review?: boolean;                                     // engine proposes; the showrunner decides
  timing?: { before_day: number; points: number; after: number };   // points if met before this day of the episode, else `after`
  partial?: { pred: Pred; points: number };            // consolation if the full predicate fails at the end
};

export const GOAL_RULES: Record<string, GoalRule> = {
  "ep1-1": { episode: 1, pred: { any: [{ holds: "pgs-invoice-1974-original" }, { all: [{ holds: "pgs-field-log-sep-77" }, { knows: "pgs.concrete_to_empty_parcel_noticed" }] }] } },
  "ep1-2": { episode: 1, review: true, pred: { all: [{ holds: "sayer-letter-with-royce-layout" }, { any: [{ knows: "layout.draughtsman_hand_noticed" }, { knows: "greeley.corresponded_with_religious_group" }, { knows: "is.jt_batch_authority_covers_chr_recon" }] }] } },
  "ep1-3": { episode: 1, review: true, pred: { any: [{ holds: "sheriff-evidence-e76-19" }, { all: [{ holds: "orpheus-access-roster" }, { knows: "orpheus.third_fragment_with_sheriff_noticed" }] }] } },
  "ep1-4": { episode: 1, pred: { all: [{ knows: "personnel.ghost_employee_noticed" }, { knows: "marsh.transfer_notice_postdated_noticed" }, { any: [{ knows: "greeley.notebook_withheld_noticed" }, { knows: "greeley.timeline_gap_noticed" }] }] } },
  "ep1-5": { episode: 1, pred: { holds: "nightjar-test-log-77-on" }, timing: { before_day: 10, points: 15, after: 5 } },
  "ep1-6": { episode: 1, review: true, pred: { any: [{ motion: "R-77-002", result: "passed" }, { all: [{ holds: "harvest-lot-77b-sampling-order" }, { knows: "harvest.lot_77b_unsigned_noticed" }] }] } },
  "ep1-7": { episode: 1, pred: { all: [{ holds: "sentinel-contract-ledger-page" }, { knows: "finance.overrun_noticed" }] } },
  "ep1-8": { episode: 1, pred: { all: [{ holds: "is-job-log-oct-77" }, { knows: "is.future_jobs_unattended_noticed" }, { any: [{ holds: "jthorne-batch-authorizations" }, { knows: "is.chr_recon_authorized_before_it_existed_noticed" }, { knows: "is.operator_log_signed_by_wrong_hand_noticed" }] }] }, partial: { pred: { all: [{ holds: "is-job-log-oct-77" }, { knows: "is.future_jobs_unattended_noticed" }] }, points: 10 } },
  "ep1-9": { episode: 1, pred: { motion: "B-77-001", result: "instructed" } },
  "ep2-1": { episode: 2, review: true, pred: { all: [{ holds: "sheriff-case-ledger" }, { holds: "pgs-field-log-sep-77" }, { holds: "motor-pool-log-oct-77" }] } },
  "ep2-2": { episode: 2, pred: { sent_doc: { any_of: ["greeley-notebook", "greeley-notebook-page"], to_org: "Research Committee" } } },
  "ep2-3": { episode: 2, review: true, pred: { holds: "sheriff-evidence-e76-19" } },
  "ep2-4": { episode: 2, pred: { motion: "R-77-002", result: "instructed" } },
};

type State = {
  knows: Set<string>; holds: string[];
  motion: (n: string) => Promise<string | null>;
  instruction: (goalId: string) => Promise<"passed" | "failed">;
  sentTo: (slugs: string[], org: string) => Promise<boolean>;
  forms: Set<string>;
};

async function evaluate(p: Pred, s: State, goalId: string): Promise<boolean> {
  if ("all" in p) { for (const q of p.all) if (!(await evaluate(q, s, goalId))) return false; return true; }
  if ("any" in p) { for (const q of p.any) if (await evaluate(q, s, goalId)) return true; return false; }
  if ("knows" in p) return s.knows.has(p.knows);
  if ("holds" in p) return s.holds.some((h) => h === p.holds || h.startsWith(p.holds + "-from-"));
  if ("filed_form" in p) return s.forms.has(p.filed_form);
  if ("motion" in p) { const r = await s.motion(p.motion); if (r !== "passed" && r !== "failed") return false; return p.result === "instructed" ? r === (await s.instruction(goalId)) : r === p.result; }
  if ("sent_doc" in p) return s.sentTo(p.sent_doc.any_of, p.sent_doc.to_org);
  return false;
}

/* Judge every open goal with a rule. Called at each lock (world phase). */
export async function judgeGoals(db: SupabaseClient, p: { campaignId: string; roundId: string; roundNo: number; episode: number; episodeRound: number; perEpisode: number }): Promise<{ met: number; failed: number; review: number }> {
  const { data: goals } = await db.from("character_goals").select("id, character_id, goal_key, points").eq("campaign_id", p.campaignId).eq("status", "open").not("goal_key", "is", null);
  let met = 0, failed = 0, review = 0;
  for (const g of goals ?? []) {
    const rule = GOAL_RULES[g.goal_key as string];
    if (!rule) continue;
    const [{ data: kn }, { data: items }, { data: forms }] = await Promise.all([
      db.from("knowledge").select("fact_key").eq("character_id", g.character_id),
      db.from("case_items").select("slug").eq("character_id", g.character_id).eq("status", "held"),
      db.from("events").select("payload").eq("campaign_id", p.campaignId).eq("kind", "form.filed").contains("payload", { character: g.character_id }),
    ]);
    const state: State = {
      knows: new Set((kn ?? []).map((k) => k.fact_key as string)), holds: (items ?? []).map((i) => i.slug as string),
      forms: new Set((forms ?? []).map((f) => (f.payload as { form: string }).form)),
      motion: async (n) => { const { data } = await db.from("motions").select("status").eq("campaign_id", p.campaignId).eq("number", n).maybeSingle(); return (data?.status as string | undefined) ?? null; },
      instruction: async (goalId) => { const { data } = await db.from("facts").select("value").eq("campaign_id", p.campaignId).eq("key", `goal.instruction.${goalId}`).maybeSingle(); return ((data?.value as { result?: "passed" | "failed" } | null)?.result) ?? "passed"; },
      sentTo: async (slugs, org) => {
        const { data: o } = await db.from("organizations").select("id").eq("campaign_id", p.campaignId).eq("name", org).maybeSingle(); if (!o) return false;
        const { data: members } = await db.from("memberships").select("character_id").eq("organization_id", o.id); const ids = new Set((members ?? []).map((m) => m.character_id as string));
        const { data: sent } = await db.from("events").select("payload").eq("campaign_id", p.campaignId).eq("kind", "document.sent").contains("payload", { from: g.character_id });
        return (sent ?? []).some((e) => { const v = e.payload as { to: string; item: string }; return ids.has(v.to) && slugs.some((s) => v.item === s || v.item.startsWith(s + "-from-")); });
      },
    };
    const ok = await evaluate(rule.pred, state, g.id as string);
    const lastDay = p.episode === rule.episode && p.episodeRound >= p.perEpisode;
    const payloadBase = { goal: g.id, character: g.character_id, goal_key: g.goal_key, round: p.roundNo };
    if (ok) {
      const points = rule.timing ? (p.episode < rule.episode || (p.episode === rule.episode && p.episodeRound < rule.timing.before_day) ? rule.timing.points : rule.timing.after) : Number(g.points);
      if (rule.review) {
        const { data: dup } = await db.from("events").select("id").eq("idempotency_key", `goal:${g.id}:proposed`).maybeSingle();
        if (!dup) { await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "world", kind: "goal.proposed_met", payload: { ...payloadBase, points }, idempotency_key: `goal:${g.id}:proposed` }); review++; }
        continue;
      }
      await db.from("character_goals").update({ status: "met", awarded: points, decided_round: p.roundNo, decided_at: new Date().toISOString(), note: "Judged by the record." }).eq("id", g.id);
      await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "world", kind: "goal.met", payload: { ...payloadBase, awarded: points }, idempotency_key: `goal:${g.id}:met`, visible_to: [g.character_id] });
      met++;
      continue;
    }
    if (!lastDay) continue;
    if (rule.partial && (await evaluate(rule.partial.pred, state, g.id as string))) {
      await db.from("character_goals").update({ status: "met", awarded: rule.partial.points, decided_round: p.roundNo, decided_at: new Date().toISOString(), note: "Partly met by the record." }).eq("id", g.id);
      await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "world", kind: "goal.met", payload: { ...payloadBase, awarded: rule.partial.points, partial: true }, idempotency_key: `goal:${g.id}:met`, visible_to: [g.character_id] });
      met++; continue;
    }
    if (rule.review) {
      const { data: dup } = await db.from("events").select("id").eq("idempotency_key", `goal:${g.id}:review`).maybeSingle();
      if (!dup) { await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "world", kind: "goal.needs_review", payload: payloadBase, idempotency_key: `goal:${g.id}:review` }); review++; }
      continue;
    }
    await db.from("character_goals").update({ status: "failed", decided_round: p.roundNo, decided_at: new Date().toISOString(), note: "Not met by the end of the episode." }).eq("id", g.id);
    await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "world", kind: "goal.failed", payload: payloadBase, idempotency_key: `goal:${g.id}:failed`, visible_to: [g.character_id] });
    failed++;
  }
  return { met, failed, review };
}
