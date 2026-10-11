import { Suspense } from "react";
import { notFound } from "next/navigation";
import { characterNames, dayDetail, decisionRounds, decisionsFor, getCalendar, getSeasons, todayOf } from "@/lib/admin/queries";
import { fmtDate, fmtDateTime, payloadLine } from "@/lib/admin/format";
import { A, Badge, Empty, Loading, PageHeader, Panel, Table, statusTone } from "../../ui";
import { DecisionCard, Timeline } from "../parts";

export default function DayPage({ params }: PageProps<"/admin/schedule/[round]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

const PHASE_ORDER = ["intake", "lock", "validate", "governance", "diplomatic", "strategic", "world", "narrate", "send"];

async function Content({ params }: { params: PageProps<"/admin/schedule/[round]">["params"] }) {
  const n = Number((await params).round);
  const { season } = await getSeasons();
  if (!season || !Number.isInteger(n)) notFound();
  const { episodes, rounds } = await getCalendar(season.id);
  const round = rounds.find((r) => r.number === n);
  if (!round) notFound();
  const tz = season.timezone;
  const [decisions, detail, names, marks] = await Promise.all([decisionsFor(season.id, n), dayDetail(season.id, round), characterNames(season.id), decisionRounds(season.id)]);
  const ep = episodes.find((e) => e.id === round.episode_id);
  const today = todayOf(rounds);
  const resolved = round.status === "resolved";
  const name = (id: string) => names.get(id)?.name ?? "Unknown";
  const phases = [...new Set(detail.events.map((e) => e.phase ?? "—"))].sort((a, b) => PHASE_ORDER.indexOf(a) - PHASE_ORDER.indexOf(b));
  const modes = detail.packets.reduce<Record<string, number>>((m, p) => ({ ...m, [p.mode]: (m[p.mode] ?? 0) + 1 }), {});

  return (
    <>
      <PageHeader kicker={`Season Schedule · ${ep ? `Episode ${ep.number}, day ${round.episode_round}` : "no episode"}`} title={`Day ${n} · ${fmtDate(round.opens_at, tz)}`}>
        <Badge tone={statusTone(round.status)}>{round.status}</Badge> Opens {fmtDateTime(round.opens_at, tz)} · locks {fmtDateTime(round.locks_at, tz)}
        {round.resolved_at && <> · resolved {fmtDateTime(round.resolved_at, tz)}</>}
        <span className="ml-3 whitespace-nowrap">
          {n > 1 && <A href={`/admin/schedule/${n - 1}`}>← Day {n - 1}</A>}
          {n < rounds.length && <> · <A href={`/admin/schedule/${n + 1}`}>Day {n + 1} →</A></>}
        </span>
      </PageHeader>

      <Panel title="Timeline" className="mb-6">
        <Timeline episodes={episodes} rounds={rounds} today={today?.number ?? null} selected={n} marks={marks} tz={tz} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <Panel title={resolved ? "Decided this day" : "To be decided this day"}>
            {decisions.closing.length ? <div className="space-y-3">{decisions.closing.map((m) => <DecisionCard key={m.id} m={m} pending={!resolved} />)}</div> : <Empty>No votes closed this day.</Empty>}
          </Panel>
          {decisions.opening.length > 0 && (
            <Panel title="Opened for voting">
              <div className="space-y-3">{decisions.opening.map((m) => <DecisionCard key={m.id} m={m} pending />)}</div>
            </Panel>
          )}
          <Panel title={`Engine log · ${detail.events.length} events`}>
            {!detail.events.length ? <Empty>Nothing was logged for this day.</Empty> : phases.map((ph) => (
              <div key={ph} className="mb-4 last:mb-0">
                <p className="mb-1 text-[11px] uppercase tracking-wider text-ink-2">{ph}</p>
                <ul className="space-y-1 text-sm">
                  {detail.events.filter((e) => (e.phase ?? "—") === ph).map((e) => (
                    <li key={e.id} className="grid grid-cols-[auto_1fr] gap-x-3">
                      <code className="text-xs">{e.kind}</code>
                      <span className="min-w-0 break-words text-xs text-ink-2">
                        {payloadLine(e.payload)}
                        {e.visible_to?.length ? <> · seen by {e.visible_to.map(name).join(", ")}</> : <> · engine only</>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Orders">
            <p className="mb-3 text-sm text-ink-2">
              {detail.packets.length} packets{Object.entries(modes).map(([m, k]) => ` · ${k} ${m}`).join("")} · {detail.mail} letters filed this day
            </p>
            {!detail.packets.length ? <Empty>No order packets.</Empty> : (
              <Table head={["Character", "Mode", "Orders"]}>
                {detail.packets.sort((a, b) => name(a.character_id).localeCompare(name(b.character_id))).map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap"><A href={`/admin/casting/${p.character_id}`}>{name(p.character_id)}</A></td>
                    <td><Badge tone={p.mode === "missed" ? "warn" : "muted"}>{p.mode}</Badge> <span className="text-xs text-ink-2">{p.source}</span></td>
                    <td className="text-xs">
                      {p.orders.sort((a, b) => a.seq - b.seq).map((o) => (
                        <p key={o.seq}>
                          {o.seq}. <b>{o.verb}</b> {payloadLine(o.args)} <Badge tone={statusTone(o.status === "rejected" ? "failed" : o.status === "resolved" ? "done" : "pending")}>{o.status}</Badge>
                          {o.ruling && <span className="block text-ink-2">Ruling: {o.ruling}</span>}
                        </p>
                      ))}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Panel>
          {decisions.agreements.length > 0 && (
            <Panel title="Agreements">
              <ul className="space-y-2 text-sm">
                {decisions.agreements.map((a) => (
                  <li key={a.id}>
                    {a.title ?? a.kind} <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                    <p className="text-xs text-ink-2">
                      {a.kind} · parties {a.parties.map(name).join(", ")} · accepted by {a.accepted_by.map(name).join(", ") || "nobody"}
                      {a.proposed_round === n ? " · proposed this day" : ""}{a.expires_round === n ? " · expires this day" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
