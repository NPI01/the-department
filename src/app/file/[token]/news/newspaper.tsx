import Link from "next/link";
import type { Issue } from "@/lib/game/news";

/* The Minot Daily News, set as a front page: masthead with ears, a double
   dateline rule, the lead across the top, the rest of the issue in columns
   with rules between them, drop caps, a byline, and the back issues as a
   rack at the foot. Newsprint tones sit a shade yellower than the site's
   paper so the sheet reads as a different object on the desk. */

const ORD = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

function Para({ text, dropcap }: { text: string; dropcap?: boolean }) {
  return <p className={`np-body ${dropcap ? "np-dropcap" : ""}`}>{text}</p>;
}

export function Newspaper({ issue, issues, token, weekNo }: { issue: Issue; issues: Issue[]; token: string; weekNo: number }) {
  const [lead, ...rest] = issue.stories;
  const idx = issues.findIndex((i) => i.round === issue.round);
  const earlier = idx > 0 ? issues[idx - 1] : null;
  const later = idx >= 0 && idx < issues.length - 1 ? issues[idx + 1] : null;
  const price = "15 CENTS";
  return (
    <div className="np-sheet relative mx-auto max-w-4xl">
      {issue.specimen && <p className="absolute -top-3 right-4 z-10 rotate-2 border-2 border-red bg-paper px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-red">Specimen copy</p>}
      {/* ears and masthead */}
      <div className="grid grid-cols-2 items-end gap-3 px-5 pt-5 md:grid-cols-[7.5rem_minmax(0,1fr)_7.5rem] sm:px-8">
        <h1 className="np-masthead col-span-2 text-center md:order-2 md:col-span-1">Minot Daily News</h1>
        <div className="np-ear md:order-1"><p className="np-ear-head">Weather</p><p>Clear and cold tonight, low near 24. Wednesday fair, high 46. Wind northwest 15 to 25.</p></div>
        <div className="np-ear justify-self-end text-right md:order-3"><p className="np-ear-head">Inside</p><p>Farm 5 · Markets 7 · Base 8 · Obituaries 9 · Classified 12</p></div>
      </div>
      <div className="mx-5 mt-2 border-y-[3px] border-double border-ink sm:mx-8">
        <p className="np-dateline flex flex-wrap items-center justify-between gap-x-4 px-1 py-1">
          <span>Minot, North Dakota</span>
          <span>{issue.date}</span>
          <span>Week {weekNo} of the season · {price}</span>
        </p>
      </div>

      {/* the lead */}
      {lead && (
        <section className="px-5 pt-5 sm:px-8">
          <h2 className="np-head-lead">{lead.headline}</h2>
          {issue.byline && <p className="np-byline">By {issue.byline.replace(/,?\s*staff\.?$/i, "").toUpperCase()} · Daily News Staff Writer</p>}
          <div className="np-columns-2 mt-3">
            {lead.paragraphs.map((p, i) => <Para key={i} text={p} dropcap={i === 0} />)}
            <p className="np-jump">Continued on Page 6</p>
          </div>
        </section>
      )}

      {/* the rest, in columns */}
      {rest.length > 0 && (
        <section className="mx-5 mt-5 border-t-2 border-ink pt-4 sm:mx-8">
          <div className="np-columns-3">
            {rest.map((s, i) => (
              <article key={i} className="np-story">
                <h3 className="np-head">{s.headline}</h3>
                {s.paragraphs.map((p, j) => <Para key={j} text={p} dropcap={j === 0} />)}
                <p className="np-end" aria-hidden>— 30 —</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* foot and the rack */}
      <div className="mx-5 mt-6 border-t border-ink px-1 py-2 sm:mx-8">
        <p className="np-dateline flex flex-wrap justify-between gap-x-4">
          <span>Published every weekday at Minot except holidays · Second-class postage paid at Minot, N.D.</span>
          <span>Page 1</span>
        </p>
      </div>
      <nav className="np-rack mx-5 mb-5 mt-3 flex flex-wrap items-center justify-between gap-3 sm:mx-8" aria-label="Issues">
        <span>{earlier ? <Link href={`/file/${token}/news?issue=${earlier.round}`} className="hover:text-red">‹ {earlier.date}</Link> : <span className="opacity-30">‹ No earlier issue</span>}</span>
        <span className="text-center">{issues.length ? `${ORD(idx + 1)} issue of ${issues.length}` : "Specimen"}</span>
        <span>{later ? <Link href={`/file/${token}/news?issue=${later.round}`} className="hover:text-red">{later.date} ›</Link> : <span className="opacity-30">Latest issue ›</span>}</span>
      </nav>
    </div>
  );
}
