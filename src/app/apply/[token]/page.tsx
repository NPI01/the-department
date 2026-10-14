import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { campaignForPlayer, recruitingCampaign } from "@/lib/game/cohorts";
import { connection } from "next/server";
import Link from "next/link";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { hasSubscription } from "@/lib/stripe";
import { DEPARTMENTS, IDENTITIES, KNOWLEDGE, SKILLS, SPECIALIZATIONS } from "@/lib/game/creation";
import { fmtDateTime } from "@/lib/admin/format";
import { PublicShell } from "../../_public-shell";
import { ApplicationForm } from "./form";

export const metadata: Metadata = { title: "Employment Application · Royce Industries", robots: { index: false, follow: false } };

export default function ApplyPage({ params }: PageProps<"/apply/[token]">) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-sm">Pulling your file…</main>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/apply/[token]">["params"] }) {
  await connection();
  const { token } = await params;
  if (!supabaseConfigured() || !/^[a-f0-9]{32}$/.test(token)) notFound();
  const db = supabaseAdmin();
  const { data: player } = await db.from("players").select("id, email, timezone").eq("file_token", token).maybeSingle();
  if (!player) notFound();
  const campaign = (await campaignForPlayer(db, player.id)) ?? (await recruitingCampaign(db))?.id ?? "";
  const [subscribed, { data: app }, { data: divisions }] = await Promise.all([
    hasSubscription(db, player.id),
    db.from("applications").select("*").eq("player_id", player.id).eq("campaign_id", campaign).maybeSingle(),
    db.from("divisions").select("slug, name").eq("campaign_id", campaign).in("slug", Object.keys(DEPARTMENTS)).order("name"),
  ]);

  if (!subscribed) {
    return (
      <PublicShell kicker="Royce Industries · Personnel & Administration" title="Employment Application">
        <p className="type text-[16px]">This application needs an active subscription. <Link href="/subscribe" className="text-red underline">Subscribe</Link>, and you will be brought back here.</p>
      </PublicShell>
    );
  }

  if (app) {
    const idn = IDENTITIES.find((i) => i.key === app.identity);
    const names = (keys: string[], list: { key: string; name: string }[]) => keys.map((k) => list.find((x) => x.key === k)?.name ?? k).join(", ") || "—";
    return (
      <PublicShell kicker="Royce Industries · Personnel & Administration" title={app.status === "approved" ? "Application approved" : app.status === "rejected" ? "Application declined" : "Application filed"}>
        <div className="type space-y-4 text-[16px] leading-relaxed">
          {app.status === "submitted" && <p>Your application was filed {fmtDateTime(app.submitted_at, player.timezone)}. Personnel reviews applications within 24 hours. You will receive a message at {player.email} accepting or declining it.</p>}
          {app.status === "approved" && <p>Your employment file was mailed to {player.email} {fmtDateTime(app.decided_at, player.timezone)}. It includes your department, your supervisor and the link to your personnel file.</p>}
          {app.status === "rejected" && <p>Personnel declined this application{app.decision_note ? `: ${app.decision_note}` : "."} Write to thedepartment@weird.delivery if you believe this is an error.</p>}
        </div>
        <dl className="mt-8 grid gap-x-6 gap-y-2 border-t-2 border-ink pt-4 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-xs uppercase tracking-[0.2em] text-ink-2">Name</dt><dd>{app.name}</dd>
          <dt className="text-xs uppercase tracking-[0.2em] text-ink-2">Identity</dt><dd>{idn?.name ?? app.identity} · {SPECIALIZATIONS.find((s) => s.key === app.specialization)?.name}</dd>
          <dt className="text-xs uppercase tracking-[0.2em] text-ink-2">Departments</dt><dd>{(app.dept_prefs as string[]).map((d, i) => `${i + 1}. ${(divisions ?? []).find((x) => x.slug === d)?.name ?? d}`).join(" · ")}</dd>
          <dt className="text-xs uppercase tracking-[0.2em] text-ink-2">Skills</dt><dd>{names(app.skills, SKILLS)}</dd>
          <dt className="text-xs uppercase tracking-[0.2em] text-ink-2">Knowledge</dt><dd>{names(app.knowledge, KNOWLEDGE)}</dd>
          <dt className="text-xs uppercase tracking-[0.2em] text-ink-2">Points</dt><dd>{app.points_spent} of {app.points_total}</dd>
        </dl>
      </PublicShell>
    );
  }

  return (
    <PublicShell kicker="Royce Industries · Personnel & Administration" title="Employment Application" banner="Form RI-2. Complete every section. Personnel reviews applications within 24 hours.">
      <ApplicationForm token={token} departments={(divisions ?? []) as { slug: string; name: string }[]} email={player.email} />
    </PublicShell>
  );
}
