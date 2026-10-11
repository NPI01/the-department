import { Suspense } from "react";
import { getSeasonCounts, getSeasons } from "@/lib/admin/queries";
import { fmtDate } from "@/lib/admin/format";
import { A, Badge, Empty, Loading, PageHeader, Table, statusTone } from "../ui";

export default function SeasonsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const { seasons } = await getSeasons();
  const counts = await Promise.all(seasons.map((s) => getSeasonCounts(s.id)));
  return (
    <>
      <PageHeader kicker="Seasons & Episodes" title="Seasons">Each season is a campaign: twelve episodes of fourteen days.</PageHeader>
      {!seasons.length ? <Empty>No seasons. Run <code>pnpm seed</code>.</Empty> : (
        <Table head={["Season", "Status", "Episodes", "Days", "Cast", "Motions", "Letters", "Created"]}>
          {seasons.map((s, i) => (
            <tr key={s.id}>
              <td><A href={`/admin/seasons/${s.slug}`}>{s.title}</A></td>
              <td><Badge tone={statusTone(s.status)}>{s.status}</Badge></td>
              <td className="tabular-nums">{counts[i].episodes}</td>
              <td className="tabular-nums">{counts[i].rounds}</td>
              <td className="tabular-nums">{counts[i].pcs} pc · {counts[i].npcs} npc</td>
              <td className="tabular-nums">{counts[i].motions}</td>
              <td className="tabular-nums">{counts[i].mail}</td>
              <td className="text-ink-2">{fmtDate(s.created_at, s.timezone)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
