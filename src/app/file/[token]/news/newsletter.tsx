import Link from "next/link";
import type { Issue } from "@/lib/game/news";

/* THE ROYCE REPORT as a mimeographed internal sheet: the company letterhead
   in red, a typed masthead line, items under small display heads in the
   typewriter face, two staple marks, a FOR INTERNAL DISTRIBUTION stamp, and
   Personnel's foot. Deliberately the other object from the newspaper: thin
   cream stock, red and black ink, nothing justified. */

export function Newsletter({ issue, issues, token }: { issue: Issue; issues: Issue[]; token: string }) {
  const idx = issues.findIndex((i) => i.round === issue.round);
  const earlier = idx > 0 ? issues[idx - 1] : null;
  const later = idx >= 0 && idx < issues.length - 1 ? issues[idx + 1] : null;
  const m = issue.masthead?.match(/Vol\.\s*(\d+),\s*No\.\s*(\d+)/i);
  return (
    <div className="rr-sheet relative mx-auto max-w-3xl">
      <span className="rr-staple left-5 top-3" aria-hidden /><span className="rr-staple right-5 top-3" aria-hidden />
      {issue.specimen && <p className="absolute -top-3 right-10 z-10 -rotate-2 border-2 border-red bg-paper px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-red">Specimen copy</p>}
      <div className="px-6 pt-8 sm:px-10">
        <div className="flex items-end justify-between gap-4 border-b-[3px] border-red pb-3">
          <div>
            <p className="display text-[11px] tracking-[0.45em] text-red">Royce Industries · Station R</p>
            <h1 className="display mt-1 text-4xl leading-none sm:text-5xl">The Royce Report</h1>
          </div>
          <div className="type text-right text-[11px] leading-snug text-ink-2">
            <p>{m ? `Vol. ${m[1]} · No. ${m[2]}` : "Internal newsletter"}</p>
            <p>{issue.date}</p>
            <p className="text-red">For internal distribution</p>
          </div>
        </div>
        <p className="type mt-3 text-[12px] text-ink-2">Published for employees by Personnel &amp; Administration, Building 1. Not for circulation outside the company.</p>
      </div>
      <div className="px-6 py-6 sm:px-10">
        {issue.stories.map((s, i) => (
          <article key={i} className="rr-item">
            <h2 className="display text-xl tracking-[0.06em]"><span className="mr-2 text-red" aria-hidden>■</span>{s.headline}</h2>
            {s.paragraphs.map((p, j) => <p key={j} className="type rr-body">{p}</p>)}
          </article>
        ))}
        {issue.byline && <p className="type mt-6 border-t border-rule pt-3 text-[12px] text-ink-2 sm:pr-60">{issue.byline}</p>}
      </div>
      <p className="rr-stamp" aria-hidden>Read and initial · route to your section</p>
      <nav className="rr-rack mx-6 mb-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3 sm:mx-10" aria-label="Issues">
        <span>{earlier ? <Link href={`/file/${token}/news?kind=newsletter&issue=${earlier.round}`} className="hover:text-red">‹ {earlier.date}</Link> : <span className="opacity-30">‹ No earlier issue</span>}</span>
        <span>{issues.length ? `No. ${idx + 1} of ${issues.length}` : "Specimen"}</span>
        <span>{later ? <Link href={`/file/${token}/news?kind=newsletter&issue=${later.round}`} className="hover:text-red">{later.date} ›</Link> : <span className="opacity-30">Latest issue ›</span>}</span>
      </nav>
    </div>
  );
}
