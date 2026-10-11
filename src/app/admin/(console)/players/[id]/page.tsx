import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPlayer, getSeasons } from "@/lib/admin/queries";
import { ago, fmtDate, fmtDateTime, money, payloadLine, pct } from "@/lib/admin/format";
import { requestBrief } from "../../actions";
import { AutoRefresh } from "../../auto-refresh";
import { A, Badge, Empty, KV, Loading, PageHeader, Panel, Stat, Table, statusTone } from "../../ui";

// The brief is written after the response; give it room on Vercel.
export const maxDuration = 300;

export default function PlayerPage({ params }: PageProps<"/admin/players/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/admin/players/[id]">["params"] }) {
  const { id } = await params;
  const { season } = await getSeasons();
  const d = await getPlayer(id, season?.id ?? null);
  if (!d) notFound();
  const { player, character, activity: a, subscriptions, briefs } = d;
  const sub = subscriptions[0] ?? null;
  const tz = season?.timezone;
  const brief = briefs[0] ?? null;
  const missed = a?.modes.missed ?? 0;

  return (
    <>
      <PageHeader kicker="Player" title={player.display_name ?? player.email}>
        {player.email} · joined {fmtDate(player.created_at, tz)} · {player.user_id ? "has a web login" : "mail only"} · AI consent {player.consent_ai_processing_at ? fmtDate(player.consent_ai_processing_at, tz) : <span className="text-warn">not recorded</span>}
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Subscription">
          {!sub ? <Empty>No subscription on file. Billing is not wired to a provider yet; rows go in <code>subscriptions</code>.</Empty> : (
            <>
              <KV rows={[
                ["Status", <Badge key="s" tone={statusTone(sub.status)}>{sub.status}</Badge>],
                ["Plan", `${sub.plan}${sub.amount_cents != null ? ` · ${money(sub.amount_cents, sub.currency ?? "usd")}` : ""}`],
                ["Provider", `${sub.provider}${sub.provider_customer_id ? ` · ${sub.provider_customer_id}` : ""}`],
                ["Started", fmtDate(sub.started_at, tz)],
                ["Current period ends", fmtDate(sub.current_period_end, tz)],
                ["Cancels", sub.cancel_at ? fmtDate(sub.cancel_at, tz) : sub.canceled_at ? `canceled ${fmtDate(sub.canceled_at, tz)}` : "—"],
                ...(sub.notes ? [["Notes", sub.notes] as [string, string]] : []),
              ]} />
              {subscriptions.length > 1 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-ink-2">History ({subscriptions.length - 1} earlier)</summary>
                  <ul className="mt-2 space-y-1">{subscriptions.slice(1).map((s) => <li key={s.id}>{s.plan} · {s.status} · {fmtDate(s.started_at, tz)}</li>)}</ul>
                </details>
              )}
            </>
          )}
        </Panel>

        <Panel title="Character">
          {!character ? <Empty>Not cast in {season?.title ?? "this season"}.</Empty> : (
            <KV rows={[
              ["Plays", <A key="c" href={`/admin/casting/${character.id}`}>{character.name}</A>],
              ["Title", character.title ?? "—"],
              ["Status", <Badge key="s" tone={statusTone(character.status)}>{character.status}</Badge>],
              ["Clearance", String(character.clearance)],
              ["Specialization", character.specialization ?? "—"],
              ["Memberships", a?.memberships.map((m) => `${m.organizations?.name}${m.role ? ` (${m.role})` : ""}`).join("; ") || "—"],
            ]} />
          )}
        </Panel>
      </div>

      {a && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="Letters sent" value={a.sent} hint={a.mail[0] ? `last ${ago(a.mail[0].received_at)}` : "none yet"} />
            <Stat label="Letters received" value={a.received} />
            <Stat label="Days with orders" value={a.rounds - missed} hint={`${a.rounds} packets`} />
            <Stat label="Missed days" value={missed} tone={missed ? "warn" : undefined} hint={pct(missed, a.rounds)} />
            <Stat label="Votes cast" value={a.votes.length} />
          </div>

          <Panel
            title="Showrunner's brief"
            className="mt-4"
            action={
              <form action={requestBrief}>
                <input type="hidden" name="player_id" value={player.id} />
                <input type="hidden" name="campaign_id" value={character?.campaign_id ?? ""} />
                <button disabled={brief?.status === "pending"} className="border border-ink px-2 py-0.5 text-xs hover:bg-ink hover:text-paper disabled:opacity-50">
                  {brief?.status === "pending" ? "Writing…" : brief ? "Rewrite" : "Write brief"}
                </button>
              </form>
            }
          >
            {!brief ? <Empty>No brief yet. The model reads this player&apos;s orders, votes, agreements and recent letters and writes what they have done, what they seem to be after, and whether they are drifting.</Empty>
              : brief.status === "pending" ? <p className="animate-pulse text-sm text-ink-2">The model is reading the file (requested {ago(brief.created_at)}). This page updates itself.<AutoRefresh /></p>
              : brief.status === "failed" ? <p className="text-sm text-stamp">The last attempt failed: {brief.error}. The worker retries it.</p>
              : (
                <>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{brief.body}</p>
                  <p className="mt-3 text-xs text-ink-2">{brief.model} · through day {brief.through_round ?? "—"} · {fmtDateTime(brief.finished_at, tz)}. A model&apos;s reading, not a ruling.</p>
                </>
              )}
          </Panel>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Panel title="What they're doing">
              <KV rows={[
                ["Writes to most", a.contacts.slice(0, 6).map(([n, k]) => `${n} (${k})`).join(", ") || "—"],
                ["Order verbs", Object.entries(a.verbs).sort((x, y) => y[1] - x[1]).map(([v, k]) => `${v} ×${k}`).join(", ") || "—"],
                ["Day modes", Object.entries(a.modes).map(([m, k]) => `${m} ${k}`).join(" · ") || "—"],
                ["Agreements", a.agreements.map((g) => `${g.title ?? g.kind} with ${g.partyNames.join(", ")} (${g.status})`).join("; ") || "—"],
              ]} />
              <p className="mb-1 mt-4 text-[11px] uppercase tracking-wider text-ink-2">Recent orders</p>
              {!a.recentPackets.length ? <Empty>No order packets.</Empty> : (
                <ul className="space-y-1 text-xs">
                  {a.recentPackets.map((p, i) => (
                    <li key={i}><A href={`/admin/schedule/${p.rounds?.number}`}>Day {p.rounds?.number}</A> <Badge tone={p.mode === "missed" ? "warn" : "muted"}>{p.mode}</Badge> {p.orders.map((o) => `${o.verb} ${payloadLine(o.args)}`).join("; ")}</li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Voting record">
              {!a.votes.length ? <Empty>No votes cast.</Empty> : (
                <Table head={["Motion", "Vote", "Day", "Result"]}>
                  {a.votes.map((v, i) => (
                    <tr key={i}>
                      <td>{v.motions?.number} {v.motions?.title}</td>
                      <td className={v.choice === "for" ? "text-ok" : v.choice === "against" ? "text-stamp" : "text-ink-2"}>{v.choice}</td>
                      <td className="tabular-nums">{v.cast_round}</td>
                      <td><Badge tone={statusTone(v.motions?.status)}>{v.motions?.status ?? "—"}</Badge></td>
                    </tr>
                  ))}
                </Table>
              )}
            </Panel>
          </div>

          <Panel title="Letters they sent, with what the engine read in them" className="mt-4">
            {!a.mail.length ? <Empty>No letters yet.</Empty> : (
              <ul className="divide-y divide-rule/60">
                {a.mail.map((m) => (
                  <li key={m.id} className="py-2 text-sm">
                    <p><b>{m.subject ?? "(no subject)"}</b> <span className="text-xs text-ink-2">→ {m.to.join(", ") || "?"} · {fmtDateTime(m.received_at, tz)}</span></p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-2">{m.body_text}</p>
                    {m.correspondence_events.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-xs">
                        {m.correspondence_events.map((e, i) => <li key={i}><Badge tone="accent">{e.kind}</Badge> {payloadLine(e.payload)} <span className="text-ink-2">({Math.round(e.confidence * 100)}%)</span></li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
