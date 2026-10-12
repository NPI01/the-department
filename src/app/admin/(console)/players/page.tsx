import { Suspense } from "react";
import { getPlayers, getSeasons } from "@/lib/admin/queries";
import { ago, fmtDate, money, nowMs } from "@/lib/admin/format";
import { A, Badge, Empty, Loading, PageHeader, Stat, Table, statusTone } from "../ui";

export default function PlayersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const { season } = await getSeasons();
  const players = await getPlayers(season?.id ?? null);
  const now = nowMs();
  const paying = players.filter((p) => p.subscription && ["active", "trialing"].includes(p.subscription.status));
  const mrr = paying.reduce((n, p) => n + (p.subscription?.amount_cents ?? 0), 0);
  const quiet = players.filter((p) => p.character && (!p.lastActive || now - new Date(p.lastActive).getTime() > 3 * 86400_000)).length;

  return (
    <>
      <PageHeader kicker="Players" title="Players">{season ? `Characters shown for ${season.title}.` : null}</PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Players" value={players.length} hint={`${players.filter((p) => p.character).length} cast this season`} />
        <Stat label="Paying" value={paying.length} hint={`${players.filter((p) => p.subscription?.status === "comp").length} comped`} />
        <Stat label="Billed per period" value={money(mrr)} />
        <Stat label="Quiet 3+ days" value={quiet} tone={quiet ? "warn" : undefined} hint="cast, no letters sent lately" />
      </div>
      {!players.length ? <Empty>No players have been admitted yet. Applicants sit in the <code>applicants</code> table until a cohort convenes.</Empty> : (
        <Table head={["Player", "Character", "Application", "Subscription", "Renews", "Last letter", "Joined"]}>
          {players.map((p) => (
            <tr key={p.id}>
              <td><A href={`/admin/players/${p.id}`}>{p.display_name ?? p.email}</A>{p.display_name && <p className="text-xs text-ink-2">{p.email}</p>}</td>
              <td>{p.character ? <><A href={`/admin/casting/${p.character.id}`}>{p.character.name}</A> {p.character.status !== "active" && <Badge tone={statusTone(p.character.status)}>{p.character.status}</Badge>}</> : <span className="text-ink-2">not cast</span>}</td>
              <td>{p.application ? <Badge tone={statusTone(p.application.status === "submitted" ? "pending" : p.application.status === "approved" ? "active" : "failed")}>{p.application.status}</Badge> : <span className="text-ink-2">—</span>}</td>
              <td>{p.subscription ? <><Badge tone={statusTone(p.subscription.status)}>{p.subscription.status}</Badge> <span className="text-xs">{p.subscription.plan}</span></> : <span className="text-ink-2">none</span>}</td>
              <td className="whitespace-nowrap text-ink-2">{p.subscription?.current_period_end ? fmtDate(p.subscription.current_period_end) : "—"}</td>
              <td className="whitespace-nowrap">{p.character ? ago(p.lastActive, now) : "—"}</td>
              <td className="whitespace-nowrap text-ink-2">{fmtDate(p.created_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
