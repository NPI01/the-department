import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCanonDoc, getProposals } from "@/lib/admin/review";
import { Markdown } from "@/lib/canon/render";
import { ago, nowMs } from "@/lib/admin/format";
import { approveDocument } from "../actions";
import { A, Badge, Empty, Loading, PageHeader, Panel } from "../../ui";
import { ProposalCard } from "../proposal-card";

export default function DocPage({ searchParams }: PageProps<"/admin/review/doc">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/admin/review/doc">["searchParams"] }) {
  const sp = await searchParams;
  const path = typeof sp.path === "string" ? sp.path : "";
  const doc = path ? await getCanonDoc(path) : null;
  if (!doc) notFound();
  const proposals = await getProposals({ view: "all", doc: path });
  const live = proposals.filter((p) => p.present);
  const open = live.filter((p) => p.status === "open");
  const approvable = open.filter((p) => p.kind !== "question").length;

  return (
    <>
      <PageHeader kicker={<><A href="/admin/review">Review</A> · {doc.path}</>} title={doc.title}>
        {doc.tier === "secret" ? <Badge tone="bad">secret canon</Badge> : doc.tier === "draft" ? <Badge>draft</Badge> : <Badge tone="accent">public canon</Badge>}{" "}
        Synced {ago(doc.synced_at, nowMs())}{doc.git_sha ? ` from ${doc.git_sha.slice(0, 7)}` : ""} · {open.length} open · {live.length - open.length} decided, not yet applied
      </PageHeader>

      <div className="grid gap-6 2xl:grid-cols-[1fr_28rem]">
        <Panel title="Document" className="min-w-0">
          <Markdown md={doc.content} />
        </Panel>

        <div className="min-w-0 space-y-3 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-3rem)] 2xl:self-start 2xl:overflow-y-auto">
          {approvable > 0 && (
            <form action={approveDocument} className="flex flex-wrap items-center gap-2 border border-rule p-3 text-sm">
              <input type="hidden" name="doc_path" value={doc.path} />
              <label className="flex items-center gap-2"><input type="checkbox" name="confirm" value="yes" required /> Approve all {approvable} open item{approvable > 1 ? "s" : ""} here</label>
              <button className="ml-auto border border-ok px-2.5 py-1 text-xs text-ok hover:bg-ok hover:text-paper">Approve all</button>
            </form>
          )}
          {!live.length ? <Empty>No proposals in this document.</Empty> : live.map((p) => <ProposalCard key={p.id} p={p} showDoc={false} />)}
        </div>
      </div>
    </>
  );
}
