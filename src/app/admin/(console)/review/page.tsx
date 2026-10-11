import { Suspense } from "react";
import Link from "next/link";
import { getProposals, getReviewSummary, type View } from "@/lib/admin/review";
import { ago, nowMs } from "@/lib/admin/format";
import { Empty, Loading, PageHeader, Panel, Stat } from "../ui";
import { ProposalCard, docHref, tierOf } from "./proposal-card";

export default function ReviewPage({ searchParams }: PageProps<"/admin/review">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

const VIEWS: { key: View; label: string }[] = [
  { key: "open", label: "Awaiting you" },
  { key: "decided", label: "Decided, not yet applied" },
  { key: "applied", label: "Applied" },
  { key: "all", label: "Everything" },
];
const TIERS = [{ key: "", label: "All docs" }, { key: "public", label: "Public canon" }, { key: "secret", label: "Secret canon" }, { key: "draft", label: "Drafts" }];

async function Content({ searchParams }: { searchParams: PageProps<"/admin/review">["searchParams"] }) {
  const sp = await searchParams;
  const view = (VIEWS.find((v) => v.key === sp.view)?.key ?? "open") as View;
  const tier = typeof sp.tier === "string" ? sp.tier : "";
  const kind = typeof sp.kind === "string" ? sp.kind : "";
  const [summary, all] = await Promise.all([getReviewSummary(), getProposals({ view, tier: tier || undefined })]);
  const items = kind ? all.filter((p) => p.kind === kind) : all;
  const href = (o: Record<string, string>) => {
    const q = new URLSearchParams({ ...(view !== "open" ? { view } : {}), ...(tier ? { tier } : {}), ...(kind ? { kind } : {}), ...o });
    for (const [k, v] of [...q.entries()]) if (!v) q.delete(k);
    const s = q.toString();
    return `/admin/review${s ? `?${s}` : ""}`;
  };
  const chip = (on: boolean) => `border px-2 py-0.5 ${on ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-ink"}`;
  const now = nowMs();
  const docs = [...new Set(items.map((p) => p.doc_path))];

  return (
    <>
      <PageHeader kicker="Review" title="Proposals">
        Everything marked PROPOSED in canon and the drafts, plus the questions they ask you. Decisions are saved here;
        applying them to the text happens in the repo (<code>pnpm canon:decisions</code> writes the worklist).
        Last synced {ago(summary.lastSync.at, now)}{summary.lastSync.sha ? ` from ${summary.lastSync.sha.slice(0, 7)}` : ""}.
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Awaiting you" value={summary.open} hint={`${summary.openQuestions} questions`} tone={summary.open ? "warn" : undefined} />
        <Stat label="Decided, not applied" value={summary.decided} hint="waiting for an edit to canon" />
        <Stat label="Applied" value={summary.applied} />
        <Stat label="Documents" value={summary.docs.length} hint={`${summary.docs.filter((d) => d.open).length} with open items`} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {VIEWS.map((v) => <Link key={v.key} href={href({ view: v.key === "open" ? "" : v.key })} className={chip(view === v.key)}>{v.label}</Link>)}
      </div>
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {TIERS.map((t) => <Link key={t.key} href={href({ tier: t.key })} className={chip(tier === t.key)}>{t.label}</Link>)}
        <span className="mx-1 text-rule">|</span>
        {[{ key: "", label: "All kinds" }, { key: "question", label: "Questions" }, { key: "item", label: "Items" }, { key: "document", label: "Whole documents" }].map((k) => (
          <Link key={k.key} href={href({ kind: k.key })} className={chip(kind === k.key)}>{k.label}</Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[16rem_1fr]">
        <Panel title="Documents" className="self-start xl:sticky xl:top-6">
          <ul className="space-y-1.5 text-sm">
            {summary.docs.filter((d) => !tier || tierOf(d.path) === tier).map((d) => (
              <li key={d.path} className="flex items-baseline justify-between gap-2">
                <Link href={docHref(d.path)} className="min-w-0 truncate hover:underline" title={d.path}>{d.title}</Link>
                <span className={`shrink-0 text-xs tabular-nums ${d.open ? "text-warn" : "text-ink-2"}`}>{d.open || "·"}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="min-w-0 space-y-6">
          {!items.length ? <Empty>{view === "open" ? "Nothing is waiting for you." : "Nothing here."}</Empty> : docs.map((d) => (
            <section key={d}>
              <h2 className="mb-2 flex flex-wrap items-baseline gap-2 text-sm">
                <Link href={docHref(d)} className="font-semibold hover:underline">{d}</Link>
                <span className="text-xs text-ink-2">{items.filter((p) => p.doc_path === d).length} shown</span>
              </h2>
              <div className="space-y-3">{items.filter((p) => p.doc_path === d).map((p) => <ProposalCard key={p.id} p={p} />)}</div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
