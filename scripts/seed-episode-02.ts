/* Episode 02 governance: the Research Committee ballot on cooperating with the
   county and disclosing HARVEST, with members' leans. Rounds are campaign-wide:
   Episode 2 is rounds 15–28, so day 9 is round 23 and day 13 is round 27.
     pnpm tsx scripts/seed-episode-02.ts     re-runnable */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const cid = process.env.CAMPAIGN_ID!;
  // Episode 2's two people (PROPOSED 2026-10-18): the custodian who found the page, and Greeley's sister. Sheets load from canon/secret/11 (fourth pass).
  const people = [
    { campaign_id: cid, slug: "nygaard", name: "Walter Nygaard", title: "Custodian, Building 2", division_id: null, clearance: 1, status: "active", public_profile: "Night custodian for Buildings 2 and 3 since 1974. Keeps to himself, keeps the floors, and was told after July to hand anything from room 2-C to Security.", npc_state: { listed: true, place: "building-2-lockers" } },
    { campaign_id: cid, slug: "rgreeley", name: "Ruth Greeley", title: "Fargo, North Dakota", division_id: null, clearance: 0, status: "active", public_profile: "Paul Greeley's sister, a schoolteacher in Fargo. Received his effects in July and a letter promising a notebook that never came. Has written to the company three times.", npc_state: { listed: true } },
  ];
  const { error: pe } = await db.from("characters").upsert(people, { onConflict: "campaign_id,slug", ignoreDuplicates: false });
  if (pe) throw pe;
  console.log(`people: ${people.length} upserted`);
  const { data: chars } = await db.from("characters").select("id, slug").eq("campaign_id", cid);
  const id = (slug: string) => { const c = (chars ?? []).find((x) => x.slug === slug); if (!c) throw new Error(`no character ${slug}`); return c.id as string; };
  const { data: org } = await db.from("organizations").select("id").eq("campaign_id", cid).eq("name", "Research Committee").single();
  const number = "R-77-002";
  const row = { campaign_id: cid, organization_id: org!.id, number, title: "Cooperation with the County and Disclosure of HARVEST", kind: "investigative", sponsor_id: id("ely"), threshold: { method: "majority_of_votes" }, opens_round: 23, closes_round: 27, text: "That the Research Committee furnish the Ward County Sheriff with the sampling authorizations of Program HARVEST for 1976 and 1977 and the field logs of Prairie Geological Services for the same period, and that the Committee record a finding on whether Lot 77-B was sampled under legitimate authority.",
    finding: { claim: "harvest_sampling_unauthorized", on: "either", text: "that Lot 77-B was sampled without legitimate authority, and that the county is entitled to the program's papers", false_text: "that Program HARVEST's sampling was carried out under legitimate authority and that its papers remain the company's" } };
  const { data: ex } = await db.from("motions").select("id").eq("campaign_id", cid).eq("number", number).maybeSingle();
  if (ex) await db.from("motions").update(row).eq("id", ex.id); else await db.from("motions").insert({ ...row, status: "open" });
  const stances: Record<string, { lean: number; price?: { any_of: string[]; sets: number; note: string } | null }> = {
    vale: { lean: -0.9 },
    ely: { lean: 0.5, price: { any_of: ["pgs.29_sep_run_unauthorized_noticed", "harvest.lot_77b_unsigned_noticed"], sets: 0.9, note: "shown that 77-B went out under nobody's signature, she wants it on the record before it is on her" } },
    kovic: { lean: 0, price: { any_of: ["r1.fragment_in_sheriff_locker", "cases.one_closed_as_ordnance", "r1.fragment_never_referred_noticed"], sets: 0.8, note: "told there is a fragment in a county locker, he wants it in his lab and will vote for whatever gets the sheriff talking" } },
    ethorne: { lean: -0.4 },
    jthorne: { lean: -0.6 },
  };
  for (const [slug, st] of Object.entries(stances)) await db.from("facts").upsert({ campaign_id: cid, key: `motion.${number}.stance.${slug}`, value: st, established_round: 15, secret: true }, { onConflict: "campaign_id,key" });
  console.log(`motion ${number} on the Research Committee, opens round 23, closes round 27; stances: ${Object.keys(stances).join(", ")}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
