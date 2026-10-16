/* SPONSOR_MOTION (rulebook §8.3): a player puts a motion before a body. The
   engine numbers it, opens it with the next dispatch (so the ballot notice
   and the dispatch's Ballots section carry it), and closes it at the lock of
   its closing round like any other motion (jobs.ts governance phase: player
   members vote by VOTE, staff seats by their lean, which starts at nothing and
   moves with LOBBY).

   Who may sponsor, by rule: a member of the body; anyone else with a member's
   countersignature, which a staff member gives when the sponsor has sat down
   with them (an interview, relationships.obligation); an Administrator once
   an episode without one. PROPOSED 2026-10-16. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { committeeByName } from "@/lib/game/filing";

type Db = SupabaseClient;

export type MotionAsk = { orgName: string; title: string; closes: number | null };

/* "put a motion before the Research Committee to suspend HARVEST sampling, closing round 8"
   / SPONSOR_MOTION Safety "Seal Building 7" CLOSES 12 */
export function parseMotion(text: string): MotionAsk | { error: string } {
  const orgName = committeeByName(text);
  if (!orgName) return { error: "name the body: the Board, the Research Committee or the Safety Committee" };
  const closesM = text.match(/\bclos(?:es|ing|e)\b(?:\s+at)?(?:\s+the\s+lock\s+of)?\s*(?:on\s+)?(?:round\s+)?(\d{1,3})\b/i);
  const closes = closesM ? Number(closesM[1]) : null;
  let title: string | null = null;
  const q = text.match(/["“]([^"”]{4,160})["”]/);
  if (q) title = q[1].trim();
  else {
    const m = text.replace(closesM?.[0] ?? "", "").match(/\b(?:that|to|calling for|for)\s+(.{6,200}?)\s*[.?!]?\s*$/i);
    if (m) title = m[1].trim();
  }
  if (!title) return { error: 'say what the motion asks, in quotes or after "that": SPONSOR_MOTION Board "Seal Building 7" CLOSES 12' };
  title = title.replace(/^(?:a\s+)?motion\s+(?:that|to)\s+/i, "").replace(/^(?:the\s+)?(?:board(?:\s+of\s+directors)?|research committee|safety committee)\s+(?:that\s+|to\s+)?/i, "").replace(/[\s,;:]+$/, "");
  return { orgName, title: title.charAt(0).toUpperCase() + title.slice(1), closes };
}

const PREFIX: Record<string, string> = { "Board of Directors": "B", "Research Committee": "R", "Safety Committee": "S" };

export async function nextNumber(db: Db, campaignId: string, orgName: string): Promise<string> {
  const prefix = PREFIX[orgName] ?? "M";
  const { data } = await db.from("motions").select("number").eq("campaign_id", campaignId).like("number", `${prefix}-77-%`);
  const max = Math.max(0, ...(data ?? []).map((m) => Number(String(m.number).split("-").pop()) || 0));
  return `${prefix}-77-${String(max + 1).padStart(3, "0")}`;
}

export async function sponsorMotion(db: Db, p: { campaignId: string; roundId: string; roundNo: number; episode: number; sponsor: { id: string; slug: string; name: string; specialization: string | null }; ask: MotionAsk; dry?: boolean }): Promise<{ ok: true; number: string; opens: number; closes: number; countersigned: string | null; summary: string } | { ok: false; error: string }> {
  const { data: org } = await db.from("organizations").select("id, name, slug").eq("campaign_id", p.campaignId).eq("name", p.ask.orgName).maybeSingle();
  if (!org) return { ok: false, error: `no body called ${p.ask.orgName} is on the books` };
  const { data: members } = await db.from("memberships").select("character_id, role, characters(id, slug, name, player_id)").eq("organization_id", org.id);
  const rows = (members ?? []).map((m) => ({ id: m.character_id as string, role: m.role as string, c: (Array.isArray(m.characters) ? m.characters[0] : m.characters) as { id: string; slug: string; name: string; player_id: string | null } | null }));
  const isMember = rows.some((m) => m.id === p.sponsor.id);
  let countersigned: string | null = null;
  if (!isMember) {
    // A staff member of the body the sponsor has sat down with countersigns.
    const staff = rows.filter((m) => m.c && !m.c.player_id);
    const { data: rel } = staff.length ? await db.from("relationships").select("from_character, obligation").eq("to_character", p.sponsor.id).in("from_character", staff.map((m) => m.id)).gte("obligation", 0.1).order("obligation", { ascending: false }).limit(1) : { data: [] };
    const signer = rel?.[0] ? staff.find((m) => m.id === rel[0].from_character) : null;
    if (signer) countersigned = signer.c!.name;
    else if (p.sponsor.specialization === "administrator") {
      const key = `sponsor.free.${p.sponsor.id}.${p.episode}`;
      const { data: used } = await db.from("facts").select("key").eq("campaign_id", p.campaignId).eq("key", key).maybeSingle();
      if (used) return { ok: false, error: `${p.sponsor.name} has already used this episode's unsigned motion; a member of the ${org.name} must countersign the next` };
      if (!p.dry) await db.from("facts").upsert({ campaign_id: p.campaignId, key, value: { round: p.roundNo }, established_round: p.roundNo, secret: true }, { onConflict: "campaign_id,key" });
      countersigned = "the sponsor's own standing as Administrator";
    } else return { ok: false, error: `${p.sponsor.name} is not a member of the ${org.name}, and no member has countersigned; sit down with one first (${staff.map((m) => m.c!.name).join(", ")})` };
  }
  const opens = p.roundNo + 1;
  const closes = Math.min(opens + 4, Math.max(opens + 1, p.ask.closes ?? opens + 3));
  const number = await nextNumber(db, p.campaignId, org.name);
  const stakes = `Sponsored by ${p.sponsor.name}${countersigned && !countersigned.startsWith("the sponsor") ? `, countersigned by ${countersigned}` : ""}: that ${p.ask.title.charAt(0).toLowerCase()}${p.ask.title.slice(1)}. If it carries, the ${org.name} is on record for it and the company acts on it; if it fails, nothing changes.`;
  if (!p.dry) {
    const { error } = await db.from("motions").insert({ campaign_id: p.campaignId, organization_id: org.id, number, title: p.ask.title, text: `That ${p.ask.title.charAt(0).toLowerCase()}${p.ask.title.slice(1)}.`, kind: "governance", sponsor_id: p.sponsor.id, threshold: { method: "majority_of_votes" }, opens_round: opens, closes_round: closes, status: "open", stakes });
    if (error) return { ok: false, error: error.message };
    // The body's staff seats learn of it now, so a letter or a lobby tonight lands on an informed desk.
    const tell = rows.filter((m) => m.c && !m.c.player_id).map((m) => ({ character_id: m.id, fact_key: `told:${p.sponsor.slug}:motion:${number}`, value: { kind: "info_share", text: `${p.sponsor.name} has put ${number} before the ${org.name}: "${p.ask.title}" (opens Round ${opens}, closes Round ${closes})${countersigned ? `; countersigned by ${countersigned}` : ""}`, from: p.sponsor.id, from_name: p.sponsor.name, round: p.roundNo }, confidence: 1, source_kind: "told", source_ref: null, learned_round: p.roundNo }));
    if (tell.length) await db.from("knowledge").insert(tell);
    await db.from("events").insert({ campaign_id: p.campaignId, round_id: p.roundId, phase: "strategic", kind: "motion.sponsored", payload: { number, title: p.ask.title, org: org.slug, sponsor: p.sponsor.id, opens, closes, countersigned }, idempotency_key: `sponsored:${p.campaignId}:${number}`, visible_to: [p.sponsor.id] });
  }
  return { ok: true, number, opens, closes, countersigned, summary: `${p.sponsor.name}'s motion is on the ${org.name}'s paper as ${number}, "${p.ask.title}"${countersigned ? `, countersigned by ${countersigned}` : ""}. It is announced with tomorrow's dispatch, opens Round ${opens} and closes at the lock of Round ${closes}; ${org.name === "Board of Directors" ? "directors" : "members"} vote by VOTE ${number}: FOR or AGAINST, and staff seats vote as they lean, which LOBBY can move.` };
}
