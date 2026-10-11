import { NextRequest } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { claimJobs, runJob } from "@/lib/engine/jobs";

export const maxDuration = 300;

/* The worker. Vercel cron calls it every minute; it drains a small batch
   and returns. Safe to run concurrently: claims are time-locked. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  if (!supabaseConfigured()) return Response.json({ ok: false, reason: "database not configured" });
  const db = supabaseAdmin();
  const started = Date.now();
  let done = 0;
  while (Date.now() - started < 240_000) {
    const jobs = await claimJobs(db, 5);
    if (!jobs.length) break;
    for (const j of jobs) { await runJob(db, j); done++; }
  }
  return Response.json({ ok: true, done });
}
