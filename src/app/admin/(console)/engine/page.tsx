import { Suspense } from "react";
import { CRON_EXPECT, getEngine } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/auth";
import { cobbleConfig } from "@/lib/cobble";
import { ago, num, payloadLine, pct, nowMs } from "@/lib/admin/format";
import { probeModels } from "../actions";
import { Badge, Empty, KV, Loading, PageHeader, Panel, Stat, Table } from "../ui";

export default function EnginePage() {
  return (
    <>
      <PageHeader kicker="Engine Health" title="The engine">Models on Cobble Network, the job queue, and the two Vercel crons.</PageHeader>
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  const e = await getEngine();
  const cfg = cobbleConfig();
  const now = nowMs();
  const jobs = e.jobs.reduce((t, j) => ({ due: t.due + Number(j.due), running: t.running + Number(j.running), failed: t.failed + Number(j.failed), retrying: t.retrying + Number(j.retrying), done: t.done + Number(j.done_24h) }), { due: 0, running: 0, failed: 0, retrying: 0, done: 0 });
  const oldest = e.jobs.map((j) => j.oldest_pending).filter(Boolean).sort()[0] ?? null;
  const calls = e.models.reduce((t, m) => ({ n: t.n + Number(m.calls_24h), ok: t.ok + Number(m.ok_24h) }), { n: 0, ok: 0 });
  const lastProbe = new Map<string, (typeof e.ledger)[number]>();
  for (const r of e.ledger) if (r.tag === "probe" && !lastProbe.has(r.model)) lastProbe.set(r.model, r);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Model calls 24h" value={num(calls.n)} hint={`${pct(calls.ok, calls.n)} succeeded`} tone={calls.n && calls.ok / calls.n < 0.8 ? "warn" : undefined} />
        <Stat label="Jobs due now" value={jobs.due} hint={oldest ? `oldest pending ${ago(oldest, now)}` : "queue empty"} tone={oldest && now - new Date(oldest).getTime() > 10 * 60_000 ? "warn" : undefined} />
        <Stat label="Jobs failed" value={jobs.failed} hint={`${jobs.retrying} retrying · ${jobs.done} done 24h`} tone={jobs.failed ? "bad" : undefined} />
        <Stat label="Running" value={jobs.running} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Model chain"
          action={<form action={probeModels}><button className="border border-ink px-2 py-0.5 text-xs hover:bg-ink hover:text-paper">Probe now</button></form>}
        >
          <p className="mb-3 text-xs text-ink-2">First available wins. Probe sends a two-token request to each model, no retries; a 429 means no replica is up.</p>
          <Table head={["Model", "Listed", "Last probe", "Calls 24h", "OK", "p50", "p95"]}>
            {cfg.models.map((m) => {
              const s = e.models.find((x) => x.model === m);
              const p = lastProbe.get(m);
              return (
                <tr key={m}>
                  <td><code className="text-xs">{m}</code></td>
                  <td><Suspense fallback="…"><Listed model={m} /></Suspense></td>
                  <td className="whitespace-nowrap">{p ? <>{p.ok ? <Badge tone="ok">up</Badge> : <Badge tone={p.status === 429 ? "warn" : "bad"}>{p.status ?? "err"}</Badge>} <span className="text-xs text-ink-2">{p.ms} ms · {ago(p.created_at, now)}</span></> : <span className="text-ink-2">—</span>}</td>
                  <td className="tabular-nums">{s?.calls_24h ?? 0}</td>
                  <td className="tabular-nums">{s ? pct(Number(s.ok_24h), Number(s.calls_24h)) : "—"}</td>
                  <td className="tabular-nums">{s?.p50_ms != null ? `${(s.p50_ms / 1000).toFixed(1)}s` : "—"}</td>
                  <td className="tabular-nums">{s?.p95_ms != null ? `${(s.p95_ms / 1000).toFixed(1)}s` : "—"}</td>
                </tr>
              );
            })}
          </Table>
          {e.models.filter((m) => !cfg.models.includes(m.model)).length > 0 && (
            <p className="mt-2 text-xs text-ink-2">Also called in 24h: {e.models.filter((m) => !cfg.models.includes(m.model)).map((m) => `${m.model} (${m.calls_24h})`).join(", ")}</p>
          )}
        </Panel>

        <Panel title="Crons">
          <Table head={["Route", "Schedule", "Last run", ""]}>
            {Object.entries(CRON_EXPECT).map(([route, exp]) => {
              const last = e.cron.find((c) => c.route === route);
              const stale = !last || now - new Date(last.started_at).getTime() > exp.staleAfter;
              return (
                <tr key={route}>
                  <td><code className="text-xs">/api/cron/{route}</code></td>
                  <td className="text-ink-2">{exp.every}</td>
                  <td className="whitespace-nowrap">{ago(last?.started_at, now)}{last?.detail && <p className="text-xs text-ink-2">{payloadLine(last.detail)}</p>}</td>
                  <td>{stale ? <Badge tone="warn">{last ? "stale" : "never ran"}</Badge> : last?.ok === false ? <Badge tone="bad">failed</Badge> : last?.finished_at ? <Badge tone="ok">ok</Badge> : <Badge tone="warn">running</Badge>}</td>
                </tr>
              );
            })}
          </Table>
          <p className="mt-3 text-xs text-ink-2">Crons fire only on Vercel; locally, call the routes with the CRON_SECRET bearer.</p>
          <div className="mt-4">
            <KV rows={[
              ["CRON_SECRET", <Set key="c" on={Boolean(process.env.CRON_SECRET)} />],
              ["COBBLE_API_KEY", <Set key="k" on={Boolean(cfg.key)} />],
              ["Thinking", cfg.thinking ? "on" : "off"],
              ["RESEND_API_KEY", <Set key="r" on={Boolean(process.env.RESEND_API_KEY)} />],
              ["RESEND_WEBHOOK_SECRET", <Set key="w" on={Boolean(process.env.RESEND_WEBHOOK_SECRET)} />],
              ["EMAIL_DOMAIN", process.env.EMAIL_DOMAIN || <Set key="d" on={false} />],
            ]} />
          </div>
        </Panel>
      </div>

      <Panel title="Job queue">
        {!e.jobs.length ? <Empty>No jobs have ever been queued.</Empty> : (
          <Table head={["Kind", "Due", "Queued", "Running", "Retrying", "Failed", "Done 24h", "Oldest pending"]}>
            {e.jobs.map((j) => (
              <tr key={j.kind}>
                <td><code className="text-xs">{j.kind}</code></td>
                <td className="tabular-nums">{j.due}</td>
                <td className="tabular-nums">{j.queued}</td>
                <td className="tabular-nums">{j.running}</td>
                <td className={`tabular-nums ${Number(j.retrying) ? "text-warn" : ""}`}>{j.retrying}</td>
                <td className={`tabular-nums ${Number(j.failed) ? "text-stamp" : ""}`}>{j.failed}</td>
                <td className="tabular-nums">{j.done_24h}</td>
                <td className="whitespace-nowrap text-ink-2">{j.oldest_pending ? ago(j.oldest_pending, now) : "—"}</td>
              </tr>
            ))}
          </Table>
        )}
        {e.failed.length > 0 && (
          <>
            <p className="mb-1 mt-4 text-[11px] uppercase tracking-wider text-ink-2">Recent job errors</p>
            <ul className="space-y-1 text-xs">
              {e.failed.map((j) => (
                <li key={j.id}><code>#{j.id} {j.kind}</code> · attempt {j.attempts}/{j.max_attempts} {j.done_at ? <Badge tone="bad">gave up</Badge> : <Badge tone="warn">retry {ago(j.run_after, now)}</Badge>} <span className="text-ink-2">{j.error}</span></li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Recent model calls">
          {!e.ledger.length ? <Empty>No model calls recorded.</Empty> : (
            <Table head={["When", "Tag", "Model", "Result", "ms", "Tokens"]}>
              {e.ledger.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap text-ink-2">{ago(r.created_at, now)}</td>
                  <td><code className="text-xs">{r.tag}</code></td>
                  <td className="text-xs">{r.model.replace(/^qwen\//, "")}</td>
                  <td>{r.ok ? <Badge tone="ok">ok</Badge> : <span title={r.error ?? ""}><Badge tone={r.status === 429 ? "warn" : "bad"}>{r.status ?? "err"}</Badge></span>}</td>
                  <td className="tabular-nums">{num(r.ms)}</td>
                  <td className="tabular-nums text-xs">{r.prompt_tokens != null ? `${num(r.prompt_tokens)} → ${num(r.completion_tokens)}` : "—"}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
        <Panel title="Recent cron runs">
          {!e.cronRecent.length ? <Empty>No cron has run against this database.</Empty> : (
            <Table head={["Route", "Started", "Took", "Result"]}>
              {e.cronRecent.map((c) => (
                <tr key={c.id}>
                  <td><code className="text-xs">{c.route}</code></td>
                  <td className="whitespace-nowrap text-ink-2">{ago(c.started_at, now)}</td>
                  <td className="tabular-nums">{c.finished_at ? `${((new Date(c.finished_at).getTime() - new Date(c.started_at).getTime()) / 1000).toFixed(1)}s` : "—"}</td>
                  <td className="text-xs">{c.ok === false ? <Badge tone="bad">failed</Badge> : null} {c.detail ? payloadLine(c.detail) : ""}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Set({ on }: { on: boolean }) {
  return on ? <Badge tone="ok">set</Badge> : <Badge tone="warn">missing</Badge>;
}

/* Whether the model shows in Cobble's live /v1/models for this key. Free to call. */
async function Listed({ model }: { model: string }) {
  await requireAdmin();
  const ids = await listModels();
  if (!ids) return <Badge tone="bad">unreachable</Badge>;
  return ids.includes(model) ? <Badge tone="ok">yes</Badge> : <Badge tone="bad">no</Badge>;
}

const listModels = (() => {
  let p: Promise<string[] | null> | null = null; let at = 0;
  return () => {
    if (!p || Date.now() - at > 30_000) {
      at = Date.now();
      const cfg = cobbleConfig();
      p = fetch(`${cfg.base}/models`, { headers: { Authorization: `Bearer ${cfg.key}` }, signal: AbortSignal.timeout(6000) })
        .then(async (r) => (r.ok ? ((await r.json()).data as { id: string }[]).map((m) => m.id) : null))
        .catch(() => null);
    }
    return p;
  };
})();
