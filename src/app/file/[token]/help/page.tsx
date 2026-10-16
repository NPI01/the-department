import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { characterForToken } from "@/lib/game/case-file";
import { HELP_SECTIONS } from "@/lib/game/help";
import { PublicShell } from "../../../_public-shell";
import { FileNav } from "../file-nav";
import { HelpDesk } from "./help-desk";

/* The Help tab: every line the clerk reads, with an example of each, and the
   help desk underneath. Out of character throughout. */

export const metadata: Metadata = { title: "Help · The Department", robots: { index: false, follow: false } };

export default function HelpPage({ params }: PageProps<"/file/[token]/help">) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-sm">Finding the clerk…</main>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/file/[token]/help">["params"] }) {
  await connection();
  const { token } = await params;
  if (!supabaseConfigured()) notFound();
  const me = await characterForToken(supabaseAdmin(), token);
  if (!me) notFound();

  return (
    <PublicShell nav={<FileNav token={token} active="help" />} kicker="Out of character · how to play" title="Help">
      <p className="text-sm text-ink-2">The game is played by email. Each morning a dispatch arrives; during the day you write to people; at 8:00 PM Eastern your orders lock and the night passes. Everything below goes in a reply to any letter from The Department, each line at the start of its own line. Anything else you write is a note to the clerk. Every reply gets a receipt; the receipt is the truth. <Link href="#desk" className="text-red underline">Ask the help desk</Link> if a line is unclear.</p>

      {HELP_SECTIONS.map((s) => (
        <section key={s.title} className="mt-12">
          <h2 className="display text-3xl">{s.title}</h2>
          {s.intro && <p className="mt-2 text-sm text-ink-2">{s.intro}</p>}
          <div className="mt-4 border-2 border-ink bg-paper-2">
            {s.lines.map((l, i) => (
              <div key={l.line} className={`grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,15rem)_1fr] ${i ? "border-t border-rule" : ""}`}>
                <div>
                  <code className="type text-[13px] font-bold text-ink">{l.line}</code>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap border border-rule bg-paper px-2 py-1.5 text-[12px] leading-relaxed text-ink-2">{l.example}</pre>
                </div>
                <div className="text-sm leading-relaxed">
                  <p>{l.what}</p>
                  {l.note && <p className="mt-1 text-xs text-ink-2">{l.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-12 text-sm text-ink-2">
        <h2 className="display text-3xl text-ink">Where things are</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Your Action Units, goals and standing declarations are on your <Link href={`/file/${token}`} className="text-red underline">personnel file</Link> and in every morning dispatch.</li>
          <li>Everything you obtain is in the <Link href={`/file/${token}/case`} className="text-red underline">Case File</Link>, with buttons for SEND and FILE on each item.</li>
          <li>Open ballots and the lines to vote on them are under <Link href={`/file/${token}/ballots`} className="text-red underline">Ballots</Link>.</li>
          <li>The full <Link href="/rules" className="text-red underline">rulebook</Link> and the <Link href="/guide" className="text-red underline">field guide</Link> are public pages.</li>
        </ul>
      </section>

      <HelpDesk token={token} />
    </PublicShell>
  );
}
