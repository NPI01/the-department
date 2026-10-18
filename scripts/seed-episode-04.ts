/* Episode 04: the Tagus cast and the Safety Committee ballot on sealing the
   utility structure. Episode 4 is rounds 43–56; day 3 is round 45, day 7 is
   round 49. Cast sheets are loaded afterwards by scripts/cast-sheets-load.ts
   (canon/secret/11-cast-sheets.md, third pass); Rud's sheet carries
   `place: "keepers-farm"` so an interview at the farm meets her.
     pnpm tsx scripts/seed-episode-04.ts     re-runnable */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const cid = process.env.CAMPAIGN_ID!;

  // slug, name, title, clearance, public profile (canon/02-personnel-directory.md), place
  const cast: [string, string, string, number, string, string | null][] = [
    ["brandvold", "Lyle Brandvold", "Field Surveyor, Prairie Geological Services", 0, "34, of Minot. Three seasons surveying for PGS at Tagus. Careful, literal, writes everything down. Overdue since the afternoon before Thanksgiving.", null],
    ["rud", "Agnes Rud", "Farmer, west of Tagus", 0, "67. Keeps the farm west of the siding alone since her husband died, and the only guest room in Tagus. Has complained twice to the company about surveyors crossing her land at night and never had an answer.", "keepers-farm"],
    ["sandvik", "Ole Sandvik", "Formerly Prairie Geological Services", 0, "Early sixties. Surveyed for PGS at Tagus from the first year and lives in a trailer behind the elevator. Will not talk to anyone from the company, and has said so to the sheriff.", null],
    ["mahlum", "Curtis Mahlum", "Formerly Prairie Geological Services", 0, "Technician for PGS until 1976; now drives a feed truck out of Stanley. Says they were looking for a tunnel, and will say it to anybody who buys the coffee.", null],
    ["pfeifer", "Dennis Pfeifer", "Formerly Prairie Geological Services", 0, "Drove for PGS until August. Says there was never any digging at Tagus and that people should stop asking him.", null],
    ["ashby", "Conrad Ashby", "Contracting Officer, Defense Supply", 0, "A federal contracting officer who writes from an address that is withheld. Polite, exact, and interested in the condition of things the company holds under contract.", null],
  ];
  const rows = cast.map(([slug, name, title, clearance, public_profile, place]) => ({ campaign_id: cid, slug, name, title, division_id: null, clearance, status: "active", public_profile, npc_state: place ? { listed: true, place } : { listed: true } }));
  const { error } = await db.from("characters").upsert(rows, { onConflict: "campaign_id,slug", ignoreDuplicates: false });
  if (error) throw error;
  console.log(`cast: ${rows.length} characters upserted`);

  const { data: chars } = await db.from("characters").select("id, slug").eq("campaign_id", cid);
  const id = (slug: string) => { const c = (chars ?? []).find((x) => x.slug === slug); if (!c) throw new Error(`no character ${slug}`); return c.id as string; };
  const { data: org } = await db.from("organizations").select("id").eq("campaign_id", cid).eq("name", "Safety Committee").single();
  const number = "S-77-004";
  const row = { campaign_id: cid, organization_id: org!.id, number, title: "Closure of the Tagus Utility Structure", kind: "governance", sponsor_id: id("sloane"), threshold: { method: "majority_of_votes" }, opens_round: 45, closes_round: 49,
    stakes: "Whether the stairs under the utility cellar at Tagus are poured shut and the parcel fenced, or stay open under Prairie Geological Services' monitoring. Sealed, the company can tell the sheriff there is nothing there; open, whoever holds the contract on the site decides who goes down it.",
    text: "That the utility structure on the Tagus parcel held by Prairie Geological Services be closed with concrete at the company's expense, the parcel fenced, and access thereafter granted only by order of this Committee.",
    finding: { claim: "tagus_structure_sealed", on: "either", text: "that the Tagus structure be closed with concrete and the parcel fenced", false_text: "that the Tagus structure remain open under Prairie Geological Services' monitoring" } };
  const { data: ex } = await db.from("motions").select("id").eq("campaign_id", cid).eq("number", number).maybeSingle();
  if (ex) await db.from("motions").update(row).eq("id", ex.id); else await db.from("motions").insert({ ...row, status: "open" });
  const stances: Record<string, { lean: number; price?: { any_of: string[]; sets: number; note: string } | null }> = {
    sloane: { lean: 1 },
    armitage: { lean: 0.8 },
    voss: { lean: 0.6, price: { any_of: ["pgs.voss_is_pgs_director_noticed", "tagus.deed_signed_voss_baines_1969_noticed", "pgs.sandvik_paid_no_badge_noticed"], sets: 1, note: "once his own name is on a PGS paper in somebody else's hand, he wants the thing under concrete by Friday" } },
    baines: { lean: -1 },
    hensley: { lean: -0.2, price: { any_of: ["tagus.depths_all_correct_confirmed", "tagus.two_tapes_one_bolt", "tagus.tape_stretched_confirmed", "sentinel.depths_known_in_1969_noticed"], sets: -0.9, note: "told the three depths are real, she will not bury a liability she cannot price; she wants it open and on paper" } },
  };
  for (const [slug, st] of Object.entries(stances)) await db.from("facts").upsert({ campaign_id: cid, key: `motion.${number}.stance.${slug}`, value: st, established_round: 43, secret: true }, { onConflict: "campaign_id,key" });
  console.log(`motion ${number} on the Safety Committee, opens round 45, closes round 49; stances: ${Object.keys(stances).join(", ")}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
