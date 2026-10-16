import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { characterForToken } from "@/lib/game/case-file";
import Link from "next/link";
import { issuesFor, newslettersFor, parseIssue, NEWSLETTER_SPECIMEN, NEWSLETTER_SPECIMEN_ROUND, SPECIMEN, SPECIMEN_ROUND } from "@/lib/game/news";
import { PublicShell } from "../../../_public-shell";
import { FileNav } from "../file-nav";
import { Newspaper } from "./newspaper";
import { Newsletter } from "./newsletter";

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
  const { issue: want, kind: kindParam } = await searchParams;
  if (!supabaseConfigured()) notFound();
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) notFound();
  const kind = (Array.isArray(kindParam) ? kindParam[0] : kindParam) === "newsletter" ? "newsletter" : "paper";
  const wanted = Number(Array.isArray(want) ? want[0] : want);
  const [issues, letters] = await Promise.all([issuesFor(db, me.campaignId), newslettersFor(db, me.campaignId)]);
  const paper = issues.find((i) => i.round === wanted && kind === "paper") ?? issues[issues.length - 1] ?? parseIssue(SPECIMEN, SPECIMEN_ROUND, true);
  const letter = letters.find((i) => i.round === wanted && kind === "newsletter") ?? letters[letters.length - 1] ?? parseIssue(NEWSLETTER_SPECIMEN, NEWSLETTER_SPECIMEN_ROUND, true);
  const weekNo = Math.max(1, Math.ceil(paper.round / 7));
  const tab = (k: "paper" | "newsletter", label: string) => k === kind
    ? <span aria-current="page" className="border-2 border-ink bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-paper">{label}</span>
    : <Link href={`/file/${token}/news?kind=${k}`} className="border-2 border-rule px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-ink-2 hover:border-ink hover:text-ink">{label}</Link>;
  return (
    <PublicShell nav={<FileNav token={token} active="news" />} kicker={kind === "paper" ? "Off campus · the county paper" : "On campus · the company newsletter"} title="News">
      <div className="flex flex-wrap gap-2">{tab("paper", "Minot Daily News")}{tab("newsletter", "The Royce Report")}</div>
      {kind === "paper" ? (
        <>
          <p className="mt-5 text-sm text-ink-2">The Minot Daily News reaches every desk at Station R on the morning of days 7 and 14 of each episode. It prints what the committees decided, what the company will say, what the week felt like in the county, and whatever has been leaked to it. {paper.specimen ? "No issue has come out for your cohort yet; this is a specimen copy." : "Each issue is also a clipping in your Case File."}</p>
          <div className="mt-8"><Newspaper issue={paper} issues={issues} token={token} weekNo={weekNo} /></div>
        </>
      ) : (
        <>
          <p className="mt-5 text-sm text-ink-2">The Royce Report is Personnel &amp; Administration's own sheet, in every tray on the morning of days 4 and 11. It welcomes new employees, reports committee business as settled, notes any directive in force, and answers whatever the paper printed without confirming a word of it. {letter.specimen ? "No issue has come out for your cohort yet; this is a specimen copy." : "Each issue is also in your Case File."}</p>
          <div className="mt-8"><Newsletter issue={letter} issues={letters} token={token} /></div>
        </>
      )}
    </PublicShell>
  );
}
