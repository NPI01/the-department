/* Add or update the Episode 2 cast and load cast sheets into characters.npc_state.
     pnpm tsx scripts/seed-cast.ts            upsert the characters below
     pnpm tsx scripts/seed-cast.ts <sheets.json>   also load npc_state from a JSON map {slug: sheet}
   Re-runnable. Public profiles come from canon/02-personnel-directory.md. */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const cid = process.env.CAMPAIGN_ID!;
  const { data: divs } = await db.from("divisions").select("id, slug").eq("campaign_id", cid);
  const div = Object.fromEntries((divs ?? []).map((d) => [d.slug, d.id]));

  // slug, name, title, division slug (null = off campus), clearance, public profile
  const cast: [string, string, string, string | null, number, string][] = [
    ["hollis", "Sheriff Dale Hollis", "Sheriff, Ward County", null, 0, "58-year-old lawman. Fixes his own cars, attends football games. Treats Royce with polite distance; considers the company a necessary economic engine."],
    ["vane", "Gary Vane", "Owner, Vane Cattle Co.", null, 0, "Fourth-generation rancher north of Tagus. Vocal in the local papers about strange goings-on. Sells hay to the company."],
    ["bernard", "Elmer Bernard", "Caretaker, St. Olaf Lutheran Church, Tagus", null, 0, "72. The last year-round resident of Tagus. Keeps the cemetery. Considered harmless and eccentric; says he knows the old stories."],
    ["bradley", "Capt. Thomas Bradley", "Chief Pilot, Prairie Meridian Aviation", null, 0, "Former Navy aviator. Runs the night flight contract. Professional, discreet, expensive. Calls the flights calibration runs."],
    ["doyle", "Tech. Sgt. Arthur Doyle", "Radar Technician, Minot Air Force Base", null, 0, "Low-level radar technician who runs the radio club in town. Friendly, eager to be liked. Trades harmless gossip for favours."],
    ["okafor", "Maya Okafor", "Clerk, Procurement & Logistics", "procurement-logistics", 1, "Two years at Station R, in the office that signs for everything that arrives. The one person a new hire can buy lunch for. Has seen two versions of the campus map."],
  ];
  const rows = cast.map(([slug, name, title, d, clearance, public_profile]) => ({ campaign_id: cid, slug, name, title, division_id: d ? div[d] : null, clearance, status: "active", public_profile }));
  const { error } = await db.from("characters").upsert(rows, { onConflict: "campaign_id,slug", ignoreDuplicates: false });
  if (error) throw error;
  console.log(`cast: ${rows.length} characters upserted`);

  const sheetsPath = process.argv[2];
  if (sheetsPath) {
    const sheets = JSON.parse(readFileSync(sheetsPath, "utf8")) as Record<string, Record<string, unknown>>;
    let n = 0;
    for (const [slug, sheet] of Object.entries(sheets)) {
      const { error: e, count } = await db.from("characters").update({ npc_state: sheet }, { count: "exact" }).eq("campaign_id", cid).eq("slug", slug);
      if (e) throw e; if (!count) console.warn(`  no character with slug ${slug}`); else n++;
    }
    console.log(`npc_state loaded for ${n} characters`);
  }

}
main().catch((e) => { console.error(e); process.exit(1); });
