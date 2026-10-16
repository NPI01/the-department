import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { characterForToken } from "@/lib/game/case-file";
import { ballotSections, loadBallots, type Ballot } from "@/lib/game/ballots";
import { gameMailbox } from "@/lib/email/resend";
import { PublicShell } from "../../../_public-shell";
import { FileNav } from "../file-nav";

/* Every ballot open to the cohort: what is decided, why the player may vote
   (or may not), what is at stake, who votes, the choices, the exact line to
   send, when it closes, and how the player has voted so far. Closed ballots
   below with their results. The same text as the ballot notice letter. */

export const metadata: Metadata = { title: "Ballots · The Department", robots: { index: false, follow: false } };

export default function BallotsPage({ params }: PageProps<"/file/[token]/ballots">) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-sm">Counting the ballot box…</main>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/file/[token]/ballots">["params"] }) {
  await connection();
  const { token } = await params;
  if (!supabaseConfigured()) notFound();
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) notFound();
  const { ballots } = await loadBallots(db, me.campaignId, me.id, { closed: true });
  const open = ballots.filter((b) => b.status === "open").sort((a, b) => Number(b.eligible) - Number(a.eligible) || a.closesRound - b.closesRound);
  const closed = ballots.filter((b) => b.status !== "open").sort((a, b) => b.closesRound - a.closesRound);
  const mailbox = gameMailbox().address;

  return (
    <PublicShell nav={<FileNav token={token} active="ballots" />} kicker="Elections and motions" title="Ballots">
      <p className="text-sm leading-relaxed text-ink-2">Votes are cast by mail: one line in a letter to <code>{mailbox}</code>, from the address your letters arrive at. Voting costs no Action Units, and a later vote replaces an earlier one until the ballot closes.</p>

      {open.length === 0 ? <p className="mt-8 border-2 border-dashed border-rule p-5 text-sm text-ink-2">No ballot is open right now. When one opens that you can vote in, a ballot notice comes in the morning mail, and it is listed here and in every dispatch until it closes.</p>
        : <div className="mt-8 grid gap-10">{open.map((b) => <OpenBallot key={b.id} b={b} mailbox={mailbox} />)}</div>}

      {closed.length > 0 && (
        <>
          <h2 className="display mt-14 text-2xl">Closed</h2>
          <ul className="mt-3 divide-y divide-rule border-y border-rule text-sm">
            {closed.map((b) => (
              <li key={b.id} className="grid gap-1 py-2.5 sm:grid-cols-[7rem_1fr]">
                <span className="font-mono text-xs text-ink-2">{b.number}</span>
                <span><b>{b.election ? b.title : `“${b.title}”, ${b.body}`}</b>. {b.result}{b.myVote ? <span className="text-ink-2"> You voted {b.election ? `for ${b.myVote}` : b.myVote}.</span> : null}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </PublicShell>
  );
}

function OpenBallot({ b, mailbox }: { b: Ballot; mailbox: string }) {
  const s = ballotSections(b, mailbox);
  const block = (h: string, body: React.ReactNode) => (
    <div className="grid gap-1 border-t border-rule py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <h3 className="text-[10px] uppercase tracking-[0.22em] text-ink-2 sm:pt-1">{h}</h3>
      <div className="min-w-0 text-[15px] leading-relaxed">{body}</div>
    </div>
  );
  const text = (t: string) => t.split(/\n\s*\n/).map((p, i) => {
    const lines = p.split("\n");
    if (lines.every((l) => /^VOTE\s/.test(l.trim()))) return <pre key={i} className="my-2 overflow-x-auto border-l-[3px] border-red bg-paper-2 px-3 py-2 font-mono text-[13px]">{p}</pre>;
    if (lines.every((l) => l.startsWith("- "))) return <ul key={i} className="my-1 space-y-0.5">{lines.map((l, k) => <li key={k}>■ {l.slice(2)}</li>)}</ul>;
    return <p key={i} className="type my-1.5 whitespace-pre-line">{p}</p>;
  });
  return (
    <article className={`border-2 ${b.eligible ? "border-ink shadow-[6px_6px_0_0_var(--ink)]" : "border-dashed border-rule"} bg-paper-2/40 px-4 pb-2 pt-4 sm:px-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-ink-2">{b.number} · {b.election ? "Election" : `Motion before the ${b.body}`}</p>
          <h2 className="display mt-1 text-3xl">{b.title}</h2>
        </div>
        <span className={`display -rotate-2 border-2 px-2 py-0.5 text-sm ${b.eligible ? (b.myVote ? "border-ink text-ink" : "border-red text-red") : "border-dashed border-ink-2 text-ink-2"}`}>
          {!b.eligible ? "No vote" : b.myVote ? `Voted: ${b.myVote}` : "Not yet voted"}
        </span>
      </div>
      <p className={`mt-2 text-sm ${b.closesTonight ? "font-bold text-red" : "text-ink-2"}`}>Closes {b.closesTonight ? "tonight, " : ""}{b.closesLabel}.</p>
      <div className="mt-4">
        {block("What is decided", text(s.decided))}
        {block("Your vote", text(s.why))}
        {block("At stake", text(s.stakes))}
        {block("Who votes", text(s.electorate))}
        {block(s.choicesHeading, text(s.choices))}
        {block("How to vote", text(s.how))}
        {block("How it closes", text(s.closes))}
      </div>
    </article>
  );
}
