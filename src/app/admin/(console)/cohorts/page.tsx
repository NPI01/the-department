import { Suspense } from "react";
import { getCohortMonitor, type CohortRow, type PlayerRow } from "@/lib/admin/cohorts";
import { ago, fmtDateTime, nowMs } from "@/lib/admin/format";
import { A, Badge, Empty, Loading, PageHeader, Panel, Stat, Table, statusTone } from "../ui";

/* The cohort monitor: who is playing, who has gone quiet, what the engine sent
   and what it could not, cohort by cohort. */

export default function CohortsPage() {
  return (
    <>
      <PageHeader kicker="Cohorts" title="Who is playing">Each cohort is one campaign: its seats, its round, and the signs that a player is drifting or that mail is not getting out.</PageHeader>
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}

const quiet = (p: PlayerRow, now: number) => (p.lastIn ? now - new Date(p.lastIn).getTime() > 3 * 86400_000 : true);

async function Content() {
  const m = await getCohortMonitor();
  const now = nowMs();
  const live = m.cohorts.filter((c) => c.status !== "complete");
  const playing = live.reduce((n, c) => n + c.players.length, 0);
  const quietCount = live.reduce((n, c) => n + c.players.filter((p) => quiet(p, now)).length, 0);
  const mailTrouble = live.reduce((n, c) => n + c.mailUnsent + c.sendFailed, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Cohorts" value={live.length} hint={`${m.cohorts.filter((c) => c.status === "recruiting").length} recruiting · ${m.cohorts.filter((c) => c.status === "active").length} active`} />
        <Stat label="Playing" value={playing} hint={`${quietCount} quiet 3+ days`} tone={playing && quietCount / playing > 0.3 ? "warn" : undefined} />
        <Stat label="Mail trouble" value={mailTrouble} hint="unsent 24h + failed sends" tone={mailTrouble ? "bad" : undefined} />
        <Stat label="Engine" value={m.jobsFailed} hint={`failed jobs · ${m.modelErrors24h} model errors 24h`} tone={m.jobsFailed ? "bad" : m.modelErrors24h > 10 ? "warn" : undefined} />
      </div>
      {!m.cohorts.length ? <Empty>No cohorts yet. Make one with scripts/new-cohort.ts.</Empty> : m.cohorts.map((c) => <Cohort key={c.id} c={c} now={now} />)}
    </div>
  );
}

function Cohort({ c, now }: { c: CohortRow; now: number }) {
  const lockSoon = c.round && c.round.status === "open" && new Date(c.round.locksAt).getTime() - now < 3 * 3600_000;
  const noDispatch = c.round && c.round.status === "open" && c.dispatchesToday < c.players.length;
  return (
    <Panel title={`${c.title} · ${c.slug}`} action={<span className="flex gap-2"><Badge tone={statusTone(c.status)}>{c.status}</Badge><Badge tone={c.seatsTaken >= c.cohortSize ? "ok" : "muted"}>{c.seatsTaken}/{c.cohortSize} seats</Badge></span>}>
      <div className="mb-3 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
        <p>{c.round ? <>Round <b>{c.round.number}</b> (day {c.round.episodeRound ?? "?"} of Episode {c.episode}) · <Badge tone={statusTone(c.round.status)}>{c.round.status}</Badge>{c.round.status === "open" && <> · locks {ago(c.round.locksAt, now)}{lockSoon && <Badge tone="warn">soon</Badge>}</>}</> : c.scheduledStart ? <>Starts {fmtDateTime(c.scheduledStart, c.timezone)}</> : <>Not started; no start scheduled</>}</p>
        <p>Dispatches today <b>{c.dispatchesToday}</b> of {c.players.length}{noDispatch && <Badge tone="warn">short</Badge>} · scripted letters <b>{c.scriptedToday}</b></p>
        <p>Mail unsent 24h <b className={c.mailUnsent ? "text-stamp" : ""}>{c.mailUnsent}</b> · failed sends <b className={c.sendFailed ? "text-stamp" : ""}>{c.sendFailed}</b> · staff replies pending <b>{c.staffPending}</b></p>
        <p>Invitations <b>{c.invitations}</b> · summonses <b>{c.summonses}</b> · open ballots {c.motionsOpen.length ? c.motionsOpen.map((mo) => `${mo.number} (closes R${mo.closes})`).join(", ") : "none"}</p>
      </div>
      {!c.players.length ? <Empty>No players yet.</Empty> : (
        <Table head={["Player", "Department", "Last wrote", "Letters 7d", "Missed of last 3", "AU", "Goals", "Flags"]}>
          {c.players.map((p) => {
            const q = quiet(p, now);
            return (
              <tr key={p.id}>
                <td className="whitespace-nowrap"><A href={`/admin/casting/${p.id}`}>{p.name}</A>{p.title && <span className="text-xs text-ink-2">, {p.title}</span>}</td>
                <td className="text-ink-2">{p.division ?? "—"}</td>
                <td className="whitespace-nowrap">{p.lastIn ? ago(p.lastIn, now) : <span className="text-ink-2">never</span>}{q && <> <Badge tone="warn">quiet</Badge></>}</td>
                <td className="tabular-nums">{p.lettersIn7d}</td>
                <td className="tabular-nums">{p.missedOf3}{p.missedOf3 >= 2 && <> <Badge tone="bad">drifting</Badge></>}</td>
                <td className="tabular-nums">{p.au ?? "—"}</td>
                <td className="tabular-nums">{p.goalsMet} met · {p.goalsOpen} open</td>
                <td className="space-x-1">{p.summoned && <Badge tone="bad">summoned</Badge>}{p.member.map((s) => <Badge key={s} tone="accent">{s}</Badge>)}{p.invited.filter((s) => !p.member.some((mm) => mm.toLowerCase().includes(s))).map((s) => <Badge key={s}>invited: {s}</Badge>)}</td>
              </tr>
            );
          })}
        </Table>
      )}
    </Panel>
  );
}
