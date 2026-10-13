/* Round operations by hand.
     pnpm tsx scripts/round-ops.ts open            open the next round now (if none is open)
     pnpm tsx scripts/round-ops.ts dispatch        queue morning dispatches for the open round
     pnpm tsx scripts/round-ops.ts reresolve <n>   re-run the resolution phases for round n
     pnpm tsx scripts/round-ops.ts work            drain the production worker once */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { openNextRound, queueMorningDispatches } from "../src/lib/engine/rounds";
import { PHASES } from "../src/lib/engine/phases";
import { deliverScheduledMail } from "../src/lib/engine/scripted";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const cid = process.env.CAMPAIGN_ID!;
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "open") { const r = await openNextRound(db, cid); console.log(r.opened ? `opened round ${r.round.number}, locks ${r.round.locks_at}` : `round ${r.round.number} already open`); }
  else if (cmd === "mail") {
    const { data: open } = await db.from("rounds").select("id, number, episode_round, episode_id").eq("campaign_id", cid).eq("status", "open").maybeSingle();
    if (!open) throw new Error("no open round; run open first");
    const { data: ep } = await db.from("episodes").select("number").eq("id", open.episode_id).maybeSingle();
    console.log(`scheduled mail delivered: ${(await deliverScheduledMail(db, cid, { id: open.id, number: open.number, episodeRound: open.episode_round ?? open.number, episodeNumber: (ep?.number as number | undefined) ?? 1 })).delivered}`);
  } else if (cmd === "dispatch") {
    const { data: open } = await db.from("rounds").select("id, number").eq("campaign_id", cid).eq("status", "open").maybeSingle();
    if (!open) throw new Error("no open round; run open first");
    console.log(`queued ${await queueMorningDispatches(db, cid, open.id)} dispatch(es) for round ${open.number}`);
  } else if (cmd === "reresolve") {
    // reresolve <n> [strategic]: all phases (charges again), or only the strategic phase (outcomes only).
    const only = process.argv[4];
    const { data: r } = await db.from("rounds").select("id, number, status").eq("campaign_id", cid).eq("number", Number(arg)).single();
    if (!r) throw new Error("no such round");
    const packetIds = (await db.from("order_packets").select("id").eq("round_id", r.id)).data?.map((p) => p.id) ?? [];
    if (only === "strategic") {
      await db.from("events").delete().eq("idempotency_key", `phase:${r.id}:strategic`);
      await db.from("events").delete().eq("round_id", r.id).eq("kind", "order.resolved");
      await db.from("orders").update({ status: "reserved", ruling: null }).in("packet_id", packetIds).eq("status", "resolved");
      await db.from("jobs").insert({ kind: "tick_phase", payload: { round_id: r.id, phase: "strategic", seq: 3 } });
      console.log(`round ${r.number}: strategic phase re-queued (outcomes only)`);
    } else {
      await db.from("events").delete().eq("round_id", r.id).in("kind", ["phase.done", "order.resolved"]);
      await db.from("orders").update({ status: "pending", ruling: null }).in("packet_id", packetIds).neq("status", "pending");
      await db.from("rounds").update({ status: "locked", resolved_at: null }).eq("id", r.id);
      await db.from("jobs").insert(PHASES.map((phase, i) => ({ kind: "tick_phase", payload: { round_id: r.id, phase, seq: i } })));
      console.log(`round ${r.number}: phases re-queued`);
    }
  } else if (cmd === "work") {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://weird.delivery"}/api/cron/work`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
    console.log(res.status, await res.text());
  } else { console.log("usage: open | mail | dispatch | reresolve <n> [strategic] | work"); process.exit(2); }
}
main().catch((e) => { console.error(e); process.exit(1); });
