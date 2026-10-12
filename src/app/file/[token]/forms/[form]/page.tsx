import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { characterForToken } from "@/lib/game/case-file";
import { FORMS } from "@/lib/engine/forms";
import { submitForm } from "./actions";

/* A company form, hosted. Reached from the letter that required it (the
   button) or from the personnel file. Same private token, no login. Submitting
   files the form exactly as an email reply would. */

export const metadata: Metadata = { title: "Company form · The Department", robots: { index: false, follow: false } };

type Params = Promise<{ token: string; form: string }>;
type Search = Promise<{ filed?: string; missing?: string }>;

export default function FormPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-sm">Finding the form…</main>}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: { params: Params; searchParams: Search }) {
  await connection();
  const { token, form } = await params;
  const { filed, missing } = await searchParams;
  const def = FORMS[form.toUpperCase()];
  if (!def || !supabaseConfigured()) notFound();
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) notFound();
  const { data: prior } = await db.from("events").select("payload, created_at").eq("campaign_id", me.campaignId).eq("kind", "form.filed").contains("payload", { character: me.id, form: def.id }).order("created_at");
  const filings = (prior ?? []).map((e) => e.payload as { index: string; missing: number[]; case_slug: string });
  const missingSet = new Set((missing ?? "").split(",").filter(Boolean).map(Number));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-3 text-xs uppercase tracking-[0.25em]">
        <Link href={`/file/${token}`} className="hover:text-red">← Your personnel file</Link>
        <Link href={`/file/${token}/case`} className="hover:text-red">Case File</Link>
      </nav>

      {filed && (
        <div className="mb-8 border-2 border-red bg-paper-2 p-4 text-sm">
          <p className="display text-2xl text-red">Filed as {filed}</p>
          <p className="mt-1">Form {def.id} is with {def.owner}. A receipt is on its way to your mail, and your copy is in your <Link href={`/file/${token}/case`} className="underline">Case File</Link>. The office has been told; expect to hear from them.</p>
        </div>
      )}
      {missingSet.size > 0 && (
        <div className="mb-8 border-2 border-red bg-paper-2 p-4 text-sm text-red">
          <p className="display text-2xl">Returned for completion</p>
          <p className="mt-1">Answer every question. Where there is nothing to report, write NONE. Unanswered: {[...missingSet].join(", ")}.</p>
        </div>
      )}

      <article className="border-2 border-ink bg-paper-2 shadow-[6px_6px_0_0_var(--ink)]">
        <div className="h-1.5 bg-red" />
        <header className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6 sm:px-10">
          <div>
            <p className="display text-3xl uppercase tracking-[0.2em]">Royce Industries</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-ink-2">{def.owner} · Station R · North Dakota</p>
          </div>
          <span className="inline-block -rotate-3 border-2 border-red px-2 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-red">Form {def.id} · {def.revision}</span>
        </header>
        <div className="mx-6 mt-4 border-t border-ink sm:mx-10" />
        <h1 className="display px-6 pt-5 text-3xl uppercase sm:px-10 sm:text-4xl">{def.title}</h1>
        <div className="mx-6 mt-5 border border-ink bg-paper p-4 text-[13px] leading-relaxed sm:mx-10">
          {def.instructions.map((l, i) => <p key={i} className={i ? "mt-2" : ""}>{l}</p>)}
        </div>

        <form action={submitForm} className="px-6 py-6 sm:px-10">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="form" value={def.id} />
          <ol className="space-y-6">
            {def.questions.map((q) => {
              const last = q.n === def.questions.length;
              return (
                <li key={q.n} className={missingSet.has(q.n) ? "border-l-4 border-red pl-3" : ""}>
                  <label htmlFor={`q${q.n}`} className="block text-[13px] leading-relaxed">
                    <span className="font-mono text-xs text-ink-2">{String(q.n).padStart(2, "0")}.</span> {q.text}
                  </label>
                  {last
                    ? <input id={`q${q.n}`} name={`q${q.n}`} required maxLength={120} placeholder="Type your full name" className="type mt-2 w-full border-b-2 border-ink bg-transparent px-1 py-2 text-lg outline-none focus:border-red" />
                    : <textarea id={`q${q.n}`} name={`q${q.n}`} required={q.required} rows={q.n === 6 ? 6 : 2} maxLength={4000} className="type mt-2 w-full resize-y border border-ink bg-paper px-3 py-2 text-[15px] leading-relaxed outline-none focus:border-red" />}
                </li>
              );
            })}
          </ol>
          <div className="mt-8 border border-dashed border-ink-2 p-4 text-[12px] text-ink-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em]">For {def.owner} use only</p>
            {def.officeUse.map((l, i) => <p key={i} className="mt-1 font-mono">{l}</p>)}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-ink-2">Filing costs nothing and is not an order. What you write here is on the record under your name.</p>
            <button type="submit" className="bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.25em] text-paper hover:bg-red">File Form {def.id}</button>
          </div>
        </form>
      </article>

      {filings.length > 0 && (
        <section className="mt-12">
          <h2 className="display text-2xl">Your filings of Form {def.id}</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {filings.map((f) => <li key={f.index}>■ {f.index}{f.missing?.length ? <span className="text-red"> · incomplete ({f.missing.join(", ")})</span> : ""} · <Link href={`/file/${token}/case`} className="underline">in your Case File</Link></li>)}
          </ul>
          <p className="mt-2 text-xs text-ink-2">Filing again adds a new copy; it does not replace an earlier one.</p>
        </section>
      )}
      <p className="mt-10 text-xs text-ink-2">This page is private to you. Anyone with the link can read it, so don&apos;t share the link.</p>
    </main>
  );
}
