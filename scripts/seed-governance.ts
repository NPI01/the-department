/* Seats, the Round 7 motion, and directors' leans (canon/secret/06 and /07).
     pnpm tsx scripts/seed-governance.ts     re-runnable */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const cid = process.env.CAMPAIGN_ID!;
  // Walter Crane, outside director (PROPOSED in 06).
  await db.from("characters").upsert({ campaign_id: cid, slug: "crane", name: "Walter Crane", title: "Outside Director, Royce Industries", division_id: null, clearance: 4, status: "active", public_profile: "The 1969 investor. Sits on the Board from Minneapolis and reads Dr. Vale's reports before the Board does. Instrumental by temperament: what does it cost, what does it return.", npc_state: { listed: true, letterhead: { name: "Walter Crane", place: "Minneapolis, Minnesota" }, voice: { register: "Dry, commercial, courteous", rules: ["Short paragraphs.", "Asks what a thing costs and what it returns.", "Never raises his voice on paper."], phrases: ["I read the numbers.", "What does it return?", "Put it in a memorandum."], signoff: "W. Crane" }, wants_from_newcomer: "Evidence of the company's financial exposure, in writing, from someone with nothing to gain by it.", will_trade: ["His vote, for evidence that money is being lost", "A seat on the Research Committee for a nominee"], never_says: ["How much he invested in 1969", "What Vale told him"], ladder: { episode_1: "He acknowledges a letter and asks one question about money.", episode_2: "He will say which way he leans and what would move him.", episode_3: "He names what he fears the company is becoming." } } }, { onConflict: "campaign_id,slug" });
  const { data: chars } = await db.from("characters").select("id, slug").eq("campaign_id", cid);
  const id = (slug: string) => { const c = (chars ?? []).find((x) => x.slug === slug); if (!c) throw new Error(`no character ${slug}`); return c.id as string; };
  const { data: orgs } = await db.from("organizations").select("id, name").eq("campaign_id", cid);
  const org = (name: string) => { const o = (orgs ?? []).find((x) => x.name === name); if (!o) throw new Error(`no org ${name}`); return o.id as string; };
  const seats: [string, string, string][] = [
    ["Board of Directors", "royce", "Chairman"], ["Board of Directors", "vale", "Chief Scientist"], ["Board of Directors", "hensley", "CFO"], ["Board of Directors", "sloane", "Security"], ["Board of Directors", "baines", "Defense liaison"], ["Board of Directors", "armitage", "Personnel"], ["Board of Directors", "crane", "Outside director"],
    ["Research Committee", "vale", "Chair"], ["Research Committee", "ely", "Biological"], ["Research Committee", "kovic", "Applied Physics"], ["Research Committee", "ethorne", "Materials"], ["Research Committee", "jthorne", "Information Systems"],
    ["Safety Committee", "sloane", "Chair"], ["Safety Committee", "armitage", "Personnel"], ["Safety Committee", "baines", "Aerospace"], ["Safety Committee", "hensley", "Finance"], ["Safety Committee", "voss", "Procurement"],
  ];
  const { error: e1 } = await db.from("memberships").upsert(seats.map(([o, slug, role]) => ({ organization_id: org(o), character_id: id(slug), role, voting_weight: 1, since_round: 1 })), { onConflict: "organization_id,character_id" });
  if (e1) throw e1;
  // B-77-001, sponsored by Hensley, closes Round 7.
  const motionRow = { campaign_id: cid, organization_id: org("Board of Directors"), number: "B-77-001", title: "Departmental Reporting Reform", kind: "governance", sponsor_id: id("hensley"), threshold: { method: "majority_of_votes" }, opens_round: 2, closes_round: 7, text: "That the Department of Special Research and Development report to the Board through the Chief Financial Officer; that all DSRD requisitions over $5,000 require Finance countersignature; and that the Research Committee receive DSRD's project list." };
  const { data: existing } = await db.from("motions").select("id, number").eq("campaign_id", cid).eq("number", "B-77-001").maybeSingle();
  const { data: motion, error: e2 } = existing ? await db.from("motions").update(motionRow).eq("id", existing.id).select("id, number").single() : await db.from("motions").insert({ ...motionRow, status: "open" }).select("id, number").single();
  if (e2) throw e2;
  const stances: Record<string, { lean: number; price?: { any_of: string[]; sets: number; note: string } | null }> = {
    hensley: { lean: 1 }, sloane: { lean: 0.6 }, armitage: { lean: 0.5 },
    royce: { lean: -1 }, vale: { lean: -0.8 },
    baines: { lean: -0.5, price: { any_of: ["harvest.lot_77b_unsigned_noticed", "flight.77on_landing_unrecorded_noticed", "pma.night_run_seen"], sets: 0.6, note: "shown that the night flights serve sampling runs he never signed for; he turns" } },
    crane: { lean: 0, price: { any_of: ["pgs.concrete_to_empty_parcel_noticed", "finance.overrun_noticed", "finance.appropriation_77s_exists", "pgs.invoices_1974_exist"], sets: 0.8, note: "shown money leaving without a return; he comes over" } },
  };
  for (const [slug, st] of Object.entries(stances)) await db.from("facts").upsert({ campaign_id: cid, key: `motion.${motion!.number}.stance.${slug}`, value: st, established_round: 1, secret: true }, { onConflict: "campaign_id,key" });
  console.log(`seats: ${seats.length}; motion ${motion!.number} open, closes round 7; stances: ${Object.keys(stances).join(", ")}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
