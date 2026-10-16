import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { characterForToken } from "@/lib/game/case-file";
import { issuesFor, parseIssue, SPECIMEN, SPECIMEN_ROUND } from "@/lib/game/news";
import { PublicShell } from "../../../_public-shell";
import { FileNav } from "../file-nav";
import { Newspaper } from "./newspaper";

/* The News tab: every issue of the Minot Daily News this cohort has received,
   set as a front page; the latest by default, any other by ?issue=<round>. A
   cohort with no issue yet sees a specimen copy. */

export const metadata: Metadata = { title: "News · The Department", robots: { index: false, follow: false } };

export default function NewsPage({ params, searchParams }: PageProps<"/file/[token]/news">) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-sm">Unfolding the paper…</main>}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: { params: PageProps<"/file/[token]/news">["params"]; searchParams: PageProps<"/file/[token]/news">["searchParams"] }) {
  await connection();
  const { token } = await params;
  const { issue: want } = await searchParams;
  if (!supabaseConfigured()) notFound();
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) notFound();
  const issues = await issuesFor(db, me.campaignId);
  const wanted = Number(Array.isArray(want) ? want[0] : want);
  const issue = issues.find((i) => i.round === wanted) ?? issues[issues.length - 1] ?? parseIssue(SPECIMEN, SPECIMEN_ROUND, true);
  const weekNo = Math.max(1, Math.ceil(issue.round / 7));
  return (
    <PublicShell nav={<FileNav token={token} active="news" />} kicker="Off campus · the county paper" title="News">
      <p className="text-sm text-ink-2">The Minot Daily News reaches every desk at Station R on the morning of days 7 and 14 of each episode. It prints what the committees decided, what the company will say, what the week felt like in the county, and whatever has been leaked to it. {issue.specimen ? "No issue has come out for your cohort yet; this is a specimen copy." : "Each issue is also a clipping in your Case File."}</p>
      <div className="mt-8">
        <Newspaper issue={issue} issues={issues} token={token} weekNo={weekNo} />
      </div>
    </PublicShell>
  );
}
