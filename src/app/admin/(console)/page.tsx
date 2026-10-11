import { Suspense } from "react";
import { getCalendar, getEngine, getPlayers, getSeasonCounts, getSeasons, todayOf, decisionsFor, CRON_EXPECT } from "@/lib/admin/queries";
import { ago, fmtDateTime, pct, nowMs } from "@/lib/admin/format";
import { A, Badge, Empty, Loading, PageHeader, Panel, Stat, statusTone } from "./ui";

export default function Overview() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const { season } = await getSeasons();
  if (!season) return <PageHeader title="No season yet">Seed one with <code>pnpm seed</code>.</PageHeader>;
  const [counts, { episodes, rounds }, players, engine] = await Promise.all([getSeasonCounts(season.id), getCalendar(season.id), getPlayers(season.id), getEngine()]);
  const today = todayOf(rounds);
  const episode = today ? episodes.find((e) => e.id === today.episode_id) : null;
  const decisions = today ? await decisionsFor(season.id, today.number) : null;
  const subsActive = players.filter((p) => p.subscription && ["active", "trialing", "comp"].includes(p.subscription.status)).length;
  const jobs = engine.jobs.reduce((t, j) => ({ due: t.due + Number(j.due), failed: t.failed + Number(j.failed), retrying: t.retrying + Number(j.retrying) }), { due: 0, failed: 0, retrying: 0 });
  const calls = engine.models.reduce((t, m) => ({ n: t.n + Number(m.calls_24h), ok: t.ok + Number(m.ok_24h) }), { n: 0, ok: 0 });
  const now = nowMs();

  return (
    <>
      <PageHeader kicker="Overview" title={season.title}>
        <Badge tone={statusTone(season.status)}>{season.status}</Badge>{" "}
        Locks {season.lock_time.slice(0, 5)} · dispatch {season.dispatch_time.slice(0, 5)} · {season.timezone}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Today" value={today ? `Day ${today.number}` : "—"} hint={today ? `${episode ? `Ep ${episode.number}, day ${today.episode_round ?? "?"}` : "no episode"} · ${today.status}` : "no rounds scheduled"} />
        <Stat label="Decided today" value={decisions?.closing.length ?? 0} hint={decisions ? `${decisions.opening.length} motions opening` : undefined} />
        <Stat label="Players" value={players.length} hint={`${subsActive} paying or comped`} />
        <Stat label="Cast" value={counts.characters} hint={`${counts.pcs} player · ${counts.npcs} NPC`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Today" action={<A href="/admin/schedule">Schedule →</A>}>
          {!today ? <Empty>No rounds exist for this season yet.</Empty> : (
            <div className="space-y-2 text-sm">
              <p>Day {today.number} {episode && <>· <A href={`/admin/episodes/${episode.id}`}>Episode {episode.number}: {episode.title}</A></>}</p>
              <p className="text-ink-2">Opens {fmtDateTime(today.opens_at, season.timezone)} · locks {fmtDateTime(today.locks_at, season.timezone)}</p>
              {decisions && decisions.closing.length > 0 ? (
                <ul className="list-inside list-disc">
                  {decisions.closing.map((m) => <li key={m.id}>{m.number ?? ""} {m.title} <span className="text-ink-2">({m.organization})</span></li>)}
                </ul>
              ) : <Empty>Nothing closes today.</Empty>}
            </div>
          )}
        </Panel>

        <Panel title="Engine" action={<A href="/admin/engine">Health →</A>}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-ink-2">Model calls, 24h</span><span>{calls.n} · {pct(calls.ok, calls.n)} ok</span>
            <span className="text-ink-2">Jobs due</span><span>{jobs.due}</span>
            <span className="text-ink-2">Jobs failed / retrying</span><span className={jobs.failed ? "text-stamp" : ""}>{jobs.failed} / {jobs.retrying}</span>
            {Object.entries(CRON_EXPECT).map(([route, exp]) => {
              const last = engine.cron.find((c) => c.route === route);
              const stale = !last || now - new Date(last.started_at).getTime() > exp.staleAfter;
              return (
                <span key={route} className="contents">
                  <span className="text-ink-2">Cron {route}</span>
                  <span>{last ? ago(last.started_at, now) : "never"} {stale ? <Badge tone="warn">stale</Badge> : last?.ok === false ? <Badge tone="bad">failed</Badge> : <Badge tone="ok">ok</Badge>}</span>
                </span>
              );
            })}
          </div>
        </Panel>
      </div>
    </>
  );
}
