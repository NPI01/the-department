import { NextRequest } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { heartbeat } from "@/lib/engine/heartbeat";
import { openNextRound, queueMorningDispatches } from "@/lib/engine/rounds";
import { deliverScheduledMail } from "@/lib/engine/scripted";

/* The morning. Vercel cron calls this at the campaign's dispatch time: open the
   next round (unless one is open) and queue a morning dispatch for every
   active player character. The worker writes and sends them one by one. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  if (!supabaseConfigured()) return Response.json({ ok: false, reason: "database not configured" });
  const db = supabaseAdmin();
  const result = await heartbeat(db, "dispatch", async () => {
    // Campaigns that have started: any with a round on the books.
    const { data: rounds } = await db.from("rounds").select("campaign_id");
    const campaigns = [...new Set((rounds ?? []).map((r) => r.campaign_id as string))];
    const out: Record<string, unknown>[] = [];
    for (const cid of campaigns) {
      const { round, opened } = await openNextRound(db, cid);
      const { data: ep } = round.episode_id ? await db.from("episodes").select("number").eq("id", round.episode_id).maybeSingle() : { data: null };
      const mail = await deliverScheduledMail(db, cid, { id: round.id, number: round.number, episodeRound: round.episode_round ?? round.number, episodeNumber: (ep?.number as number | undefined) ?? 1 });
      const queued = await queueMorningDispatches(db, cid, round.id);
      out.push({ campaign: cid, round: round.number, opened, scripted: mail.delivered, queued });
    }
    return { ok: true, campaigns: out };
  });
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
