import { NextRequest } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { PHASES } from "@/lib/engine/phases";

/* The daily lock. Vercel cron calls this once a day at the campaign's cutoff.
   It does not resolve the round itself (a 24-player resolution with narration
   outlives any serverless timeout). It locks the round, applies missed-turn
   defaults, and enqueues the resolution phases in order. A worker drains them. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  if (!supabaseConfigured()) return Response.json({ ok: false, reason: "database not configured", would_enqueue: PHASES });

  const db = supabaseAdmin();
  const now = new Date().toISOString();
  const { data: round } = await db.from("rounds").select("id, number, campaign_id").eq("status", "open").lte("locks_at", now).order("locks_at").limit(1).maybeSingle();
  if (!round) return Response.json({ ok: true, locked: null });

  const { error } = await db.from("rounds").update({ status: "locked" }).eq("id", round.id).eq("status", "open");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  await db.from("events").insert({ campaign_id: round.campaign_id, round_id: round.id, phase: "lock", kind: "round.locked", payload: { at: now }, idempotency_key: `lock:${round.id}` });
  await db.from("jobs").insert(PHASES.map((phase, i) => ({ kind: "tick_phase", payload: { round_id: round.id, phase, seq: i } })));
  return Response.json({ ok: true, locked: round.number, phases: PHASES });
}
