/* Seed Season One into Supabase from canon. Idempotent: upserts by slug.
   pnpm seed            → seeds campaign "season-one"
   Loads: campaign, eight departments (divisions), factions, committees
   (organizations), starting rules, the seed NPC cast, and DECIDED facts from
   canon/secret/00-truth-ledger.md. npc_state is left null until the Personnel
   Directory task is promoted to canon. */
import { config as loadEnv } from "dotenv";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(import.meta.dirname, "..");
loadEnv({ path: join(ROOT, ".env.local") });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Supabase env missing"); process.exit(2); }
const db = createClient(url, key, { auth: { persistSession: false } });

// The client is untyped (no generated DB types yet), so callers name the shape.
async function must<T = unknown>(p: PromiseLike<{ data: unknown; error: { message: string } | null }>, what: string): Promise<T> {
  const { data, error } = await p; if (error) throw new Error(`${what}: ${error.message}`); if (data == null) throw new Error(`${what}: no data`); return data as T;
}

(async () => {
  const campaign = await must<{ id: string }>(db.from("campaigns").upsert({ slug: "season-one", title: "Season One — The High Country", timezone: "America/New_York", lock_time: "20:00", dispatch_time: "09:00", status: "draft" }, { onConflict: "slug" }).select("id").single(), "campaign");
  const cid = campaign.id;
  console.log("campaign", cid);

  const divisions = [
    ["advanced-materials", "Advanced Materials", "Metallurgy and exotic alloys. ORPHEUS lives here."],
    ["aerospace-systems", "Aerospace Systems", "Aviation and guidance. NIGHTJAR. The night flights."],
    ["biological-sciences", "Biological Sciences", "Veterinary and medical research. HARVEST."],
    ["applied-physics", "Applied Physics", "Energy systems and instrumentation. JANUS."],
    ["information-systems", "Information Systems", "Computing and statistical analysis. CHOIR."],
    ["procurement-logistics", "Procurement & Logistics", "Purchasing and transportation. Where the invoices are."],
    ["corporate-security", "Corporate Security", "Industrial security and investigations. Sloane's shop."],
    ["personnel-administration", "Personnel & Administration", "Employment and internal policy. Records and influence."],
    ["dsrd", "Department of Special Research and Development", "The Department. Coordinates sensitive projects. Not on the org chart new hires receive."],
  ];
  await must(db.from("divisions").upsert(divisions.map(([slug, name, description]) => ({ campaign_id: cid, slug, name, description })), { onConflict: "campaign_id,slug" }).select("id"), "divisions");
  const divRows = await must<{ id: string; slug: string }[]>(db.from("divisions").select("id, slug").eq("campaign_id", cid), "divisions read");
  const div = Object.fromEntries(divRows.map((d) => [d.slug, d.id]));

  const factions = [
    ["royce", "Royce Industries", "Own the phenomenon. Complete OMEGA. Keep the contract.", true],
    ["keepers", "The Vigil — Keepers", "Contain. Preserve contradictory accounts. Stop the April test.", false],
    ["ascendants", "The Vigil — Ascendants", "Accelerate. Open the stairway. Run the chamber.", false],
    ["sentinel", "PROGRAM SENTINEL", "Verify, weaponize, deny to foreigners. Split on control vs dismantling.", false],
    ["igcc", "International Geophysical Coordination Commission", "Understand a planetary pattern. Some want it out of one nation's hands.", true],
    ["presence", "The Presence", "Not an organization. Not negotiable in language.", false],
  ];
  await must(db.from("factions").upsert(factions.map(([slug, name, values, pub]) => ({ campaign_id: cid, slug, name, values, public: pub })), { onConflict: "campaign_id,slug" }).select("id"), "factions");

  const orgs = [
    ["board", "Board of Directors", "council", { method: "majority_of_seats", seats: 7, quorum: 4 }],
    ["research-committee", "Research Committee", "committee", { method: "majority_of_votes", seats: 5, quorum: 3 }],
    ["safety-committee", "Safety Committee", "committee", { method: "majority_of_votes", seats: 5, quorum: 3 }],
    ["keepers-council", "Council of the Vigil (Keepers)", "society", { method: "supermajority", fraction: 0.67, quorum: 3 }],
    ["ascendant-cell", "The Congregation of the Last Light (Ascendant cell)", "society", { method: "leader_decides", quorum: 1 }],
  ];
  await must(db.from("organizations").upsert(orgs.map(([slug, name, kind, charter]) => ({ campaign_id: cid, slug, name, kind, charter })), { onConflict: "campaign_id,slug" }).select("id"), "organizations");

  // Starting rules. Placeholders from the brainstorm; tuned by simulation later.
  const rules: [string, unknown][] = [
    ["round.lock_time", "20:00"], ["round.dispatch_time", "09:00"], ["episode.rounds", 14],
    ["au.per_round", 20], ["au.cap", 20], ["au.start", 20], ["au.hold_bonus", 0],
    ["correspondence.daily_limit", 40],
    ["motion.default.method", "majority_of_votes"], ["motion.removal.method", "majority_of_seats"],
    ["clearance.max", 5],
    ["convergence.index", 22], ["convergence.threshold.manifest", 40], ["convergence.threshold.opening", 80],
  ];
  // rules has no unique key by design (versioned); insert only those missing at round 1
  const existing = await must<{ key: string }[]>(db.from("rules").select("key").eq("campaign_id", cid).eq("effective_from_round", 1), "rules read");
  const have = new Set(existing.map((r) => r.key));
  const missing = rules.filter(([k]) => !have.has(k)).map(([key, value]) => ({ campaign_id: cid, key, value, effective_from_round: 1, enacted_by: "charter" }));
  if (missing.length) await must(db.from("rules").insert(missing).select("id"), "rules insert");

  // Seed cast from canon/secret/03. npc_state filled after the directory task.
  const cast: [string, string, string, string | null, number, string][] = [
    ["royce", "Edmund H. Royce", "Founder and Chairman", "dsrd", 5, "active"],
    ["vale", "Dr. Adrian Vale", "Chief Scientist", "dsrd", 5, "active"],
    ["sloane", "Harold Sloane", "Director of Corporate Security", "corporate-security", 5, "active"],
    ["hensley", "Margaret Hensley", "Chief Financial Officer", "procurement-logistics", 4, "active"],
    ["marsh", "Dr. Evelyn Marsh", "Research Scientist", "applied-physics", 3, "missing"],
    ["kessler", "Dr. Miriam Kessler", "Former Senior Scientist, OMEGA", null, 0, "missing"],
    ["greeley", "Paul Greeley", "Laboratory Technician", "applied-physics", 2, "dead"],
    ["mercer", "Daniel Mercer", "Technical Liaison (federal)", null, 0, "active"],
    ["fisk", "Leonard Fisk", "Security Analyst", "corporate-security", 2, "active"],
    ["sayer", "Martin Sayer", "Correspondent, Yonkers NY", null, 0, "active"],
    // Department heads from canon/02 (the supervisors new hires report to).
    ["ely", "Dr. Sarah Ely", "Director, Biological Sciences", "biological-sciences", 4, "active"],
    ["baines", "Col. (Ret.) Frank Baines", "Director, Aerospace Systems", "aerospace-systems", 4, "active"],
    ["jthorne", "Julian Thorne", "Director, Information Systems", "information-systems", 4, "active"],
    ["armitage", "Dorothy Armitage", "Director, Personnel & Administration", "personnel-administration", 4, "active"],
    ["voss", "Gerald Voss", "Director, Procurement & Logistics", "procurement-logistics", 4, "active"],
    ["ethorne", "Dr. Elias Thorne", "Director, Advanced Materials", "advanced-materials", 4, "active"],
    ["kovic", "Dr. Aris Kovic", "Director, Applied Physics", "applied-physics", 4, "active"],
  ];
  await must(db.from("characters").upsert(cast.map(([slug, name, title, d, clearance, status]) => ({ campaign_id: cid, slug, name, title, division_id: d ? div[d] : null, clearance, status, public_profile: null })), { onConflict: "campaign_id,slug" }).select("id"), "characters");

  // DECIDED facts from the truth ledger. Secret by default.
  const facts: [string, unknown][] = [
    ["presence.nature", "a process coming into existence; effects propagate backward through time; not an ancient being"],
    ["presence.moral_valence", "OPEN"], ["presence.inevitable", "OPEN"],
    ["r1.origin", "terrestrial matter in a metastable configuration produced by the phenomenon; decays"],
    ["drawing_68_24.origin", "closed causal loop; no first inventor"],
    ["recovery_north.real", false],
    ["chamber.reproduces_stairway", true],
    ["sublevel_nine.predates_building", true],
    ["marsh.status", "alive, with the Keepers (PROPOSED)"],
    ["marsh.sent_vetch_page", true],
    ["records_transfer.ordered_by", "vale via hensley's office (PROPOSED)"],
    ["greeley.cause", "cardiac arrest during unauthorized CHOIR-style session; not murder (PROPOSED)"],
    ["kessler.status", "alive; IGCC source (PROPOSED)"],
    ["sloane.disinformation_campaign", true],
    ["sayer.linked_to_murders", false], ["sayer.linked_to_ascendants", true],
    ["nuclear.anyone_has_weapon", false],
    ["omega.test_scheduled", "1978-04"],
    ["march_17.sentence", "You are not the first ones to build this"],
    ["vigil.predates_royce", true],
    ["seven_descents.testable", [1, 2, 4]], ["seven_descents.invented", [3, 6]], ["seven_descents.disinformation", [5]],
  ];
  await must(db.from("facts").upsert(facts.map(([k, v]) => ({ campaign_id: cid, key: k, value: v, secret: true })), { onConflict: "campaign_id,key" }).select("id"), "facts");

  const counts = await Promise.all(["divisions", "factions", "organizations", "rules", "characters", "facts"].map(async (t) => [t, (await db.from(t).select("id", { count: "exact", head: true }).eq("campaign_id", cid)).count]));
  console.log(Object.fromEntries(counts));
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
