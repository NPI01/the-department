import Link from "next/link";
import type { ReactNode } from "react";

/* Console building blocks. Server components; the paper/ink palette from globals.css. */

export function PageHeader({ kicker, title, children }: { kicker?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6 border-b border-rule pb-4">
      {kicker && <p className="text-[11px] uppercase tracking-[0.25em] text-ink-2">{kicker}</p>}
      <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
      {children && <div className="mt-2 text-sm text-ink-2">{children}</div>}
    </header>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 border border-rule bg-paper-2/40 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2">
          {title && <h2 className="text-[11px] uppercase tracking-[0.2em] text-ink-2">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return (
    <div className="border border-rule px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ink-2">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone ? TONE_TEXT[tone] : ""}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-2">{hint}</p>}
    </div>
  );
}

export type Tone = "ok" | "warn" | "bad" | "muted" | "accent";
const TONE_TEXT: Record<Tone, string> = { ok: "text-ok", warn: "text-warn", bad: "text-stamp", muted: "text-ink-2", accent: "text-accent" };
const TONE_BADGE: Record<Tone, string> = {
  ok: "border-ok text-ok",
  warn: "border-warn text-warn",
  bad: "border-stamp text-stamp",
  muted: "border-rule text-ink-2",
  accent: "border-accent text-accent",
};

export function Badge({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap border px-1.5 py-px text-[11px] uppercase tracking-wider ${TONE_BADGE[tone]}`}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm italic text-ink-2">{children}</p>;
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule text-left text-[11px] uppercase tracking-wider text-ink-2">
            {head.map((h, i) => <th key={i} className="py-1.5 pr-4 font-normal">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&_td]:py-1.5 [&_td]:pr-4 [&_td]:align-top [&_tr]:border-b [&_tr]:border-rule/50">{children}</tbody>
      </table>
    </div>
  );
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(7rem,max-content)_1fr] gap-x-4 gap-y-1 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-2">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} prefetch={true} className="underline decoration-rule underline-offset-2 hover:decoration-ink">{children}</Link>;
}

export function Loading({ label = "Pulling the file…" }: { label?: string }) {
  return <p className="animate-pulse text-sm text-ink-2">{label}</p>;
}

export const statusTone = (s: string | null | undefined): Tone =>
  ({
    active: "ok", open: "ok", passed: "ok", done: "ok", resolved: "muted", complete: "muted",
    trialing: "accent", comp: "accent", recruiting: "accent", locked: "warn", resolving: "warn",
    past_due: "warn", pending: "warn", proposed: "warn", intermission: "warn", planned: "muted", scheduled: "muted", draft: "muted",
    missing: "warn", failed: "bad", canceled: "bad", dead: "bad", dismissed: "bad", breached: "bad", incomplete: "bad",
  } as Record<string, Tone>)[s ?? ""] ?? "muted";
