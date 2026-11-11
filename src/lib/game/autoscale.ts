/* Cohorts that open themselves.

   ensureSeats() opens a new cohort (a copy of the template campaign) when there is demand and
   room: fewer than `min_free_seats` seats are free across open cohorts while they are filling
   (or someone is on the waitlist), and a full new cohort would keep live players within
   `player_cap`. A five-minute lease in cohort_policy stops two callers opening two cohorts.

   holdPlace() puts an entitled player on the waitlist when nothing is open; notifyWaitlist()
   writes to waiting players, oldest first, once seats exist, but only while notify_waitlist is
   on (the "intake_open" letter is a draft until Nathan approves it).

   Called from the application page and action (on demand) and the morning dispatch (backstop). */
import type { SupabaseClient } from "@supabase/supabase-js";
import { cloneCampaign, livePlayers, openCohorts, type Cohort } from "@/lib/game/cohorts";
import { letterLinks } from "@/lib/email/letter";
import { renderTemplate } from "@/lib/email/template-store";
import { sendMail } from "@/lib/email/resend";

export type Policy = {
  enabled: boolean; template_campaign_id: string | null; cohort_size: number; player_cap: number; min_free_seats: number;
  title_prefix: string; slug_prefix: string; start_weekday: number; start_hour_utc: number; min_lead_days: number;
  notify_waitlist: boolean;
};

export async function loadPolicy(db: SupabaseClient): Promise<Policy> {
  const { data } = await db.from("cohort_policy").select("*").eq("id", 1).single();
  return data as Policy;
}

/* The next start slot: the policy weekday at the policy hour (UTC), at least min_lead_days away. */
export function nextStart(p: Pick<Policy, "start_weekday" | "start_hour_utc" | "min_lead_days">, now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), p.start_hour_utc));
  while (d.getUTCDay() !== p.start_weekday || d.getTime() - now.getTime() < p.min_lead_days * 86400_000) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

/* Working titles run A, B, … Z, then AA, AB, … : the first suffix not yet used under the prefix. */
async function nextSuffix(db: SupabaseClient, slugPrefix: string): Promise<string> {
  const { data } = await db.from("campaigns").select("slug").like("slug", `${slugPrefix}-%`);
  const used = new Set((data ?? []).map((r) => String(r.slug).slice(slugPrefix.length + 1)));
  const label = (n: number) => { let s = ""; for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
  for (let i = 0; ; i++) if (!used.has(label(i).toLowerCase())) return label(i);
}

export type EnsureResult =
  | { action: "none"; reason: string; free: number; live: number }
  | { action: "opened"; cohort: { id: string; slug: string; title: string; start: string }; free: number; live: number };

export async function ensureSeats(db: SupabaseClient, now = new Date(), opts: { dryRun?: boolean } = {}): Promise<EnsureResult> {
  const p = await loadPolicy(db);
  const open = await openCohorts(db);
  const free = open.reduce((n, c) => n + (c.cohort_size - c.seats_taken), 0);
  const live = await livePlayers(db);
  if (!p.enabled) return { action: "none", reason: "autoscale is off", free, live };
  if (!p.template_campaign_id) return { action: "none", reason: "no template campaign set", free, live };
  if (free >= p.min_free_seats) return { action: "none", reason: "enough free seats", free, live };
  const { count: waiting } = await db.from("cohort_waitlist").select("player_id", { count: "exact", head: true }).is("notified_at", null);
  // Demand: cohorts are filling (some seats left) or someone is waiting. An idle, full system stays put.
  if (free === 0 && !waiting) return { action: "none", reason: "no demand", free, live };
  if (live + p.cohort_size > p.player_cap) return { action: "none", reason: `player cap ${p.player_cap} reached (${live} live)`, free, live };
  if (opts.dryRun) return { action: "none", reason: "dry run: would open a cohort now", free, live };

  const { data: lease } = await db.rpc("cohort_take_lease");
  if (lease !== true) return { action: "none", reason: "another request is opening a cohort", free, live };
  try {
    const suffix = await nextSuffix(db, p.slug_prefix);
    const slug = `${p.slug_prefix}-${suffix.toLowerCase()}`;
    const title = `${p.title_prefix} ${suffix}`;
    const start = nextStart(p, now).toISOString();
    const id = await cloneCampaign(db, { templateId: p.template_campaign_id, slug, title, cohortSize: p.cohort_size, scheduledStart: start });
    await db.from("events").insert({ campaign_id: id, kind: "cohort.autoscaled", payload: { slug, title, start, free_before: free, live_before: live, waiting: waiting ?? 0 }, idempotency_key: `autoscale:${slug}` });
    return { action: "opened", cohort: { id, slug, title, start }, free, live };
  } finally {
    await db.rpc("cohort_release_lease");
  }
}

/* An entitled player found nothing open: keep their place (idempotent). */
export async function holdPlace(db: SupabaseClient, playerId: string) {
  await db.from("cohort_waitlist").upsert({ player_id: playerId }, { onConflict: "player_id", ignoreDuplicates: true });
}

/* Applying takes a player off the waitlist. */
export async function leaveWaitlist(db: SupabaseClient, playerId: string) {
  await db.from("cohort_waitlist").delete().eq("player_id", playerId);
}

const dayName = (iso: string | null, tz: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz }) : "the next start date";

/* Write to waiting players, oldest first, one per free seat. Off until the letter is approved. */
export async function notifyWaitlist(db: SupabaseClient): Promise<{ sent: number; skipped?: string; errors: string[] }> {
  const p = await loadPolicy(db);
  if (!p.notify_waitlist) return { sent: 0, skipped: "notify_waitlist is off", errors: [] };
  const open: Cohort[] = await openCohorts(db);
  let seats = open.reduce((n, c) => n + (c.cohort_size - c.seats_taken), 0);
  if (!seats) return { sent: 0, errors: [] };
  const { data: waiting } = await db.from("cohort_waitlist").select("player_id, created_at").is("notified_at", null).order("created_at").limit(seats);
  const errors: string[] = [];
  let sent = 0;
  for (const w of (waiting ?? []) as { player_id: string }[]) {
    if (seats <= 0) break;
    const { data: player } = await db.from("players").select("id, email, file_token").eq("id", w.player_id).maybeSingle();
    if (!player?.email || !player.file_token) continue;
    const cohort = open[0];
    const links = letterLinks(player.file_token);
    const applyUrl = `${links.rules.replace(/\/rules$/, "")}/apply/${player.file_token}`;
    const { subject, html, text } = await renderTemplate(db, "intake_open", { email: player.email, apply_url: applyUrl, start_date: dayName(cohort.scheduled_start, cohort.timezone) }, links);
    const r = await sendMail({ to: player.email, subject, html, text });
    if (r.error) { errors.push(`${player.id}: ${r.error}`); continue; }
    await db.from("cohort_waitlist").update({ notified_at: new Date().toISOString(), notified_campaign_id: cohort.id }).eq("player_id", player.id);
    sent++;
    seats--;
  }
  return { sent, errors };
}
