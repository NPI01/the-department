import type { SupabaseClient } from "@supabase/supabase-js";
import { DEPARTMENTS } from "@/lib/game/creation";

/* A character's particulars as Personnel & Administration keeps them: badge
   number, supervisor, the day they started, and the biography the player
   writes on their personnel file. The biography is a company record: staff
   who write to the character may have read it, so it reaches their prompts. */

/* Badges are four digits, fixed for life, derived from the character so no
   migration or backfill is needed. 1000–8999: nine thousand badges is plenty
   for one campus. */
export function badgeNumber(characterId: string): string {
  let h = 2166136261;
  for (const ch of characterId) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return String(1000 + ((h >>> 0) % 8000));
}

/* Round 1 of Season One is Monday, October 10, 1977; one game day per round. */
export const SEASON_START = Date.UTC(1977, 9, 10);
export const roundDate = (round: number) => new Date(SEASON_START + (round - 1) * 86_400_000);
export const longDate = (d: Date) => d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" });

export const BIO_FIELDS = [
  { key: "born", label: "Date and place of birth", hint: "e.g. March 3, 1949, Fargo, North Dakota", rows: 1 },
  { key: "hometown", label: "Where you grew up", hint: "Town, state; or several", rows: 1 },
  { key: "residence", label: "Local residence", hint: "Where you live now, and since when (Minot, Tagus, company housing…)", rows: 1 },
  { key: "family", label: "Marital status and family", hint: "Spouse, children, parents living, next of kin", rows: 2 },
  { key: "education", label: "Education", hint: "Schools, degrees, military training", rows: 2 },
  { key: "employment", label: "Previous employment", hint: "Employers, positions, years, reason for leaving", rows: 3 },
  { key: "service", label: "Military service", hint: "Branch, years, rank at discharge; or NONE", rows: 1 },
  { key: "hobbies", label: "Hobbies, clubs and interests", hint: "What you do with a Saturday; lodges, churches, teams", rows: 2 },
  { key: "notes", label: "In your own words", hint: "Anything else Personnel should know about you", rows: 5 },
] as const;
export type BioKey = (typeof BIO_FIELDS)[number]["key"];
export type Bio = Partial<Record<BioKey, string>>;

type Sheet = { bio?: string | null; profile?: Bio } | null;

/* The biography as stored, falling back to the free text from the application. */
export function bioFrom(sheet: Sheet, publicProfile: string | null): Bio {
  const p = { ...(sheet?.profile ?? {}) };
  if (!p.notes && (sheet?.bio || publicProfile)) p.notes = (sheet?.bio || publicProfile) ?? undefined;
  return p;
}

/* One paragraph for a staff member's prompt; empty when nothing is on file. */
export function bioForPrompt(bio: Bio): string {
  return BIO_FIELDS.filter((f) => bio[f.key]?.trim()).map((f) => `${f.label}: ${bio[f.key]!.trim().replace(/\s+/g, " ")}`).join(". ").slice(0, 1500);
}

export type Particulars = {
  badge: string;
  supervisor: { name: string; title: string | null } | null;
  startRound: number;
  currentRound: number | null;
  roundOpenedAt: string | null;   // ISO; when the current round opened, for the hour of day
  timezone: string;
};

/* Badge, supervisor and dates for one character. The supervisor is the one
   assigned at hiring, else the head of their department. */
export async function particulars(db: SupabaseClient, c: { id: string; campaign_id: string; division_id: string | null; supervisor_id?: string | null; created_at: string }): Promise<Particulars> {
  const [{ data: campaign }, { data: rounds }, { data: div }] = await Promise.all([
    db.from("campaigns").select("timezone").eq("id", c.campaign_id).maybeSingle(),
    db.from("rounds").select("number, status, opens_at").eq("campaign_id", c.campaign_id).order("number"),
    c.division_id ? db.from("divisions").select("slug").eq("id", c.division_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  let supervisor: Particulars["supervisor"] = null;
  const head = div?.slug ? DEPARTMENTS[div.slug as string]?.supervisor : undefined;
  const q = c.supervisor_id ? db.from("characters").select("name, title").eq("id", c.supervisor_id) : head ? db.from("characters").select("name, title").eq("campaign_id", c.campaign_id).eq("slug", head) : null;
  if (q) { const { data } = await q.maybeSingle(); if (data) supervisor = { name: data.name as string, title: (data.title as string | null) ?? null }; }

  const rs = (rounds ?? []) as { number: number; status: string; opens_at: string }[];
  const live = [...rs].reverse().find((r) => ["open", "locked", "resolving"].includes(r.status)) ?? null;
  // Hired during a round: that round's day. Hired before the season: Round 1.
  const during = [...rs].reverse().find((r) => r.opens_at <= c.created_at && r.status !== "scheduled");
  return { badge: badgeNumber(c.id), supervisor, startRound: during?.number ?? 1, currentRound: live?.number ?? null, roundOpenedAt: live?.opens_at ?? null, timezone: (campaign?.timezone as string) ?? "America/New_York" };
}
