/* Remove a simulated cohort and its synthetic players.
     pnpm tsx scripts/sim-drop.ts <slug> */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const slug = process.argv[2];
  if (!slug || !slug.startsWith("sim-")) { console.log("usage: sim-drop <sim-slug>"); process.exit(2); }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: c } = await db.from("campaigns").select("id").eq("slug", slug).maybeSingle();
  if (!c) { console.log("no such cohort"); return; }
  const { data: chars } = await db.from("characters").select("id").eq("campaign_id", c.id);
  const ids = (chars ?? []).map((x) => x.id as string);
  // Rows that point at characters without cascading, then the campaign (which cascades the rest).
  for (const t of ["votes", "election_votes", "knowledge", "case_items", "case_notes", "assets", "relationships", "standing_orders", "declarations", "presence", "character_goals", "memberships"]) {
    const col = t === "votes" || t === "election_votes" ? (t === "votes" ? "character_id" : "voter_id") : t === "relationships" ? "from_character" : t === "declarations" ? "from_character" : t === "assets" ? "holder_id" : "character_id";
    if (ids.length) await db.from(t).delete().in(col, ids);
    if (t === "relationships" && ids.length) await db.from(t).delete().in("to_character", ids);
    if (t === "declarations" && ids.length) await db.from(t).delete().in("to_character", ids);
  }
  await db.from("motions").delete().eq("campaign_id", c.id);
  await db.from("correspondence").delete().eq("campaign_id", c.id);
  await db.from("events").delete().eq("campaign_id", c.id);
  await db.from("campaigns").delete().eq("id", c.id);
  await db.from("players").delete().like("email", `${slug}-p%@example.test`);
  console.log(`dropped ${slug}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
