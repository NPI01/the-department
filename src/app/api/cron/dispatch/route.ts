import { NextRequest } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { heartbeat } from "@/lib/engine/heartbeat";
import { openNextRound, queueMorningDispatches } from "@/lib/engine/rounds";
import { deliverScheduledMail } from "@/lib/engine/scripted";
import { deliverBallotNotices } from "@/lib/engine/ballots";
import { startDueCohorts } from "@/lib/game/cohorts";
import { issueInvitations } from "@/lib/engine/societies";
import { publishBulletin } from "@/lib/engine/bulletin";
import { publishNewsletter } from "@/lib/engine/newsletter";
import { episodeOf } from "@/lib/engine/world";

/* The morning. Vercel cron calls this at the campaign's dispatch time: open the
   next round (unless one is open) and queue a morning dispatch for every
   active player character. The worker writes and sends them one by one. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  if (!supabaseConfigured()) return Response.json({ ok: false, reason: "database not configured" });
  const db = supabaseAdmin();
  const result = await heartbeat(db, "dispatch", async () => {
    // Cohorts whose start has come go active and open Round 1; then every campaign with a round on the books.
    const started = await startDueCohorts(db);
    // Active cohorts only: a finished or simulated cohort is left alone.
    const { data: active } = await db.from("campaigns").select("id").eq("status", "active");
    const { data: rounds } = await db.from("rounds").select("campaign_id").in("campaign_id", (active ?? []).map((c) => c.id as string));
    const campaigns = [...new Set((rounds ?? []).map((r) => r.campaign_id as string))];
    const out: Record<string, unknown>[] = [];
    for (const cid of campaigns) {
      const { round, opened } = await openNextRound(db, cid);
      const { data: ep } = round.episode_id ? await db.from("episodes").select("number").eq("id", round.episode_id).maybeSingle() : { data: null };
      const mail = await deliverScheduledMail(db, cid, { id: round.id, number: round.number, episodeRound: round.episode_round ?? round.number, episodeNumber: (ep?.number as number | undefined) ?? 1 });
      const notices = await deliverBallotNotices(db, cid, { id: round.id, number: round.number });
      const invited = await issueInvitations(db, cid, { id: round.id, number: round.number, episode: (ep?.number as number | undefined) ?? episodeOf(round.number), episodeRound: round.episode_round ?? round.number });
      // The weekly paper, on the morning of days 7 and 14, before the dispatches that mention it.
      const paper = await publishBulletin(db, cid, { id: round.id, number: round.number, episodeRound: round.episode_round ?? round.number, episode: (ep?.number as number | undefined) ?? episodeOf(round.number) });
      // The company newsletter, on the morning of days 4 and 11.
      const letter = await publishNewsletter(db, cid, { id: round.id, number: round.number, episodeRound: round.episode_round ?? round.number, episode: (ep?.number as number | undefined) ?? episodeOf(round.number) });
      const queued = await queueMorningDispatches(db, cid, round.id);
      out.push({ campaign: cid, round: round.number, opened, scripted: mail.delivered, ballots: notices.sent, invited, paper: paper.published, newsletter: letter.published, queued });
    }
    return { ok: true, started, campaigns: out };
  });
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
