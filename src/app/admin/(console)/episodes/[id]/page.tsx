import { Suspense } from "react";
import { notFound } from "next/navigation";
import { decisionRounds, getCalendar, getSeasons, todayOf } from "@/lib/admin/queries";
import { adminDb } from "@/lib/admin/auth";
import { fmtDate, fmtDateTime } from "@/lib/admin/format";
import { A, Badge, Empty, Loading, PageHeader, Panel, Table, statusTone } from "../../ui";

export default function EpisodePage({ params }: PageProps<"/admin/episodes/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/admin/episodes/[id]">["params"] }) {
  const { id } = await params;
  const db = await adminDb();
  const { data: ep } = await db.from("episodes").select("*").eq("id", id).maybeSingle();
  if (!ep) notFound();
  const { seasons } = await getSeasons();
  const season = seasons.find((s) => s.id === ep.campaign_id);
  if (!season) notFound();
  const [{ episodes, rounds: all }, marks] = await Promise.all([getCalendar(season.id), decisionRounds(season.id)]);
  const rounds = all.filter((r) => r.episode_id === id);
  const today = todayOf(all);
  const ids = rounds.map((r) => r.id);
  const [{ data: mail }, { data: packets }] = await Promise.all([
    ids.length ? db.from("correspondence").select("round_id").in("round_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? db.from("order_packets").select("round_id, mode").in("round_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const mailBy = (rid: string) => ((mail ?? []) as { round_id: string }[]).filter((m) => m.round_id === rid).length;
  const packetsBy = (rid: string) => ((packets ?? []) as { round_id: string; mode: string }[]).filter((p) => p.round_id === rid);
  const prev = episodes.find((e) => e.number === ep.number - 1);
  const next = episodes.find((e) => e.number === ep.number + 1);

  return (
    <>
      <PageHeader kicker={`${season.title} · Episode ${ep.number}`} title={ep.title}>
        <Badge tone={statusTone(ep.status)}>{ep.status}</Badge>{" "}
        {prev && <A href={`/admin/episodes/${prev.id}`}>← Ep {prev.number}</A>}{prev && next && " · "}{next && <A href={`/admin/episodes/${next.id}`}>Ep {next.number} →</A>}
      </PageHeader>
      {ep.premise && <Panel title="Premise" className="mb-4"><p className="whitespace-pre-line text-sm leading-relaxed">{ep.premise}</p></Panel>}
      <Panel title="Days">
        {!rounds.length ? <Empty>No days are assigned to this episode.</Empty> : (
          <Table head={["Day", "Date", "Status", "Locks", "Votes closing", "Packets", "Letters"]}>
            {rounds.map((r) => {
              const ps = packetsBy(r.id);
              const missed = ps.filter((p) => p.mode === "missed").length;
              return (
                <tr key={r.id} className={r.number === today?.number ? "bg-paper-2" : ""}>
                  <td className="whitespace-nowrap"><A href={`/admin/schedule/${r.number}`}>Day {r.number}</A> <span className="text-xs text-ink-2">({r.episode_round})</span></td>
                  <td className="whitespace-nowrap">{fmtDate(r.opens_at, season.timezone)}</td>
                  <td><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                  <td className="whitespace-nowrap text-ink-2">{fmtDateTime(r.locks_at, season.timezone)}</td>
                  <td className="tabular-nums">{marks.get(r.number) ?? ""}</td>
                  <td className="tabular-nums">{ps.length || ""}{missed ? <span className="text-warn"> ({missed} missed)</span> : ""}</td>
                  <td className="tabular-nums">{mailBy(r.id) || ""}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </Panel>
    </>
  );
}
