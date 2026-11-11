/* One-off: the frozen Season 1 template and the first patron cohorts. Safe to re-run.
     pnpm tsx scripts/setup-patron-cohorts.ts [--start 2026-11-16T13:00:00Z] [--count 3]
   1. If cohort_policy has no template, copy The Pilot (CAMPAIGN_ID) into "template-season-1",
      park it at status 'draft' (never recruited or dispatched) with the Showrunner's Room in
      shadow, and point the policy at it. The Pilot itself is only read.
   2. Make Patron Cohort A, B, C… from the template (skips any that exist), recruiting, starting
      at --start, sized by the policy. */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { cloneCampaign } from "../src/lib/game/cohorts";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const start = opt("--start") ?? "2026-11-16T13:00:00Z";
  const count = Number(opt("--count") ?? 3);
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: policy } = await db.from("cohort_policy").select("*").eq("id", 1).single();
  if (!policy) throw new Error("cohort_policy row missing (migration 0023).");

  let templateId = policy.template_campaign_id as string | null;
  if (!templateId) {
    const pilot = process.env.CAMPAIGN_ID!;
    templateId = await cloneCampaign(db, { templateId: pilot, slug: "template-season-1", title: "Template: Season 1 (not played)", cohortSize: policy.cohort_size });
    await db.from("campaigns").update({ status: "draft", scheduled_start: null }).eq("id", templateId);
    await db.from("rules").update({ value: "shadow" }).eq("campaign_id", templateId).eq("key", "room.mode");
    await db.from("cohort_policy").update({ template_campaign_id: templateId, updated_at: new Date().toISOString() }).eq("id", 1);
    console.log(`template-season-1 (${templateId}) made from The Pilot, parked as draft, Room in shadow.`);
  } else {
    console.log(`Template already set: ${templateId}`);
  }

  for (let i = 0; i < count; i++) {
    const letter = String.fromCharCode(65 + i);
    const slug = `${policy.slug_prefix}-${letter.toLowerCase()}`;
    const { data: exists } = await db.from("campaigns").select("id, status").eq("slug", slug).maybeSingle();
    if (exists) { console.log(`${slug} exists (${exists.status}), skipped.`); continue; }
    const id = await cloneCampaign(db, { templateId, slug, title: `${policy.title_prefix} ${letter}`, cohortSize: policy.cohort_size, scheduledStart: start });
    console.log(`${slug} (${id}): ${policy.title_prefix} ${letter}, recruiting, ${policy.cohort_size} seats, starts ${start}.`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
