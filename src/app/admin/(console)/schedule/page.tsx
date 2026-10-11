import { Suspense } from "react";
import { redirect } from "next/navigation";
import { decisionRounds, decisionsFor, getCalendar, getSeasons, todayOf, type Round } from "@/lib/admin/queries";
import { fmtDate, fmtDateTime } from "@/lib/admin/format";
import { A, Badge, Empty, Loading, PageHeader, Panel, statusTone } from "../ui";
import { DecisionCard, GoToDay, Timeline } from "./parts";

export default function SchedulePage({ searchParams }: PageProps<"/admin/schedule">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

/* The local calendar date a round opens on, in the season's timezone. */
const localDate = (iso: string, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

async function Content({ searchParams }: { searchParams: PageProps<"/admin/schedule">["searchParams"] }) {
  const { season } = await getSeasons();
  if (!season) return <PageHeader title="No season yet" />;
  const { episodes, rounds } = await getCalendar(season.id);
  const sp = await searchParams;
  if (sp.day) redirect(`/admin/schedule/${Number(sp.day)}`);
  if (typeof sp.date === "string" && sp.date) {
    const hit = rounds.find((r) => localDate(r.opens_at, season.timezone) === sp.date);
    if (hit) redirect(`/admin/schedule/${hit.number}`);
  }
  const notFound = typeof sp.date === "string" && sp.date;

  const today = todayOf(rounds);
  const tomorrow = today ? rounds.find((r) => r.number === today.number + 1) ?? null : null;
  const [dToday, dTomorrow, marks] = await Promise.all([
    today ? decisionsFor(season.id, today.number) : null,
    tomorrow ? decisionsFor(season.id, tomorrow.number) : null,
    decisionRounds(season.id),
  ]);

  return (
    <>
      <PageHeader kicker="Season Schedule" title={season.title}>
        {rounds.length ? `${rounds.length} days across ${episodes.length} episodes · locks ${season.lock_time.slice(0, 5)} ${season.timezone}` : "No calendar yet."}
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-2">
        <DayColumn label="Today" round={today} decisions={dToday} tz={season.timezone} episodes={episodes} />
        <DayColumn label="Tomorrow" round={tomorrow} decisions={dTomorrow} tz={season.timezone} episodes={episodes} />
      </div>

      <Panel title="Timeline" className="mt-6" action={<GoToDay max={rounds.length} tz={season.timezone} />}>
        {notFound && <p className="mb-3 text-sm text-stamp">No game day opens on {sp.date}.</p>}
        <Timeline episodes={episodes} rounds={rounds} today={today?.number ?? null} marks={marks} tz={season.timezone} />
      </Panel>
    </>
  );
}

function DayColumn({ label, round, decisions, tz, episodes }: { label: string; round: Round | null; decisions: Awaited<ReturnType<typeof decisionsFor>> | null; tz: string; episodes: { id: string; number: number; title: string }[] }) {
  const ep = round ? episodes.find((e) => e.id === round.episode_id) : null;
  return (
    <Panel title={label} action={round && <A href={`/admin/schedule/${round.number}`}>Day {round.number} →</A>}>
      {!round || !decisions ? <Empty>{label === "Today" ? "No round is scheduled." : "No round after today."}</Empty> : (
        <div className="space-y-3">
          <p className="text-sm">
            <Badge tone={statusTone(round.status)}>{round.status}</Badge>{" "}
            {fmtDate(round.opens_at, tz)}{ep && <> · Episode {ep.number}, day {round.episode_round}</>}
          </p>
          <p className="text-xs text-ink-2">Orders lock {fmtDateTime(round.locks_at, tz)}{round.episode_round === 14 && " · episode finale"}</p>
          {decisions.closing.length ? decisions.closing.map((m) => <DecisionCard key={m.id} m={m} pending />) : <Empty>No votes close this day.</Empty>}
          {decisions.opening.length > 0 && (
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wider text-ink-2">Opening</p>
              <ul className="mt-1 list-inside list-disc">{decisions.opening.map((m) => <li key={m.id}>{m.number} {m.title} <span className="text-ink-2">— closes day {m.closes_round}</span></li>)}</ul>
            </div>
          )}
          {decisions.agreements.length > 0 && (
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wider text-ink-2">Agreements</p>
              <ul className="mt-1 list-inside list-disc">
                {decisions.agreements.map((a) => <li key={a.id}>{a.title ?? a.kind} <Badge tone={statusTone(a.status)}>{a.status}</Badge> {a.expires_round === round.number && <span className="text-ink-2">expires</span>}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
