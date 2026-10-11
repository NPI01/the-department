import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCharacter, getSeasons } from "@/lib/admin/queries";
import { fmtDateTime } from "@/lib/admin/format";
import { A, Badge, Empty, KV, Loading, PageHeader, Panel, Table, statusTone } from "../../ui";

export default function CharacterPage({ params }: PageProps<"/admin/casting/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/admin/casting/[id]">["params"] }) {
  const { id } = await params;
  const d = await getCharacter(id);
  if (!d) notFound();
  const { seasons } = await getSeasons();
  const tz = seasons.find((s) => s.id === d.character.campaign_id)?.timezone;
  const c = d.character;
  const npc = c.npc_state as Record<string, unknown> | null;

  return (
    <>
      <PageHeader kicker={`Casting Call · ${c.player_id ? "player character" : "NPC"}`} title={c.name}>
        <Badge tone={statusTone(c.status)}>{c.status}</Badge> {c.title ?? "No title"}{d.division && <> · {d.division}</>} · clearance {c.clearance}
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="File">
          <KV rows={[
            ["Mailbox", <code key="m">{c.slug}@</code>],
            ["Aliases", d.aliases.length ? d.aliases.map((a) => `${a.mailbox}@${a.label ? ` (${a.label})` : ""}`).join(", ") : "—"],
            ["Specialization", c.specialization ?? "—"],
            ["Played by", d.player ? <A key="p" href={`/admin/players/${d.player.id}`}>{d.player.display_name ?? d.player.email}</A> : "Engine (NPC)"],
            ["Memberships", d.memberships.length ? d.memberships.map((m) => `${m.organizations?.name ?? "?"}${m.role ? ` (${m.role})` : ""}${m.voting_weight !== 1 ? ` ×${m.voting_weight}` : ""}`).join("; ") : "—"],
            ["Resources", d.resources.length ? d.resources.map((r) => `${r.kind} ${r.balance}${r.cap != null ? `/${r.cap}` : ""}`).join(" · ") : "—"],
          ]} />
          {c.public_profile && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{c.public_profile}</p>}
        </Panel>

        <Panel title="NPC state">
          {c.player_id ? <Empty>Played by a person; no model state.</Empty> : !npc ? <Empty>Not yet voiced. npc_state is filled when the Personnel Directory is loaded.</Empty> : (
            <KV rows={Object.entries(npc).map(([k, v]) => [k, typeof v === "string" ? v : <code key={k} className="whitespace-pre-wrap text-xs">{JSON.stringify(v, null, 2)}</code>])} />
          )}
        </Panel>

        <Panel title="Relationships">
          {!d.relationships.length ? <Empty>None recorded.</Empty> : (
            <Table head={["Toward", "Trust", "Obligation", ""]}>
              {d.relationships.sort((a, b) => b.trust - a.trust).map((r) => (
                <tr key={r.to_character}>
                  <td><A href={`/admin/casting/${r.to_character}`}>{r.name}</A></td>
                  <td className={`tabular-nums ${r.trust > 0.2 ? "text-ok" : r.trust < -0.2 ? "text-stamp" : ""}`}>{r.trust.toFixed(2)}</td>
                  <td className="tabular-nums">{r.obligation.toFixed(2)}</td>
                  <td>{r.hostility && <Badge tone="bad">hostile</Badge>}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>

        <Panel title="Holdings">
          {!d.assets.length ? <Empty>Holds nothing on file.</Empty> : (
            <ul className="space-y-1 text-sm">{d.assets.map((a, i) => <li key={i}>{a.name} <span className="text-xs text-ink-2">{a.kind}{a.tier ? ` · ${a.tier}` : ""}</span> {a.secret && <Badge>secret</Badge>}</li>)}</ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent correspondence" className="mt-4">
        {!d.mail.length ? <Empty>No letters to or from this character.</Empty> : (
          <Table head={["When", "Direction", "Subject", "From → To"]}>
            {d.mail.map((m) => (
              <tr key={m.id}>
                <td className="whitespace-nowrap text-ink-2">{fmtDateTime(m.received_at, tz)}</td>
                <td>{m.from_character === c.id ? "sent" : "received"}</td>
                <td>{m.subject ?? "(no subject)"}</td>
                <td className="text-xs text-ink-2">{m.from_character ? d.names.get(m.from_character)?.name ?? "?" : "outside"} → {m.to_characters.map((t) => d.names.get(t)?.name ?? "?").join(", ")}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
