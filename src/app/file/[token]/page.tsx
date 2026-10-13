import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { gameMailbox } from "@/lib/email/resend";
import { PublicShell } from "../../_public-shell";
import { FileNav } from "./file-nav";
import { BIO_FIELDS, bioFrom, particulars } from "@/lib/game/personnel";
import { OfficeCalendar } from "./calendar";
import { goalsFor, scoreOf, standings } from "@/lib/game/goals";
import { saveBio } from "./actions";

/* A player's personnel file, reached by the private link in every letter the
   game sends them. No login: the token is the key, so the page shows nothing a
   forwarded link could abuse (no sealed addresses; those travel only in mail). */

export const metadata: Metadata = { title: "Personnel File · The Department", robots: { index: false, follow: false } };

export default function FilePage({ params, searchParams }: PageProps<"/file/[token]">) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-sm">Pulling your file…</main>}>
      <File params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

type Char = { id: string; campaign_id: string; slug: string; name: string; title: string | null; division_id: string | null; clearance: number; specialization: string | null; status: string; public_profile: string | null; sheet: { bio?: string | null; profile?: Record<string, string> } | null; supervisor_id: string | null; created_at: string; goal_key: string | null };

async function File({ params, searchParams }: { params: PageProps<"/file/[token]">["params"]; searchParams: PageProps<"/file/[token]">["searchParams"] }) {
  await connection();
  const { token } = await params;
  const { bio: bioSaved } = await searchParams;
  if (!supabaseConfigured() || !/^[a-f0-9]{32}$/.test(token)) notFound();
  const db = supabaseAdmin();
  const { data: player } = await db.from("players").select("id, display_name, created_at").eq("file_token", token).maybeSingle();
  if (!player) notFound();

  const { data: chars } = await db.from("characters").select("id, campaign_id, slug, name, title, division_id, clearance, specialization, status, public_profile, sheet, supervisor_id, created_at, goal_key").eq("player_id", player.id).order("created_at", { ascending: false }).limit(1);
  const me = ((chars ?? []) as Char[])[0];

  if (!me) {
    return (
      <PublicShell kicker="Personnel & Administration" title="Your file">
        <p className="type text-[15px] leading-relaxed">Your application is on file. Employees are hired in cohorts; your personnel file is completed when yours convenes, and the first letter you receive will say so.</p>
      </PublicShell>
    );
  }

  const [p, { data: campaign }, { data: divisions }, { data: resources }, { data: assets }, { data: memberships }] = await Promise.all([
    particulars(db, me),
    db.from("campaigns").select("title").eq("id", me.campaign_id).maybeSingle(),
    db.from("divisions").select("id, name, slug").eq("campaign_id", me.campaign_id),
    db.from("resources").select("kind, balance, cap").eq("character_id", me.id),
    db.from("assets").select("name, kind, tier").eq("holder_id", me.id).order("created_at"),
    db.from("memberships").select("role, organizations(name)").eq("character_id", me.id),
  ]);
  const bio = bioFrom(me.sheet, me.public_profile);
  const [goals, table] = await Promise.all([goalsFor(db, me.id), standings(db, me.campaign_id)]);
  const score = scoreOf(goals);
  const rank = table.find((r) => r.characterId === me.id)?.rank ?? null;
  // DSRD is not on the org chart new hires receive; its people appear under the Executive Office.
  const div = new Map(((divisions ?? []) as { id: string; name: string; slug: string }[]).map((d) => [d.id, d.slug === "dsrd" ? "Executive Office" : d.name]));
  const au = ((resources ?? []) as { kind: string; balance: number; cap: number | null }[]).find((r) => r.kind === "au");
  const mailbox = gameMailbox().address;

  const row = (k: string, v: React.ReactNode) => (
    <div className="grid grid-cols-[9.5rem_1fr] gap-x-4 border-b border-rule py-1.5 text-sm">
      <span className="text-xs uppercase tracking-[0.2em] text-ink-2">{k}</span><span>{v}</span>
    </div>
  );

  return (
    <PublicShell nav={<FileNav token={token} active="file" />} kicker={`Personnel & Administration · ${campaign?.title ?? "Royce Industries"}`} title={me.name}>
      <section>
        {row("Badge No.", <span className="font-mono">{p.badge}</span>)}
        {row("Title", me.title ?? "—")}
        {row("Department", me.division_id ? div.get(me.division_id) ?? "—" : "—")}
        {row("Supervisor", p.supervisor ? <span>{p.supervisor.name}<span className="text-ink-2">{p.supervisor.title ? `, ${p.supervisor.title}` : ""}</span></span> : "—")}
        {row("Clearance", `Level ${me.clearance}`)}
        {row("Specialization", me.specialization ? <span><span className="capitalize">{me.specialization}</span> <Link href="/rules" className="text-xs text-red underline">what this means</Link></span> : "—")}
        {row("Status", <span className="capitalize">{me.status === "active" ? "active" : "on leave"}</span>)}
        {row("Mail", <span>All correspondence goes through <code>{mailbox}</code></span>)}
        {row("Action Units", au ? `${au.balance}${au.cap ? ` of ${au.cap}` : ""}` : "issued when your cohort convenes")}
        {row("Committees", ((memberships ?? []) as unknown as { role: string | null; organizations: { name: string } | null }[]).map((m) => `${m.organizations?.name}${m.role ? ` (${m.role})` : ""}`).join("; ") || "—")}
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="display text-2xl">Personal Goals</h2>
          <Link href={`/file/${token}/standings`} className="text-sm hover:text-red">
            <span className="display text-3xl text-red">{score}</span> <span className="text-xs uppercase tracking-[0.2em]">points{rank ? ` · ${ordinal(rank)} of ${table.length}` : ""} · standings →</span>
          </Link>
        </div>
        <p className="mt-2 text-sm text-ink-2">Meet a goal and its points are yours; the season standings are the sum. You start with one goal and may be given more as the season goes on. What counts as done is for you to work out: the company does not say what proof it will accept.</p>
        {goals.length ? (
          <div className="mt-4 space-y-4">
            {goals.map((g) => (
              <article key={g.id} className={`border-2 bg-paper-2 p-5 ${g.status === "open" ? "border-red shadow-[6px_6px_0_0_var(--ink)]" : "border-ink"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red">Confidential · worth {g.points} points</p>
                  <span className={`inline-block -rotate-2 border-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] ${g.status === "met" ? "border-ok text-ok" : g.status === "failed" ? "border-ink-2 text-ink-2" : "border-red text-red"}`}>
                    {g.status === "met" ? `Met · +${g.awarded ?? g.points}` : g.status === "failed" ? "Not met" : "Open"}
                  </span>
                </div>
                <p className={`type mt-3 text-xl leading-snug ${g.status === "failed" ? "line-through decoration-red/60" : ""}`}>{g.text}</p>
                <p className="mt-3 text-sm text-ink-2">{g.deadline ? `Due ${g.deadline}. ` : ""}{g.assignedRound === 1 && g === goals[0] ? `Set by ${p.supervisor ? p.supervisor.name : "your supervisor"} in your first memo.` : g.assignedRound ? `Assigned in Round ${g.assignedRound}.` : ""}</p>
                {g.note && <p className="mt-2 border-l-2 border-red pl-3 text-sm">{g.note}</p>}
              </article>
            ))}
          </div>
        ) : <p className="mt-4 text-sm text-ink-2">Your first goal arrives with your supervisor&apos;s first memo.</p>}
      </section>

      <section className="mt-12">
        <OfficeCalendar startRound={p.startRound} currentRound={p.currentRound} roundOpenedAt={p.roundOpenedAt} timezone={p.timezone} />
      </section>

      <Link href={`/file/${token}/case`} className="mt-10 flex items-center justify-between gap-4 border-2 border-ink bg-paper-2 px-5 py-4 hover:border-red hover:text-red">
        <span><span className="display block text-3xl">Case File</span><span className="mt-1 block text-sm text-ink-2">Every letter, document, photograph and map you hold, and your private notes on them.</span></span>
        <span aria-hidden className="text-2xl">→</span>
      </Link>


      <section id="bio" className="mt-12 scroll-mt-8">
        <h2 className="display text-2xl">Biography</h2>
        <p className="mt-2 text-sm text-ink-2">Personnel keeps this on your file, and the staff you write to may have read it. Write it as your character would give it to the company: what you put here is what Royce believes about you. You can amend it at any time.</p>
        {bioSaved && <p className="mt-3 border-2 border-red px-3 py-2 text-sm text-red">Your biography is amended on file.</p>}
        <form action={saveBio} className="mt-5 border-2 border-ink bg-paper-2 p-5 shadow-[6px_6px_0_0_var(--ink)] sm:p-6">
          <input type="hidden" name="token" value={token} />
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-2">Personnel &amp; Administration · Employee biographical record · Form P-3</p>
          <div className="mt-4 space-y-4">
            {BIO_FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="text-xs uppercase tracking-[0.2em]">{f.label}</span>
                {f.rows === 1
                  ? <input name={f.key} defaultValue={bio[f.key] ?? ""} maxLength={400} placeholder={f.hint} className="type mt-1 w-full border-b-2 border-ink bg-transparent px-1 py-1.5 text-[15px] outline-none placeholder:text-ink-2/50 focus:border-red" />
                  : <textarea name={f.key} defaultValue={bio[f.key] ?? ""} rows={f.rows} maxLength={f.key === "notes" ? 1500 : 400} placeholder={f.hint} className="type mt-1 w-full resize-y border border-ink bg-paper px-3 py-2 text-[15px] leading-relaxed outline-none placeholder:text-ink-2/50 focus:border-red" />}
              </label>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" className="bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.25em] text-paper hover:bg-red">File biography</button>
          </div>
        </form>
      </section>

      <h2 className="display mt-12 text-2xl">Holdings</h2>
      {(assets ?? []).length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {((assets ?? []) as { name: string; kind: string; tier: string | null }[]).map((a, i) => <li key={i}>■ {a.name} <span className="text-xs text-ink-2">{a.kind}{a.tier ? ` · ${a.tier}` : ""}</span></li>)}
        </ul>
      ) : <p className="mt-3 text-sm text-ink-2">Nothing on file yet.</p>}

      <Link href={`/file/${token}/directory`} className="mt-12 flex items-center justify-between gap-4 border-2 border-ink bg-paper-2 px-5 py-4 hover:border-red hover:text-red">
        <span><span className="display block text-3xl">Personnel Directory</span><span className="mt-1 block text-sm text-ink-2">Everyone you can write to, by department, and how to reach them.</span></span>
        <span aria-hidden className="text-2xl">→</span>
      </Link>
      <p className="mt-10 text-xs text-ink-2">This page is private to you. Anyone with the link can read it, so don&apos;t share the link.</p>
    </PublicShell>
  );
}
