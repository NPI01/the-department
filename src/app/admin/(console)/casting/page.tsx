import { Suspense } from "react";
import Link from "next/link";
import { getCast, getSeasons } from "@/lib/admin/queries";
import { A, Badge, Empty, Loading, PageHeader, Table, statusTone } from "../ui";

export default function CastingPage({ searchParams }: PageProps<"/admin/casting">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

const FILTERS = [
  { key: "", label: "Everyone" },
  { key: "npc", label: "NPCs" },
  { key: "player", label: "Player characters" },
  { key: "inactive", label: "Missing, dead or gone" },
];

async function Content({ searchParams }: { searchParams: PageProps<"/admin/casting">["searchParams"] }) {
  const { season } = await getSeasons();
  if (!season) return <PageHeader title="No season yet" />;
  const sp = await searchParams;
  const who = typeof sp.who === "string" ? sp.who : "";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const cast = await getCast(season.id);
  const shown = cast.filter((c) =>
    (who === "npc" ? !c.player_id : who === "player" ? Boolean(c.player_id) : who === "inactive" ? c.status !== "active" : true) &&
    (!q || `${c.name} ${c.title ?? ""} ${c.slug} ${c.division ?? ""}`.toLowerCase().includes(q)),
  );
  const npcs = cast.filter((c) => !c.player_id).length;

  return (
    <>
      <PageHeader kicker="Casting Call" title="The cast">{cast.length} characters · {npcs} NPCs · {cast.length - npcs} played</PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key ? `/admin/casting?who=${f.key}` : "/admin/casting"} className={`border px-2 py-0.5 ${who === f.key ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-ink"}`}>{f.label}</Link>
        ))}
        <form action="/admin/casting" className="ml-auto">
          {who && <input type="hidden" name="who" value={who} />}
          <input name="q" defaultValue={q} placeholder="Search name, title, division" className="w-56 border border-rule bg-paper-2 px-2 py-0.5" />
        </form>
      </div>
      {!shown.length ? <Empty>Nobody matches.</Empty> : (
        <Table head={["Name", "Title", "Division", "Clr", "Played by", "Status", "Brief"]}>
          {shown.map((c) => (
            <tr key={c.id}>
              <td className="whitespace-nowrap"><A href={`/admin/casting/${c.id}`}>{c.name}</A> <span className="text-xs text-ink-2">{c.slug}@</span></td>
              <td>{c.title ?? "—"}</td>
              <td className="text-ink-2">{c.division ?? "—"}</td>
              <td className="tabular-nums">{c.clearance}</td>
              <td>{c.player ? <A href={`/admin/players/${c.player.id}`}>{c.player.display_name ?? c.player.email}</A> : <Badge>npc</Badge>}</td>
              <td><Badge tone={statusTone(c.status)}>{c.status}</Badge></td>
              <td>{c.player_id ? "" : c.npc_state ? <Badge tone="ok">voiced</Badge> : <Badge tone="warn">no npc_state</Badge>}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
