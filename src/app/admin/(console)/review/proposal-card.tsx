import Link from "next/link";
import type { Proposal } from "@/lib/admin/review";
import { Markdown } from "@/lib/canon/render";
import { fmtDateTime } from "@/lib/admin/format";
import { Badge, type Tone } from "../ui";
import { DecisionForm } from "./decision-form";

const KIND: Record<string, string> = { document: "whole document", item: "item", question: "question" };
const STATUS_TONE: Record<string, Tone> = { open: "warn", approved: "ok", rejected: "bad", revise: "warn", answered: "accent" };

export const docHref = (path: string, line?: number | null) => `/admin/review/doc?path=${encodeURIComponent(path)}${line ? `#line-${line}` : ""}`;
export const tierOf = (path: string) => (path.startsWith("canon/secret/") ? "secret" : path.startsWith("canon/") ? "public" : "draft");

export function ProposalCard({ p, showDoc = true }: { p: Proposal; showDoc?: boolean }) {
  const tier = tierOf(p.doc_path);
  return (
    <article id={`p-${p.id}`} className="min-w-0 border border-rule p-4">
      <header className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink-2">
        <Badge tone={p.kind === "question" ? "accent" : "muted"}>{KIND[p.kind]}</Badge>
        {tier === "secret" && <Badge tone="bad">secret</Badge>}
        {tier === "draft" && <Badge>draft</Badge>}
        {showDoc && <Link href={docHref(p.doc_path, p.line)} className="underline decoration-rule hover:decoration-ink">{p.doc_path}{p.line ? `:${p.line}` : ""}</Link>}
        {!showDoc && <Link href={`#line-${p.line}`} className="underline decoration-rule">line {p.line}</Link>}
        {p.heading && <span className="truncate">· {p.heading}</span>}
        {p.status !== "open" && <span className="ml-auto"><Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge></span>}
      </header>
      <div className="border-l-2 border-rule pl-3">
        <Markdown md={p.text} compact />
      </div>
      {p.status !== "open" && (
        <div className="mt-3 text-sm">
          {p.note && <p className="whitespace-pre-line"><span className="text-ink-2">{p.status === "answered" ? "Answer: " : "Note: "}</span>{p.note}</p>}
          <p className="mt-1 text-xs text-ink-2">
            Decided {fmtDateTime(p.decided_at)}{p.present ? " · not yet applied to the text" : " · applied (no longer in the text)"}
          </p>
        </div>
      )}
      {p.present && <div className="mt-3"><DecisionForm id={p.id} kind={p.kind} status={p.status} note={p.note} /></div>}
    </article>
  );
}
