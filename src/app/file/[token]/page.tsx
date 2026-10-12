import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { gameMailbox } from "@/lib/email/resend";
import { PublicShell } from "../../_public-shell";

/* A player's personnel file, reached by the private link in every letter the
   game sends them. No login: the token is the key, so the page shows nothing a
   forwarded link could abuse (no sealed addresses; those travel only in mail). */

export const metadata: Metadata = { title: "Personnel File · The Department", robots: { index: false, follow: false } };

export default function FilePage({ params }: PageProps<"/file/[token]">) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-sm">Pulling your file…</main>}>
      <File params={params} />
    </Suspense>
  );
}

type Char = { id: string; campaign_id: string; slug: string; name: string; title: string | null; division_id: string | null; clearance: number; specialization: string | null; status: string; public_profile: string | null };

async function File({ params }: { params: PageProps<"/file/[token]">["params"] }) {
  await connection();
  const { token } = await params;
  if (!supabaseConfigured() || !/^[a-f0-9]{32}$/.test(token)) notFound();
  const db = supabaseAdmin();
  const { data: player } = await db.from("players").select("id, display_name, created_at").eq("file_token", token).maybeSingle();
  if (!player) notFound();

  const { data: chars } = await db.from("characters").select("id, campaign_id, slug, name, title, division_id, clearance, specialization, status, public_profile").eq("player_id", player.id).order("created_at", { ascending: false }).limit(1);
  const me = ((chars ?? []) as Char[])[0];

  if (!me) {
    return (
      <PublicShell kicker="Personnel & Administration" title="Your file">
        <p className="type text-[15px] leading-relaxed">Your application is on file. Employees are hired in cohorts; your personnel file is completed when yours convenes, and the first letter you receive will say so.</p>
      </PublicShell>
    );
  }

  const [{ data: campaign }, { data: divisions }, { data: resources }, { data: assets }, { data: memberships }, { data: staff }] = await Promise.all([
    db.from("campaigns").select("title").eq("id", me.campaign_id).maybeSingle(),
    db.from("divisions").select("id, name, slug").eq("campaign_id", me.campaign_id),
    db.from("resources").select("kind, balance, cap").eq("character_id", me.id),
    db.from("assets").select("name, kind, tier").eq("holder_id", me.id).order("created_at"),
    db.from("memberships").select("role, organizations(name)").eq("character_id", me.id),
    db.from("characters").select("id, slug, name, title, division_id").eq("campaign_id", me.campaign_id).eq("status", "active").not("division_id", "is", null).order("name"),
  ]);
  // DSRD is not on the org chart new hires receive; its people appear under the Executive Office.
  const div = new Map(((divisions ?? []) as { id: string; name: string; slug: string }[]).map((d) => [d.id, d.slug === "dsrd" ? "Executive Office" : d.name]));
  const au = ((resources ?? []) as { kind: string; balance: number; cap: number | null }[]).find((r) => r.kind === "au");
  const directory = ((staff ?? []) as { id: string; slug: string; name: string; title: string | null; division_id: string }[]);
  const byDept = [...new Set(directory.map((s) => div.get(s.division_id) ?? "Other"))].sort();
  const mailbox = gameMailbox().address;

  const row = (k: string, v: React.ReactNode) => (
    <div className="grid grid-cols-[9.5rem_1fr] gap-x-4 border-b border-rule py-1.5 text-sm">
      <span className="text-xs uppercase tracking-[0.2em] text-ink-2">{k}</span><span>{v}</span>
    </div>
  );

  return (
    <PublicShell kicker={`Personnel & Administration · ${campaign?.title ?? "Royce Industries"}`} title={me.name}>
      <section>
        {row("Title", me.title ?? "—")}
        {row("Department", me.division_id ? div.get(me.division_id) ?? "—" : "—")}
        {row("Clearance", `Level ${me.clearance}`)}
        {row("Specialization", me.specialization ? <span><span className="capitalize">{me.specialization}</span> <Link href="/rules" className="text-xs text-red underline">what this means</Link></span> : "—")}
        {row("Status", <span className="capitalize">{me.status === "active" ? "active" : "on leave"}</span>)}
        {row("Mail", <span>All correspondence goes through <code>{mailbox}</code></span>)}
        {row("Action Units", au ? `${au.balance}${au.cap ? ` of ${au.cap}` : ""}` : "issued when your cohort convenes")}
        {row("Committees", ((memberships ?? []) as unknown as { role: string | null; organizations: { name: string } | null }[]).map((m) => `${m.organizations?.name}${m.role ? ` (${m.role})` : ""}`).join("; ") || "—")}
      </section>

      {me.public_profile && <p className="type mt-6 text-[15px] leading-relaxed">{me.public_profile}</p>}

      <Link href={`/file/${token}/case`} className="mt-10 flex items-center justify-between gap-4 border-2 border-ink bg-paper-2 px-5 py-4 hover:border-red hover:text-red">
        <span><span className="display block text-3xl">Case File</span><span className="mt-1 block text-sm text-ink-2">Every letter, document, photograph and map you hold, and your private notes on them.</span></span>
        <span aria-hidden className="text-2xl">→</span>
      </Link>

      <h2 className="display mt-12 text-2xl">Holdings</h2>
      {(assets ?? []).length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {((assets ?? []) as { name: string; kind: string; tier: string | null }[]).map((a, i) => <li key={i}>■ {a.name} <span className="text-xs text-ink-2">{a.kind}{a.tier ? ` · ${a.tier}` : ""}</span></li>)}
        </ul>
      ) : <p className="mt-3 text-sm text-ink-2">Nothing on file yet.</p>}

      <h2 className="display mt-12 text-2xl">Staff directory</h2>
      <p className="mt-2 text-sm text-ink-2">To answer a letter, reply to it. To write to anyone here, send a new message to <code>{mailbox}</code> with <code>TO: their name</code> as the first line. Always write from the address your letters arrive at.</p>
      <div className="mt-4 space-y-6">
        {byDept.map((d) => (
          <div key={d}>
            <p className="text-xs uppercase tracking-[0.25em] text-red">{d}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {directory.filter((s) => (div.get(s.division_id) ?? "Other") === d).map((s) => (
                <li key={s.id} className="grid gap-x-4 sm:grid-cols-[1fr_1fr]">
                  <span>{s.name}{s.id === me.id && <span className="text-xs text-red"> (you)</span>}<span className="text-ink-2">{s.title ? `, ${s.title}` : ""}</span></span>
                  <code className="text-xs text-ink-2">TO: {s.name}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-10 text-xs text-ink-2">This page is private to you. Anyone with the link can read it, so don&apos;t share the link.</p>
    </PublicShell>
  );
}
