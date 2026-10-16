import { Suspense } from "react";
import { adminDb } from "@/lib/admin/auth";
import { fmtDateTime } from "@/lib/admin/format";
import { Badge, Empty, Loading, PageHeader, Panel, Table, type Tone } from "../ui";
import { setMode } from "./actions";

/* The Showrunner's Room: the season log it writes each night, every decision
   with its checks, and the one switch (shadow or live) per cohort.
   docs/showrunner-room-proposal.md. Nothing here asks anyone to decide. */

export default function RoomPage() {
  return (
    <>
      <PageHeader kicker="The Showrunner's Room" title="Season log">
        Each night after the lock the room decides what is waiting (triage) and moves the story (at most two moves a cohort), then writes a page for itself. In shadow it runs and logs but commits nothing; in live it runs the show. Level 2 moves need a second Showrunner read to agree.
      </PageHeader>
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}

const tone: Record<string, Tone> = { commit: "ok", keep: "ok", approve: "ok", met: "ok", partly_met: "ok", answer: "accent", rejected: "bad", retire: "warn", reject: "warn", not_met: "warn", error: "bad" };
type Decision = { id: string; campaign_id: string; round: number; phase: string; kind: string; level: number; verdict: string; reason: string | null; params: unknown; checks: { continuity: string[]; skeptic: string[]; rules: string[] } | null; dissent: { agree: boolean; reason: string } | null; mode: string; committed: boolean; touched: unknown; created_at: string };

async function Content() {
  const db = await adminDb();
  const [{ data: campaigns }, { data: logs }, { data: decisions }, { data: modes }] = await Promise.all([
    db.from("campaigns").select("id, title, status").neq("status", "complete").order("created_at"),
    db.from("room_log").select("*").order("created_at", { ascending: false }).limit(20),
    db.from("room_decisions").select("*").order("created_at", { ascending: false }).limit(80),
    db.from("rules").select("campaign_id, value").eq("key", "room.mode"),
  ]);
  const mode = new Map((modes ?? []).map((m) => [m.campaign_id as string, m.value === "live" ? "live" : "shadow"]));
  const cname = new Map((campaigns ?? []).map((c) => [c.id as string, c.title as string]));
  const ds = (decisions ?? []) as Decision[];
  const flags = (c: Decision["checks"]) => c ? [...c.continuity.map((x) => `continuity ${x}`), ...c.skeptic.map((x) => `skeptic ${x}`), ...c.rules.map((x) => `rules ${x}`)] : [];

  return (
    <div className="grid gap-4">
      <Panel title="Cohorts">
        {!campaigns?.length ? <Empty>No cohorts.</Empty> : (
          <div className="grid gap-2">
            {campaigns.map((c) => {
              const m = mode.get(c.id as string) ?? "shadow";
              return (
                <form key={c.id as string} action={setMode} className="flex flex-wrap items-center gap-3 border border-rule px-3 py-2 text-sm">
                  <input type="hidden" name="campaign_id" value={c.id as string} />
                  <b>{c.title as string}</b> <Badge tone={m === "live" ? "ok" : "warn"}>{m}</Badge>
                  <span className="text-xs text-ink-2">{m === "live" ? "The room runs this cohort." : "The room decides and logs; nothing commits."}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <input type="hidden" name="mode" value={m === "live" ? "shadow" : "live"} />
                    {m !== "live" && <label className="flex items-center gap-1 text-xs text-ink-2"><input type="checkbox" name="confirm" value="yes" /> I have read its shadow log</label>}
                    <button className="border border-ink px-2.5 py-1 text-xs hover:bg-ink hover:text-paper">{m === "live" ? "Back to shadow" : "Go live"}</button>
                  </span>
                </form>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="The log">
        {!logs?.length ? <Empty>No pages yet. The first lock after this deploy writes one.</Empty> : (
          <div className="grid gap-3">
            {logs.map((l) => (
              <details key={`${l.campaign_id}-${l.round}`} className="border border-rule bg-paper-2/40 px-3 py-2" open={l === logs[0]}>
                <summary className="cursor-pointer text-sm"><b>{cname.get(l.campaign_id as string) ?? "?"}</b> · Round {l.round as number} <Badge tone={l.mode === "live" ? "ok" : "warn"}>{l.mode as string}</Badge> <span className="text-xs text-ink-2">{fmtDateTime(l.created_at as string)}</span></summary>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{l.log as string}</p>
                {l.notes ? <p className="mt-2 text-xs text-ink-2">Notes for tomorrow: {JSON.stringify(l.notes)}</p> : null}
              </details>
            ))}
          </div>
        )}
      </Panel>

      <Panel title={`Decisions · last ${ds.length}`}>
        {!ds.length ? <Empty>None yet.</Empty> : (
          <Table head={["When", "Cohort · round", "Phase · kind", "Verdict", "Reason, checks, dissent"]}>
            {ds.map((d) => (
              <tr key={d.id}>
                <td className="whitespace-nowrap text-xs text-ink-2">{fmtDateTime(d.created_at)}</td>
                <td className="text-xs">{cname.get(d.campaign_id) ?? "?"} · R{d.round}</td>
                <td className="text-xs">{d.phase} · {d.kind}{d.level === 2 ? " · L2" : ""}</td>
                <td><Badge tone={tone[d.verdict] ?? "muted"}>{d.verdict}</Badge>{d.committed ? <span className="ml-1 text-[10px] uppercase tracking-wider text-ok">live</span> : <span className="ml-1 text-[10px] uppercase tracking-wider text-ink-2">{d.mode}</span>}</td>
                <td className="text-xs">
                  {d.reason}
                  {d.params ? <details className="mt-1"><summary className="cursor-pointer text-ink-2">parameters</summary><pre className="max-h-48 overflow-auto border border-rule bg-paper p-2 text-[11px]">{JSON.stringify(d.params, null, 1)}</pre></details> : null}
                  {flags(d.checks).length ? <ul className="mt-1 text-warn">{flags(d.checks).map((f, i) => <li key={i}>{f}</li>)}</ul> : null}
                  {d.dissent ? <p className="mt-1 text-ink-2">Second read {d.dissent.agree ? "agreed" : "disagreed"}: {d.dissent.reason}</p> : null}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}
