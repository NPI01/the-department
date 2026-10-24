/* Episode 05: Kessel, and the Research Committee ballot on experiments on the
   Tagus passage. Episode 5 is rounds 57–70; day 7 is round 63, day 13 is
   round 69. Sheets load afterwards with scripts/cast-sheets-load.ts.
     pnpm tsx scripts/seed-episode-05.ts     re-runnable */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const cid = process.env.CAMPAIGN_ID!;
  const people = [
    { campaign_id: cid, slug: "kessel", name: "Reinhold Kessel", title: "Field Supervisor, Prairie Geological Services", division_id: null, clearance: 0, status: "active", public_profile: "Runs the PGS yard on the Tagus road and its two trucks. Signs the field log, locks the doors, and telephones Procurement when something goes wrong. Has worked the parcel since 1972 and has never been below the landing.", npc_state: { listed: true, place: "pgs-yard" } },
  ];
  const { error: pe } = await db.from("characters").upsert(people, { onConflict: "campaign_id,slug", ignoreDuplicates: false });
  if (pe) throw pe;
  console.log(`people: ${people.length} upserted`);
  const { data: chars } = await db.from("characters").select("id, slug").eq("campaign_id", cid);
  const id = (slug: string) => { const c = (chars ?? []).find((x) => x.slug === slug); if (!c) throw new Error(`no character ${slug}`); return c.id as string; };
  const { data: org } = await db.from("organizations").select("id").eq("campaign_id", cid).eq("name", "Research Committee").single();
  const number = "R-77-005";
  const row = { campaign_id: cid, organization_id: org!.id, number, title: "Experiments on the Tagus Passage", kind: "governance", sponsor_id: id("vale"), threshold: { method: "majority_of_votes" }, opens_round: 63, closes_round: 69,
    stakes: "Whether the company studies the passage under Tagus on the record: instrumented descents under protocol, monitoring, and a synchronized observation with the Building 7 apparatus in the new year, on federal money. Refused, descents are banned and the cabinet is locked; what goes on at Tagus goes on anyway, off the record.",
    text: "That the Research Committee authorize a programme of experiments on the passage below the Tagus utility structure in three phases: instrumented descents by Applied Physics observers under protocol; continuous monitoring; and a synchronized observation with the Building 7 apparatus, on a date the Committee will set.",
    finding: { claim: "tagus_experiments_authorized", on: "either", text: "that experiments on the Tagus passage are authorized in three phases under the Chief Scientist", false_text: "that no experiment is to be conducted on the Tagus passage and no employee is to go below the first landing" } };
  const { data: ex } = await db.from("motions").select("id").eq("campaign_id", cid).eq("number", number).maybeSingle();
  if (ex) await db.from("motions").update(row).eq("id", ex.id); else await db.from("motions").insert({ ...row, status: "open" });
  const stances: Record<string, { lean: number; price?: { any_of: string[]; sets: number; note: string } | null }> = {
    vale: { lean: 1 },
    kovic: { lean: 0.8 },
    jthorne: { lean: 0.9 },
    ethorne: { lean: 0.3, price: { any_of: ["tagus.instruments_disagree_measured", "tagus.light_matches_eleven_minutes_noticed"], sets: 0.9, note: "shown a reading taken below the landing, he wants the programme and his sample in it" } },
    ely: { lean: -0.2, price: { any_of: ["tagus.experiments_funded_by_77s_noticed"], sets: -0.8, note: "shown that the passage is to be studied on HARVEST's money, she will not have it" } },
  };
  for (const [slug, st] of Object.entries(stances)) await db.from("facts").upsert({ campaign_id: cid, key: `motion.${number}.stance.${slug}`, value: st, established_round: 57, secret: true }, { onConflict: "campaign_id,key" });
  console.log(`motion ${number} on the Research Committee, opens round 63, closes round 69; stances: ${Object.keys(stances).join(", ")}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
