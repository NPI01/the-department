/* Episode 03 governance: the Safety Committee ballot on internal surveillance.
   Episode 3 is rounds 29–42; day 6 is round 34, day 11 is round 39.
     pnpm tsx scripts/seed-episode-03.ts     re-runnable */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const cid = process.env.CAMPAIGN_ID!;
  const { data: chars } = await db.from("characters").select("id, slug").eq("campaign_id", cid);
  const id = (slug: string) => { const c = (chars ?? []).find((x) => x.slug === slug); if (!c) throw new Error(`no character ${slug}`); return c.id as string; };
  const { data: org } = await db.from("organizations").select("id").eq("campaign_id", cid).eq("name", "Safety Committee").single();
  const number = "S-77-003";
  const row = { campaign_id: cid, organization_id: org!.id, number, title: "Authorization of Internal Surveillance", kind: "governance", sponsor_id: id("sloane"), threshold: { method: "majority_of_votes" }, opens_round: 34, closes_round: 39, text: "That Corporate Security be authorized to place named employees under surveillance on and off company property, to inspect their correspondence passing through the mail room, and to suspend clearances pending interview, for a period of sixty days." };
  const { data: ex } = await db.from("motions").select("id").eq("campaign_id", cid).eq("number", number).maybeSingle();
  if (ex) await db.from("motions").update(row).eq("id", ex.id); else await db.from("motions").insert({ ...row, status: "open" });
  const stances: Record<string, { lean: number; price?: { any_of: string[]; sets: number; note: string } | null }> = {
    sloane: { lean: 1 },
    baines: { lean: 0.5, price: { any_of: ["sec.diagram_forged_noticed", "sec.pamphlet_date_forgery_noticed"], sets: -0.6, note: "shown that the exhibits are the company's own work, he will not put his name to it" } },
    voss: { lean: 0.3 },
    hensley: { lean: -0.4, price: { any_of: ["sec.pamphlet_date_forgery_noticed", "sec.symbol_traced_from_1883_noticed"], sets: -1, note: "given the forgery in writing, she votes it down and says why" } },
    armitage: { lean: -1 },
  };
  for (const [slug, st] of Object.entries(stances)) await db.from("facts").upsert({ campaign_id: cid, key: `motion.${number}.stance.${slug}`, value: st, established_round: 29, secret: true }, { onConflict: "campaign_id,key" });
  console.log(`motion ${number} on the Safety Committee, opens round 34, closes round 39; stances: ${Object.keys(stances).join(", ")}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
