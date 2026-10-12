import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCanonDoc, getEpisodeDocs, openProposalCount, type CanonDoc } from "@/lib/admin/review";
import { getCalendar, getSeasons, todayOf } from "@/lib/admin/queries";
import { ARC_PATH, ARCS_PATH, arcFor, fictionalDate, parseArc, parseBeats, type Beat } from "@/lib/canon/episodes";
import { parseBlocks, section } from "@/lib/canon/markdown";
import { Markdown, inline } from "@/lib/canon/render";
import { A, Badge, Empty, Loading, PageHeader, Panel, statusTone, type Tone } from "../../ui";

export default function PlanPage({ params }: PageProps<"/admin/plans/[n]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

const KIND_TONE: Record<string, Tone> = { dispatch: "accent", letter: "muted", decision: "ok", pressure: "warn", staff: "muted", deadline: "bad", check: "accent" };
const ROUNDS = Array.from({ length: 14 }, (_, i) => i + 1);
const docHref = (d: CanonDoc) => `/admin/review/doc?path=${encodeURIComponent(d.path)}`;

async function Content({ params }: { params: PageProps<"/admin/plans/[n]">["params"] }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1) notFound();
  const [docs, arcDoc, arcsDoc, { season }] = await Promise.all([getEpisodeDocs(n), getCanonDoc(ARC_PATH), getCanonDoc(ARCS_PATH), getSeasons()]);
  const story = arcsDoc ? arcFor(arcsDoc.content, n) : null;
  const arc = arcDoc ? parseArc(arcDoc.content).episodes.find((e) => e.n === n) : undefined;
  if (!docs.length && !arc) notFound();

  const pub = docs.find((d) => d.tier === "public");
  const engine = docs.find((d) => d.tier === "secret" && /engine/.test(d.path));
  const beatsDoc = docs.find((d) => /beats/.test(d.path));
  const beats = beatsDoc ? parseBeats(beatsDoc.content) : [];
  const open = await openProposalCount(docs.map((d) => d.path));

  // Live overlay: this episode's rounds in the current season, if the calendar has them.
  const cal = season ? await getCalendar(season.id) : null;
  const ep = cal?.episodes.find((e) => e.number === n);
  const live = new Map((cal?.rounds ?? []).filter((r) => ep && r.episode_id === ep.id).map((r) => [r.episode_round ?? 0, r]));
  const today = cal ? todayOf(cal.rounds) : null;

  const first = fictionalDate(n, 1); const last = fictionalDate(n, 14);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
  const engineSections = engine ? parseBlocks(engine.content).filter((b) => b.type === "heading" && b.level === 2).map((b) => (b.type === "heading" ? b.text : "")) : [];
  const crisisHeading = engineSections.find((h) => /crisis/i.test(h));

  return (
    <>
      <PageHeader kicker={<><A href="/admin/plans">Episode Plans</A> · Episode {String(n).padStart(2, "0")}{arc ? ` · ${arc.stage}` : ""}</>} title={arc?.title ?? `Episode ${n}`}>
        {fmt(first.date)}{first.date.getUTCFullYear() !== last.date.getUTCFullYear() ? `, ${first.date.getUTCFullYear()}` : ""} – {fmt(last.date)}, {last.date.getUTCFullYear()}{first.exact ? "" : " (approximate: intermissions not fixed)"} · 14 rounds
        {ep && <> · <Badge tone={statusTone(ep.status)}>{ep.status}</Badge> in {season?.title}</>}
        {open > 0 && <> · <A href="/admin/review">{open} open proposal{open > 1 ? "s" : ""} in this episode&apos;s docs</A></>}
        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {docs.map((d) => <A key={d.path} href={docHref(d)}>{d.path.replace(/^canon\//, "")}</A>)}
        </span>
      </PageHeader>

      {story && (
        <Panel title="Story arc" className="mb-4" action={<A href={`/admin/review/doc?path=${encodeURIComponent(ARCS_PATH)}`}>review</A>}>
          {story.logline && <p className="mb-4 text-base font-semibold leading-snug">{inline(story.logline)}</p>}
          <Markdown md={story.body} />
        </Panel>
      )}

      {arc && (
        <Panel title="From the season arc" className="mb-4">
          <dl className="grid gap-x-4 gap-y-2 text-sm md:grid-cols-[10rem_1fr]">
            <dt className="text-ink-2">Crisis</dt><dd>{inline(arc.crisis)}</dd>
            <dt className="text-ink-2">Collective decision</dt><dd>{inline(arc.decision)}</dd>
            <dt className="text-ink-2">Tagus thread</dt><dd>{inline(arc.tagus)}</dd>
            <dt className="text-ink-2">Carries forward</dt><dd>{inline(arc.carries)}</dd>
          </dl>
        </Panel>
      )}

      {!docs.length ? <Empty>No round-by-round plan yet: only the season arc and the story arc above.</Empty> : (
        <>
          <div className="mb-4 grid gap-4 xl:grid-cols-2">
            <Panel title="What a new hire sees">
              {pub && section(pub.content, "The episode") ? <Markdown md={section(pub.content, "The episode")!} /> : <Empty>No public episode document.</Empty>}
            </Panel>
            <Panel title="What is actually going on">
              {engine && crisisHeading ? <Markdown md={section(engine.content, crisisHeading)!} /> : <Empty>No engine document.</Empty>}
            </Panel>
          </div>

          <Panel title="How it plays out, round by round" className="mb-4">
            {!beats.length ? <Empty>No beat sheet for this episode yet.</Empty> : (
              <Timeline n={n} beats={beats} live={live} todayId={today?.id ?? null} fmt={fmt} />
            )}
            {beatsDoc && section(beatsDoc.content, "Gaps") && (
              <div className="mt-4 border-t border-rule pt-3">
                <p className="mb-1 text-[11px] uppercase tracking-wider text-ink-2">Open in this plan</p>
                <Markdown md={section(beatsDoc.content, "Gaps")!} compact />
              </div>
            )}
          </Panel>

          {engine && engineSections.filter((h) => h !== crisisHeading).map((h) => (
            <details key={h} className="mb-3 border border-rule bg-paper-2/40" open={/motion|election|objective/i.test(h)}>
              <summary className="cursor-pointer px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-ink-2">{h}</summary>
              <div className="border-t border-rule p-4"><Markdown md={section(engine.content, h) ?? ""} /></div>
            </details>
          ))}
        </>
      )}
    </>
  );
}

function Timeline({ n, beats, live, todayId, fmt }: { n: number; beats: Beat[]; live: Map<number, { id: string; number: number; status: string }>; todayId: string | null; fmt: (d: Date) => string }) {
  const pressure = beats.filter((b) => b.kind === "pressure");
  return (
    <ol className="divide-y divide-rule/60">
      {ROUNDS.map((r) => {
        const starting = beats.filter((b) => b.from === r && b.kind !== "pressure");
        const ongoing = beats.filter((b) => b.kind !== "pressure" && b.from < r && b.to >= r);
        const band = pressure.find((b) => b.from <= r && b.to >= r);
        const bandStarts = band?.from === r;
        const lr = live.get(r);
        return (
          <li key={r} className={`grid gap-x-4 py-3 md:grid-cols-[9rem_14rem_1fr] ${lr?.id === todayId ? "bg-paper-2" : ""}`}>
            <div className="text-sm">
              <p className="font-semibold">Round {r}</p>
              <p className="text-xs text-ink-2">{fmt(fictionalDate(n, r).date)}</p>
              {lr && <p className="mt-1"><A href={`/admin/schedule/${lr.number}`}>Day {lr.number}</A> <Badge tone={statusTone(lr.status)}>{lr.status}</Badge></p>}
            </div>
            <div className={`mt-2 border-l-4 pl-2 text-xs md:mt-0 ${band ? "border-warn" : "border-transparent"}`}>
              {band && (bandStarts ? <span>{inline(band.beat)}</span> : <span className="text-ink-2">↳ pressure continues (rounds {band.from}–{band.to})</span>)}
            </div>
            <div className="mt-2 space-y-2 md:mt-0">
              {!starting.length && !ongoing.length && <p className="text-sm italic text-ink-2">Nothing scheduled.</p>}
              {starting.map((b, i) => (
                <div key={i} className="text-sm">
                  <p><Badge tone={KIND_TONE[b.kind] ?? "muted"}>{b.kind}</Badge>{b.to > b.from && <span className="ml-1 text-xs text-ink-2">rounds {b.from}–{b.to}</span>} {inline(b.beat)}</p>
                  <p className="mt-0.5 text-xs text-ink-2">Seen by: {inline(b.seenBy)} · {inline(b.source)}</p>
                </div>
              ))}
              {ongoing.map((b, i) => <p key={`o${i}`} className="text-xs text-ink-2">↳ {b.kind} continues: {inline(b.beat.split(/[:.;]/)[0])} (rounds {b.from}–{b.to})</p>)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
