import type { SupabaseClient } from "@supabase/supabase-js";
import { ALL_GOAL_KEYS, DEPARTMENTS, GOALS, KNOWLEDGE, SKILLS, SPECIALIZATIONS, identity } from "@/lib/game/creation";
import { gameDate, letterLinks } from "@/lib/email/letter";
import { emailDomain, gameMailbox, sendMail } from "@/lib/email/resend";
import { loadTemplate, renderTemplate } from "@/lib/email/template-store";
import { buildLetter } from "@/lib/email/templates";

/* From application to first memo.
     approve_application  two hours after filing: assign a department to balance
                          the cohort, create the character, mail the employment
                          file, schedule the first memo
     first_memo           six hours later (never 10 PM–8 AM local): the supervisor's
                          memo with the Personal Goal, as a correspondence row so
                          the reply threads back to them
   Both are idempotent: re-running after a partial failure continues. */

const MEMO_DELAY_MS = Number(process.env.FIRST_MEMO_DELAY_MINUTES ?? 360) * 60_000;

/* Local hour in an IANA zone, 0–23. */
function localHour(d: Date, tz: string) {
  try { return Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(d)); } catch { return d.getUTCHours(); }
}

/* Push a time out of the quiet hours (22:00–08:00 local) to 08:00 local. */
export function outsideQuietHours(at: Date, tz: string): Date {
  const h = localHour(at, tz);
  if (h >= 8 && h < 22) return at;
  // step forward in 15-minute increments until local time reads 08:00–08:14
  const t = new Date(at);
  for (let i = 0; i < 96; i++) { t.setUTCMinutes(t.getUTCMinutes() + 15); const hh = localHour(t, tz); if (hh === 8) { t.setUTCMinutes(Math.floor(t.getUTCMinutes() / 15) * 15, 0, 0); return t; } }
  return at;
}

/* Slug for a new character: letters of the name, unique within the campaign. */
async function uniqueSlug(db: SupabaseClient, campaignId: string, name: string) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "employee";
  const { data } = await db.from("characters").select("slug").eq("campaign_id", campaignId).like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => r.slug as string));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${Date.now().toString(36)}`;
}

type App = {
  id: string; player_id: string; campaign_id: string; status: string; name: string; bio: string | null; identity: string; specialization: string; dept_prefs: string[];
  trait_favorite: string | null; trait_hated: string | null; unexplained: boolean; unexplained_text: string | null; near_death: boolean; near_death_text: string | null; deja_vu: string | null;
  skills: string[]; knowledge: string[]; points_total: number; points_spent: number; timezone: string | null; character_id: string | null;
};

export async function approveApplication(db: SupabaseClient, applicationId: string) {
  const { data } = await db.from("applications").select("*").eq("id", applicationId).single();
  if (!data) throw new Error("application missing");
  const app = data as App;
  if (app.status !== "submitted" && app.character_id) return; // done
  const { data: player } = await db.from("players").select("id, email, file_token, timezone").eq("id", app.player_id).single();
  if (!player) throw new Error("player missing");
  const cid = app.campaign_id;

  // Department: the applicant's highest preference among those with the fewest player characters.
  const { data: divs } = await db.from("divisions").select("id, slug, name").eq("campaign_id", cid);
  const div = Object.fromEntries((divs ?? []).map((d) => [d.slug as string, d as { id: string; slug: string; name: string }]));
  const { data: pcs } = await db.from("characters").select("division_id, title, goal_key").eq("campaign_id", cid).not("player_id", "is", null);
  const count = (slug: string) => (pcs ?? []).filter((c) => c.division_id === div[slug]?.id).length;
  const prefs = app.dept_prefs.filter((s) => DEPARTMENTS[s] && div[s]);
  const min = Math.min(...prefs.map(count));
  const slug = prefs.find((s) => count(s) === min) ?? prefs[0];
  if (!slug) throw new Error("no usable department preference");
  const dept = DEPARTMENTS[slug];
  const position = dept.positions[count(slug) % dept.positions.length];

  const { data: sup } = await db.from("characters").select("id, name, title").eq("campaign_id", cid).eq("slug", dept.supervisor).maybeSingle();
  if (!sup) throw new Error(`supervisor ${dept.supervisor} not seeded`);

  // Goal: unused in this season, from the department's pool, else least-used from the whole pool.
  const used = new Map<string, number>();
  for (const c of pcs ?? []) if (c.goal_key) used.set(c.goal_key as string, (used.get(c.goal_key as string) ?? 0) + 1);
  const pick = (keys: string[]) => keys.length ? [...keys].sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0))[0] : null;
  const goalKey = (dept.goals.some((k) => !used.has(k)) ? pick(dept.goals) : null) ?? pick(ALL_GOAL_KEYS)!;

  const idn = identity(app.identity)!;
  let characterId = app.character_id;
  if (!characterId) {
    const sheet = {
      identity: app.identity, bio: app.bio, skills: app.skills, knowledge: app.knowledge, points: { total: app.points_total, spent: app.points_spent },
      interview: { trait_favorite: app.trait_favorite, trait_hated: app.trait_hated, unexplained: app.unexplained ? app.unexplained_text : null, near_death: app.near_death ? app.near_death_text : null, deja_vu: app.deja_vu },
    };
    const { data: ch, error } = await db.from("characters").insert({
      campaign_id: cid, player_id: player.id, slug: await uniqueSlug(db, cid, app.name), name: app.name, title: position, division_id: div[slug].id,
      clearance: idn.clearance, specialization: app.specialization, status: "active", public_profile: app.bio, sheet, supervisor_id: sup.id, goal_key: goalKey,
    }).select("id").single();
    if (error) throw new Error(`character: ${error.message}`);
    characterId = ch.id;
    await db.from("resources").upsert({ character_id: characterId, kind: "au", balance: idn.startAu, cap: 60 }, { onConflict: "character_id,kind" });
    if (app.identity === "transfer") await db.from("relationships").upsert({ campaign_id: cid, from_character: sup.id, to_character: characterId, trust: 0.4 }, { onConflict: "from_character,to_character" });
    if (app.identity === "referred") await db.from("relationships").upsert({ campaign_id: cid, from_character: characterId, to_character: sup.id, obligation: 0.5 }, { onConflict: "from_character,to_character" });
    await db.from("applications").update({ status: "approved", decided_at: new Date().toISOString(), character_id: characterId }).eq("id", app.id);
  }

  // The employment file, once.
  const key = `employment_file:${app.id}`;
  const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
  if (!dup) {
    const names = (keys: string[], list: { key: string; name: string }[]) => keys.map((k) => list.find((x) => x.key === k)?.name ?? k).join(", ") || "none";
    const summary = [
      `Identity: ${idn.name}. Specialization: ${SPECIALIZATIONS.find((s) => s.key === app.specialization)?.name ?? app.specialization}.`,
      `Skills: ${names(app.skills, SKILLS)}.`,
      `Knowledge: ${names(app.knowledge, KNOWLEDGE)}.`,
      app.bio ? `\n${app.bio}` : "",
    ].join("\n").trim();
    const { data: rules } = await db.from("rules").select("key, value").eq("campaign_id", cid).in("key", ["au.per_round", "au.cap"]);
    const rule = (k: string, dflt: number) => Number((rules ?? []).find((r) => r.key === k)?.value ?? dflt);
    const links = letterLinks(player.file_token);
    const { subject, html, text } = await renderTemplate(db, "employment_file", {
      name: app.name, position, department: div[slug].name, clearance: idn.clearance, supervisor_name: sup.name, supervisor_title: sup.title ?? "",
      summary, au_start: idn.startAu, au_income: rule("au.per_round", 20), au_cap: rule("au.cap", 60), game_address: gameMailbox().address, game_date: gameDate(1),
    }, links, { to: { name: app.name, title: position } });
    const r = await sendMail({ to: player.email, subject, html, text, replyTo: gameMailbox().reply(await mailToken(db, player.id)) });
    if (r.error) throw new Error(r.error);
    await db.from("events").insert({ campaign_id: cid, kind: "player.approved", payload: { application_id: app.id, character_id: characterId, department: slug, position, goal: goalKey }, idempotency_key: key, visible_to: [characterId] });
  }

  // The first memo, later today.
  const memoKey = `first_memo:${app.id}`;
  const { data: memoDup } = await db.from("jobs").select("id").eq("kind", "first_memo").contains("payload", { application_id: app.id }).maybeSingle();
  if (!memoDup) {
    const at = outsideQuietHours(new Date(Date.now() + MEMO_DELAY_MS), app.timezone ?? player.timezone ?? "America/New_York");
    await db.from("jobs").insert({ kind: "first_memo", payload: { application_id: app.id, key: memoKey }, run_after: at.toISOString() });
  }
}

async function mailToken(db: SupabaseClient, playerId: string) {
  const { data } = await db.from("players").select("mail_token").eq("id", playerId).single();
  return data?.mail_token as string;
}

export async function firstMemo(db: SupabaseClient, applicationId: string) {
  const { data: app } = await db.from("applications").select("id, campaign_id, player_id, character_id, name").eq("id", applicationId).single();
  if (!app?.character_id) throw new Error("application not approved yet");
  const key = `first_memo:${app.id}`;
  const messageId = `<first-memo-${app.id}@${emailDomain()}>`;
  const { data: dup } = await db.from("correspondence").select("id").eq("message_id", messageId).maybeSingle();
  if (dup) return;
  const [{ data: ch }, { data: player }] = await Promise.all([
    db.from("characters").select("id, name, title, goal_key, supervisor_id").eq("id", app.character_id).single(),
    db.from("players").select("email").eq("id", app.player_id).single(),
  ]);
  if (!ch?.supervisor_id || !player) throw new Error("character or supervisor missing");
  const { data: sup } = await db.from("characters").select("id, name, title").eq("id", ch.supervisor_id).single();
  const goal = GOALS[ch.goal_key as string];
  if (!sup || !goal) throw new Error(`no goal for ${ch.goal_key}`);
  // The memo text comes from the editable template; the send job puts it in the letterhead.
  const { def, fields } = await loadTemplate(db, "first_memo");
  const letter = buildLetter(def, fields, { name: ch.name, goal: goal.text, deadline: goal.deadline, supervisor_name: sup.name, supervisor_title: sup.title ?? "", game_date: gameDate(1) }, letterLinks(null));
  const body = [letter.body, ...(letter.sections ?? []).map((x) => `## ${x.heading}\n${x.body}`)].join("\n\n");
  // Stored as correspondence and delivered by the send job, so it threads and the reply routes to the supervisor.
  const { data: row, error } = await db.from("correspondence").insert({
    campaign_id: app.campaign_id, direction: "outbound", message_id: messageId, from_character: sup.id, to_characters: [ch.id], to_addresses: [player.email],
    subject: letter.subject, body_text: body, raw: { letter_kind: "memo", classification: letter.classification ?? "Confidential", first_memo: key }, trusted: true,
  }).select("id").single();
  if (error) { if (error.code === "23505") return; throw new Error(`memo: ${error.message}`); }
  await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
  await db.from("events").insert({ campaign_id: app.campaign_id, kind: "memo.first_sent", payload: { character_id: ch.id, goal: ch.goal_key }, idempotency_key: key, visible_to: [ch.id] });
}
