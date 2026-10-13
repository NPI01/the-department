import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { FileNav } from "../file-nav";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { characterForToken, loadCaseFile } from "@/lib/game/case-file";
import { CaseFileView } from "./case-file";

/* The player's Case File: everything their character holds, and their private
   notes. Reached from the personnel file; same private token, no login. */

export const metadata: Metadata = { title: "Case File · The Department", robots: { index: false, follow: false } };

export default function CasePage({ params }: PageProps<"/file/[token]/case">) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl flex-1 px-4 py-16 text-sm">Unlocking the cabinet…</main>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/file/[token]/case">["params"] }) {
  await connection();
  const { token } = await params;
  if (!supabaseConfigured()) notFound();
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) notFound();
  const file = await loadCaseFile(db, me);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
<FileNav token={token} active="case" />
      <p className="text-xs uppercase tracking-[0.3em] text-red">{file.campaignTitle} · {me.name}</p>
      <CaseFileView token={token} file={file} />
      <p className="mt-16 border-t border-rule pt-4 text-xs text-ink-2">Your notes are yours alone. Nobody in the game reads them, and nothing in them is acted on. Anyone with this page&apos;s link can see it, so keep the link private.</p>
    </main>
  );
}
