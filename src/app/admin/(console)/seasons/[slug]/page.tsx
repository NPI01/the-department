import { Suspense } from "react";
import { notFound } from "next/navigation";
import { decisionRounds, getCalendar, getRules, getSeasonCounts, getSeasons, todayOf } from "@/lib/admin/queries";
import { fmtDate } from "@/lib/admin/format";
import { A, Badge, Empty, KV, Loading, PageHeader, Panel, Table, statusTone } from "../../ui";
import { Timeline } from "../../schedule/parts";

export default function SeasonPage({ params }: PageProps<"/admin/seasons/[slug]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/admin/seasons/[slug]">["params"] }) {
  const { slug } = await params;
  const { seasons } = await getSeasons();
  const season = seasons.find((s) => s.slug === slug);
  if (!season) notFound();
  const [{ episodes, rounds }, counts, rules, marks] = await Promise.all([getCalendar(season.id), getSeasonCounts(season.id), getRules(season.id), decisionRounds(season.id)]);
  const today = todayOf(rounds);
  // The rule in force now: latest effective_from at or before today with no end before it.
  const now = today?.number ?? 1;
  const inForce = new Map<string, (typeof rules)[number]>();
  for (const r of rules) if (r.effective_from_round <= now && (r.effective_to_round == null || r.effective_to_round >= now)) inForce.set(r.key, r);

  return (
    <>
      <PageHeader kicker="Season" title={season.title}>
        <Badge tone={statusTone(season.status)}>{season.status}</Badge> {counts.episodes} episodes · {counts.rounds} days · {counts.pcs} players · {counts.npcs} NPCs · {counts.motions} motions · {counts.mail} letters
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel title="Episodes">
          {!episodes.length ? <Empty>No episodes have been written into the database yet.</Empty> : (
            <Table head={["#", "Title", "Status", "Days", "Dates", "Votes"]}>
              {episodes.map((e) => {
                const rs = rounds.filter((r) => r.episode_id === e.id);
                const votes = rs.reduce((n, r) => n + (marks.get(r.number) ?? 0), 0);
                return (
                  <tr key={e.id}>
                    <td className="tabular-nums">{e.number}</td>
                    <td><A href={`/admin/episodes/${e.id}`}>{e.title}</A>{e.premise && <p className="line-clamp-1 text-xs text-ink-2">{e.premise}</p>}</td>
                    <td><Badge tone={statusTone(e.status)}>{e.status}</Badge></td>
                    <td className="tabular-nums">{rs.length ? `${rs[0].number}–${rs.at(-1)!.number}` : "—"}</td>
                    <td className="whitespace-nowrap text-ink-2">{rs.length ? `${fmtDate(rs[0].opens_at, season.timezone)} – ${fmtDate(rs.at(-1)!.opens_at, season.timezone)}` : "—"}</td>
                    <td className="tabular-nums">{votes || ""}</td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Panel>

        <Panel title="Settings">
          <KV rows={[
            ["Slug", <code key="s">{season.slug}</code>],
            ["Timezone", season.timezone],
            ["Orders lock", season.lock_time.slice(0, 5)],
            ["Dispatch", season.dispatch_time.slice(0, 5)],
            ["Today", today ? `Day ${today.number}` : "—"],
          ]} />
        </Panel>
      </div>

      <Panel title="Timeline" className="mt-4">
        <Timeline episodes={episodes} rounds={rounds} today={today?.number ?? null} marks={marks} tz={season.timezone} />
      </Panel>

      <Panel title={`Rules in force on day ${now}`} className="mt-4">
        {!inForce.size ? <Empty>No rules.</Empty> : (
          <Table head={["Key", "Value", "Since", "Enacted by"]}>
            {[...inForce.values()].map((r) => (
              <tr key={r.key}>
                <td><code className="text-xs">{r.key}</code></td>
                <td><code className="text-xs">{JSON.stringify(r.value)}</code></td>
                <td className="tabular-nums">day {r.effective_from_round}</td>
                <td className="text-ink-2">{r.enacted_by ?? "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
