/* Make a new cohort from a template campaign.
     pnpm tsx scripts/new-cohort.ts <slug> "<title>" [--start 2026-11-02T13:00:00Z] [--size 12] [--template <campaign id>]
   The template defaults to CAMPAIGN_ID. The cohort is created recruiting; it
   goes active and opens Round 1 at its start (the morning cron) once at least
   one application is approved. */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { cloneCampaign } from "../src/lib/game/cohorts";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const args = process.argv.slice(2);
  const [slug, title] = args;
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  if (!slug || !title) { console.log('usage: new-cohort <slug> "<title>" [--start ISO] [--size n] [--template id]'); process.exit(2); }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const id = await cloneCampaign(db, { templateId: opt("--template") ?? process.env.CAMPAIGN_ID!, slug, title, cohortSize: opt("--size") ? Number(opt("--size")) : undefined, scheduledStart: opt("--start") ?? null });
  const counts = await Promise.all(["divisions", "organizations", "rules", "characters", "memberships", "motions", "facts"].map(async (t) => {
    const q = t === "memberships" ? db.from("memberships").select("organization_id", { count: "exact", head: true }).in("organization_id", (await db.from("organizations").select("id").eq("campaign_id", id)).data?.map((o) => o.id) ?? []) : db.from(t).select("id", { count: "exact", head: true }).eq("campaign_id", id);
    return [t, (await q).count];
  }));
  console.log(`cohort ${slug} (${id}) recruiting${opt("--start") ? `, starts ${opt("--start")}` : ""}:`, Object.fromEntries(counts));
}
main().catch((e) => { console.error(e); process.exit(1); });
