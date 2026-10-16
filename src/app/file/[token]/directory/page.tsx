import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { gameMailbox } from "@/lib/email/resend";
import { characterForToken } from "@/lib/game/case-file";
import { particulars } from "@/lib/game/personnel";
import { PublicShell } from "../../../_public-shell";
import { FileNav } from "../file-nav";
import { DirectoryList, type Entry } from "./directory-list";

/* The Personnel Directory: everyone on the org chart new hires receive, staff
   and cohort alike, with how to write to them. Staff descriptions are the
   "Public Profile" lines of the public directory (canon/02), as synced into
   canon_docs; nothing secret is read here. Player characters show name, title
   and department only: their biographies are company records, not posted. */

export const metadata: Metadata = { title: "Personnel Directory · The Department", robots: { index: false, follow: false } };

export default function DirectoryPage({ params }: PageProps<"/file/[token]/directory">) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-sm">Opening the directory…</main>}>
      <Content params={params} />
    </Suspense>
  );
}

/* "**Name**" followed by bullets; returns the Public Profile bullet. */
function publicProfiles(md: string): Map<string, string> {
  const out = new Map<string, string>();
  let name: string | null = null;
  for (const line of md.split("\n")) {
    const head = line.trim().match(/^\*\*([^*]+)\*\*(?:\s+\*\(.*\)\*)?\s*$/); // a trailing *(note)* is allowed
    if (head) { name = head[1].trim(); continue; }
    const prof = line.match(/^\s*\*\s+\*\*Public Profile:\*\*\s*(.+)$/);
    if (name && prof) out.set(name, prof[1].trim());
  }
  return out;
}

async function Content({ params }: { params: PageProps<"/file/[token]/directory">["params"] }) {
  await connection();
  const { token } = await params;
  if (!supabaseConfigured()) notFound();
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) notFound();
  const [{ data: self }, { data: campaign }, { data: divisions }, { data: staff }, { data: canon }] = await Promise.all([
    db.from("characters").select("id, campaign_id, division_id, supervisor_id, created_at").eq("id", me.id).single(),
    db.from("campaigns").select("title").eq("id", me.campaignId).maybeSingle(),
    db.from("divisions").select("id, name, slug").eq("campaign_id", me.campaignId),
    db.from("characters").select("id, name, title, division_id, player_id, public_profile, npc_state").eq("campaign_id", me.campaignId).eq("status", "active").not("division_id", "is", null).order("name"),
    db.from("canon_docs").select("content").eq("path", "canon/02-personnel-directory.md").maybeSingle(),
  ]);
  const p = self ? await particulars(db, self) : null;
  // DSRD is not on the org chart new hires receive; its people appear under the Executive Office.
  const div = new Map((divisions ?? []).map((d) => [d.id as string, d.slug === "dsrd" ? "Executive Office" : (d.name as string)]));
  const profiles = publicProfiles((canon?.content as string) ?? "");
  // People the living world wrote (grow.ts) are listed once someone in the cohort has met them.
  const entries: Entry[] = (staff ?? []).filter((s) => (s.npc_state as { listed?: boolean } | null)?.listed !== false).map((s) => ({
    id: s.id as string, name: s.name as string, title: (s.title as string | null) ?? null, department: div.get(s.division_id as string) ?? "Other",
    profile: s.player_id ? null : profiles.get(s.name as string) ?? (s.public_profile as string | null) ?? null,
    newHire: Boolean(s.player_id), you: s.id === me.id, supervisor: p?.supervisor?.name === s.name,
  }));

  return (
    <PublicShell nav={<FileNav token={token} active="directory" />} kicker={`Personnel & Administration · ${campaign?.title ?? "Royce Industries"}`} title="Personnel Directory">
      <p className="text-sm leading-relaxed text-ink-2">
        To answer a letter, reply to it. To write to anyone here, send a new message to <code>{gameMailbox().address}</code> with <code>TO: their name</code> as the first line. Always write from the address your letters arrive at.
      </p>
      <DirectoryList entries={entries} />
      <p className="mt-10 text-xs text-ink-2">Issued to new employees by Personnel &amp; Administration. Departments not shown here do not take correspondence from new hires.</p>
    </PublicShell>
  );
}
