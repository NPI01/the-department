import { NextRequest } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { claimNext, runJob } from "@/lib/engine/jobs";
import { heartbeat } from "@/lib/engine/heartbeat";

export const maxDuration = 300;

/* The worker. Vercel cron calls it every minute; it drains a small batch
   and returns. Safe to run concurrently: claims are time-locked. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  if (!supabaseConfigured()) return Response.json({ ok: false, reason: "database not configured" });
  const db = supabaseAdmin();
  const result = await heartbeat(db, "work", async () => {
    const started = Date.now();
    let done = 0;
    // One job at a time, fast kinds first, so a slow model call never delays a receipt.
    while (Date.now() - started < 240_000) {
      const j = await claimNext(db);
      if (!j) break;
      await runJob(db, j); done++;
    }
    return { ok: true, done, ms: Date.now() - started };
  });
  return Response.json(result);
}
