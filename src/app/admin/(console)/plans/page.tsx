import { Suspense } from "react";
import { getCanonDoc, getEpisodeDocIndex } from "@/lib/admin/review";
import { ARC_PATH, parseArc } from "@/lib/canon/episodes";
import { inline } from "@/lib/canon/render";
import { A, Badge, Empty, Loading, PageHeader, Panel } from "../ui";

export default function PlansPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const [arcDoc, index] = await Promise.all([getCanonDoc(ARC_PATH), getEpisodeDocIndex()]);
  if (!arcDoc) return <PageHeader kicker="Episode Plans" title="No season arc synced">Run <code>pnpm canon:sync</code>.</PageHeader>;
  const { episodes, acts } = parseArc(arcDoc.content);

  return (
    <>
      <PageHeader kicker="Episode Plans" title={arcDoc.title}>
        Twelve episodes from <A href={`/admin/review/doc?path=${encodeURIComponent(ARC_PATH)}`}>the season arc</A>. Episodes are crisis generators, not scripts; each adapts to the state the last one left.
      </PageHeader>
      {!episodes.length ? <Empty>The arc has no episode table.</Empty> : (acts.length ? acts : [{ name: "Season", from: 1, to: 12, question: "" }]).map((act) => (
        <Panel key={act.name} title={`${act.name}${act.question ? ` · ${act.question}` : ""}`} className="mb-4">
          <div className="space-y-4">
            {episodes.filter((e) => e.n >= act.from && e.n <= act.to).map((e) => {
              const docs = index.get(e.n) ?? [];
              return (
                <article key={e.n} className="grid gap-x-6 gap-y-1 border-b border-rule/60 pb-4 last:border-0 last:pb-0 md:grid-cols-[14rem_1fr]">
                  <div>
                    <p className="text-xs text-ink-2">Episode {String(e.n).padStart(2, "0")} · {e.stage}</p>
                    <p className="font-semibold">{docs.length ? <A href={`/admin/plans/${e.n}`}>{e.title}</A> : e.title}</p>
                    <p className="mt-1">{docs.length ? <Badge tone="ok">{docs.length} plan docs</Badge> : <Badge>arc only</Badge>}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>{inline(e.crisis)}</p>
                    <p className="text-ink-2"><span className="text-xs uppercase tracking-wider">Decision</span> · {inline(e.decision)}</p>
                    <p className="text-xs text-ink-2">Tagus: {inline(e.tagus)} · Carries forward: {inline(e.carries)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>
      ))}
    </>
  );
}
