/* Cohorts: which campaign an applicant joins, when a cohort starts, and how a
   new one is made from a template. Seats are counted as applications that are
   submitted or approved. A recruiting cohort with open seats comes first; an
   active cohort still takes late joiners for its first `late_join_days` of the
   episode, since scheduled mail catches them up. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { openNextRound } from "@/lib/engine/rounds";

export type Cohort = { id: string; slug: string; title: string; status: string; cohort_size: number; scheduled_start: string | null; late_join_days: number; timezone: string; seats_taken: number };

async function withSeats(db: SupabaseClient, rows: Record<string, unknown>[]): Promise<Cohort[]> {
  const out: Cohort[] = [];
  for (const r of rows) {
    const { count } = await db.from("applications").select("id", { count: "exact", head: true }).eq("campaign_id", r.id as string).in("status", ["submitted", "approved"]);
    out.push({ id: r.id as string, slug: r.slug as string, title: r.title as string, status: r.status as string, cohort_size: Number(r.cohort_size ?? 12), scheduled_start: (r.scheduled_start as string | null) ?? null, late_join_days: Number(r.late_join_days ?? 7), timezone: (r.timezone as string) ?? "America/New_York", seats_taken: count ?? 0 });
  }
  return out;
}

/* The cohort a new applicant joins, or null if nothing is open. */
export async function recruitingCampaign(db: SupabaseClient): Promise<Cohort | null> {
  const { data: rec } = await db.from("campaigns").select("*").eq("status", "recruiting").order("scheduled_start", { ascending: true, nullsFirst: false });
  for (const c of await withSeats(db, rec ?? [])) if (c.seats_taken < c.cohort_size) return c;
  // Late joiners: an active cohort in the first days of its current episode, with a seat free.
  const { data: act } = await db.from("campaigns").select("*").eq("status", "active");
  for (const c of await withSeats(db, act ?? [])) {
    if (c.seats_taken >= c.cohort_size) continue;
    const { data: round } = await db.from("rounds").select("episode_round").eq("campaign_id", c.id).in("status", ["open", "locked", "resolving", "resolved"]).order("number", { ascending: false }).limit(1).maybeSingle();
    if (!round || Number(round.episode_round ?? 1) <= c.late_join_days) return c;
  }
  return null;
}

/* The campaign a player belongs to: their character's, else their application's. */
export async function campaignForPlayer(db: SupabaseClient, playerId: string): Promise<string | null> {
  const { data: ch } = await db.from("characters").select("campaign_id").eq("player_id", playerId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (ch) return ch.campaign_id as string;
  const { data: app } = await db.from("applications").select("campaign_id").eq("player_id", playerId).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  return (app?.campaign_id as string | undefined) ?? null;
}

/* Recruiting cohorts whose start has come, with at least one approved player, go active and open Round 1. */
export async function startDueCohorts(db: SupabaseClient, now = new Date()): Promise<string[]> {
  const { data: due } = await db.from("campaigns").select("id, slug").eq("status", "recruiting").lte("scheduled_start", now.toISOString());
  const started: string[] = [];
  for (const c of (due ?? []) as { id: string; slug: string }[]) {
    const { count } = await db.from("applications").select("id", { count: "exact", head: true }).eq("campaign_id", c.id).eq("status", "approved");
    if (!count) continue;
    await db.from("campaigns").update({ status: "active" }).eq("id", c.id);
    await openNextRound(db, c.id, now);
    started.push(c.slug);
  }
  return started;
}

/* A new cohort from a template: the institution (divisions, factions, bodies, rules, episodes as planned),
   the staff with their sheets and seats, the open motions and the directors' leans. No players, no mail, no memory. */
export async function cloneCampaign(db: SupabaseClient, p: { templateId: string; slug: string; title: string; cohortSize?: number; scheduledStart?: string | null; timezone?: string; lockTime?: string; dispatchTime?: string }): Promise<string> {
  const { data: t } = await db.from("campaigns").select("*").eq("id", p.templateId).single();
  if (!t) throw new Error("template campaign missing");
  const { data: c, error } = await db.from("campaigns").insert({ slug: p.slug, title: p.title, timezone: p.timezone ?? t.timezone, lock_time: p.lockTime ?? t.lock_time, dispatch_time: p.dispatchTime ?? t.dispatch_time, status: "recruiting", cohort_size: p.cohortSize ?? t.cohort_size ?? 12, scheduled_start: p.scheduledStart ?? null, template_campaign_id: t.id, late_join_days: t.late_join_days ?? 7 }).select("id").single();
  if (error) throw new Error(error.message);
  const cid = c.id as string;
  const strip = (row: Record<string, unknown>, drop: string[] = []): Record<string, unknown> => { const r: Record<string, unknown> = { ...row, campaign_id: cid }; delete r.id; for (const k of drop) delete r[k]; return r; };
  // divisions, factions, organizations, rules, episodes
  const { data: divs } = await db.from("divisions").select("*").eq("campaign_id", t.id);
  const { data: newDivs } = await db.from("divisions").insert((divs ?? []).map((d) => strip(d))).select("id, slug");
  const divMap = new Map((divs ?? []).map((d) => [d.id as string, (newDivs ?? []).find((n) => n.slug === d.slug)?.id as string]));
  const { data: facs } = await db.from("factions").select("*").eq("campaign_id", t.id); if (facs?.length) await db.from("factions").insert(facs.map((f) => strip(f)));
  const { data: orgs } = await db.from("organizations").select("*").eq("campaign_id", t.id);
  const { data: newOrgs } = await db.from("organizations").insert((orgs ?? []).map((o) => strip(o, ["created_by"]))).select("id, slug");
  const orgMap = new Map((orgs ?? []).map((o) => [o.id as string, (newOrgs ?? []).find((n) => n.slug === o.slug)?.id as string]));
  const { data: rules } = await db.from("rules").select("*").eq("campaign_id", t.id); if (rules?.length) await db.from("rules").insert(rules.map((r) => strip(r)));
  const { data: eps } = await db.from("episodes").select("*").eq("campaign_id", t.id); if (eps?.length) await db.from("episodes").insert(eps.map((e) => ({ ...strip(e), status: "planned" })));
  // staff
  const { data: npcs } = await db.from("characters").select("*").eq("campaign_id", t.id).is("player_id", null);
  const { data: newNpcs } = await db.from("characters").insert((npcs ?? []).map((n) => ({ ...strip(n, ["supervisor_id", "goal_key"]), division_id: n.division_id ? divMap.get(n.division_id as string) ?? null : null }))).select("id, slug");
  const npcMap = new Map((npcs ?? []).map((n) => [n.id as string, (newNpcs ?? []).find((x) => x.slug === n.slug)?.id as string]));
  const { data: mems } = await db.from("memberships").select("*").in("organization_id", [...orgMap.keys()]);
  const memRows = (mems ?? []).filter((m) => npcMap.has(m.character_id as string)).map((m) => ({ organization_id: orgMap.get(m.organization_id as string), character_id: npcMap.get(m.character_id as string), role: m.role, voting_weight: m.voting_weight, since_round: m.since_round }));
  if (memRows.length) await db.from("memberships").insert(memRows);
  // motions (reopened) and the facts that hold leans and truths
  const { data: motions } = await db.from("motions").select("*").eq("campaign_id", t.id);
  if (motions?.length) await db.from("motions").insert(motions.map((m) => ({ ...strip(m, ["created_at"]), organization_id: orgMap.get(m.organization_id as string), sponsor_id: m.sponsor_id ? npcMap.get(m.sponsor_id as string) ?? null : null, status: "open" })));
  const { data: facts } = await db.from("facts").select("*").eq("campaign_id", t.id);
  const keep = (facts ?? []).filter((f) => !/^pressure\./.test(f.key as string) && !/^goal\.instruction\./.test(f.key as string)).map((f) => { const v = f.value as { moved?: unknown }; if (v && typeof v === "object" && "moved" in v) delete (v as { moved?: unknown }).moved; return strip({ ...f, value: v }, ["id"]); });
  if (keep.length) await db.from("facts").insert(keep);
  return cid;
}
