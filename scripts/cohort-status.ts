/* Where cohorts stand and what autoscale would do now. Read-only.
     pnpm tsx scripts/cohort-status.ts */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { openCohorts } from "../src/lib/game/cohorts";
import { ensureSeats, loadPolicy, nextStart } from "../src/lib/game/autoscale";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const p = await loadPolicy(db);
  const open = await openCohorts(db);
  const { count: waiting } = await db.from("cohort_waitlist").select("player_id", { count: "exact", head: true }).is("notified_at", null);
  console.log(`Policy: ${p.enabled ? "on" : "off"}, cap ${p.player_cap}, size ${p.cohort_size}, opens below ${p.min_free_seats} free seats, waitlist letters ${p.notify_waitlist ? "on" : "off"}.`);
  console.log(`Open to applicants (fill order): ${open.map((c) => `${c.slug} ${c.seats_taken}/${c.cohort_size}`).join(" → ") || "none"}`);
  console.log(`Waiting: ${waiting ?? 0}. Next start slot: ${nextStart(p).toISOString()}.`);
  const r = await ensureSeats(db, new Date(), { dryRun: true });
  console.log(`Autoscale now: ${r.action === "none" ? r.reason : "would open"} (free ${r.free}, live ${r.live}).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
