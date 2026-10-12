"use server";
import { z } from "zod";
import { refresh } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasSubscription } from "@/lib/stripe";
import { DEJA_VU, DEPARTMENTS, IDENTITIES, KNOWLEDGE, SKILLS, SPECIALIZATIONS, priceOut } from "@/lib/game/creation";

export type ApplyState = { error?: string } | undefined;

const APPROVAL_DELAY_MS = Number(process.env.APPROVAL_DELAY_MINUTES ?? 120) * 60_000;

const Form = z.object({
  name: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(1500),
  identity: z.enum(IDENTITIES.map((i) => i.key) as [string, ...string[]]),
  specialization: z.enum(SPECIALIZATIONS.map((s) => s.key) as [string, ...string[]]),
  dept1: z.string(), dept2: z.string(), dept3: z.string(),
  trait_favorite: z.string().trim().max(300),
  trait_hated: z.string().trim().max(300),
  unexplained: z.enum(["yes", "no"]),
  unexplained_text: z.string().trim().max(2000),
  near_death: z.enum(["yes", "no"]),
  near_death_text: z.string().trim().max(2000),
  deja_vu: z.enum(DEJA_VU.map((d) => d.key) as [string, ...string[]]),
  timezone: z.string().max(64),
  consent: z.literal("yes"),
});

const validTz = (tz: string) => { try { Intl.DateTimeFormat(undefined, { timeZone: tz }); return true; } catch { return false; } };

export async function submitApplication(_: ApplyState, fd: FormData): Promise<ApplyState> {
  const token = String(fd.get("token") ?? "");
  const db = supabaseAdmin();
  const { data: player } = await db.from("players").select("id").eq("file_token", token).maybeSingle();
  if (!player) return { error: "This application link is not valid." };
  if (!(await hasSubscription(db, player.id))) return { error: "Your subscription is not active." };

  const parsed = Form.safeParse(Object.fromEntries([...fd.entries()].filter(([k]) => !["skills", "knowledge", "token"].includes(k)).map(([k, v]) => [k, String(v)])));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first.path[0] === "consent" ? "Please agree to the processing notice." : `Check ${String(first.path[0]).replace(/_/g, " ")}: ${first.message.toLowerCase()}.` };
  }
  const f = parsed.data;
  const prefs = [f.dept1, f.dept2, f.dept3];
  if (new Set(prefs).size !== 3 || prefs.some((p) => !DEPARTMENTS[p])) return { error: "Rank three different departments." };
  if ((f.unexplained === "yes" && !f.unexplained_text) || (f.near_death === "yes" && !f.near_death_text)) return { error: "You answered yes; please describe it." };
  const skills = fd.getAll("skills").map(String).filter((k) => SKILLS.some((s) => s.key === k));
  const knowledge = fd.getAll("knowledge").map(String).filter((k) => KNOWLEDGE.some((s) => s.key === k));
  const price = priceOut(f.identity, skills, knowledge);
  if (!price.ok) return { error: price.problems[0] };
  const tz = validTz(f.timezone) ? f.timezone : "America/New_York";
  const campaign = process.env.CAMPAIGN_ID;
  if (!campaign) return { error: "No season is open for applications." };

  const { data: app, error } = await db.from("applications").insert({
    player_id: player.id, campaign_id: campaign, name: f.name, bio: f.bio || null, identity: f.identity, specialization: f.specialization, dept_prefs: prefs,
    trait_favorite: f.trait_favorite || null, trait_hated: f.trait_hated || null,
    unexplained: f.unexplained === "yes", unexplained_text: f.unexplained === "yes" ? f.unexplained_text : null,
    near_death: f.near_death === "yes", near_death_text: f.near_death === "yes" ? f.near_death_text : null,
    deja_vu: f.deja_vu, skills, knowledge, points_total: price.budget, points_spent: price.spent, timezone: tz,
  }).select("id").single();
  if (error) return { error: error.code === "23505" ? "You have already applied for this season." : error.message };

  await db.from("players").update({ display_name: f.name, timezone: tz, consent_ai_processing_at: new Date().toISOString() }).eq("id", player.id);
  await db.from("jobs").insert({ kind: "approve_application", payload: { application_id: app.id }, run_after: new Date(Date.now() + APPROVAL_DELAY_MS).toISOString() });
  refresh();
  return undefined;
}
