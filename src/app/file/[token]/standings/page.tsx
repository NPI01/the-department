import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { characterForToken } from "@/lib/game/case-file";
import { standings } from "@/lib/game/goals";
import { PublicShell } from "../../../_public-shell";
import { FileNav } from "../file-nav";

/* The season standings: every employee in the cohort by points from met
   Personal Goals. Names and points only; what anyone's goals are stays private. */

export const metadata: Metadata = { title: "Standings · The Department", robots: { index: false, follow: false } };

export default function StandingsPage({ params }: PageProps<"/file/[token]/standings">) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-sm">Posting the board…</main>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/file/[token]/standings">["params"] }) {
  await connection();
  const { token } = await params;
  if (!supabaseConfigured()) notFound();
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) notFound();
  const [{ data: campaign }, { data: divisions }, rows] = await Promise.all([
    db.from("campaigns").select("title").eq("id", me.campaignId).maybeSingle(),
    db.from("divisions").select("id, name, slug").eq("campaign_id", me.campaignId),
    standings(db, me.campaignId),
  ]);
  const div = new Map((divisions ?? []).map((d) => [d.id as string, d.slug === "dsrd" ? "Executive Office" : (d.name as string)]));

  return (
    <PublicShell nav={<FileNav token={token} active="standings" />} kicker={`Season standings · ${campaign?.title ?? "Royce Industries"}`} title="The Board">
      <p className="text-sm text-ink-2">Points from Personal Goals met, for everyone in your cohort. Goals themselves are confidential; only the totals are posted. The season&apos;s winner is whoever stands first when it ends.</p>
      <div className="mt-8 border-2 border-ink bg-paper-2 shadow-[6px_6px_0_0_var(--ink)]">
        <div className="grid grid-cols-[3rem_1fr_5rem] border-b-2 border-ink bg-ink px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-paper">
          <span>No.</span><span>Employee</span><span className="text-right">Points</span>
        </div>
        {rows.length ? rows.map((r) => (
          <div key={r.characterId} className={`grid grid-cols-[3rem_1fr_5rem] items-baseline border-b border-rule px-4 py-3 last:border-b-0 ${r.characterId === me.id ? "bg-paper" : ""}`}>
            <span className="display text-2xl text-red">{r.rank}</span>
            <span>
              <span className="type text-[15px]">{r.name}</span>{r.characterId === me.id && <span className="text-xs text-red"> (you)</span>}
              <span className="block text-xs text-ink-2">{[r.title, r.divisionId ? div.get(r.divisionId) : null].filter(Boolean).join(", ")} · {r.met} met</span>
            </span>
            <span className="display text-right text-3xl">{r.score}</span>
          </div>
        )) : <p className="px-4 py-6 text-sm text-ink-2">No one is on the board yet.</p>}
      </div>
    </PublicShell>
  );
}
