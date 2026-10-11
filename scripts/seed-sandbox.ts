/* A throwaway season for looking at the showrunner console with data in it.
   Everything it makes is obviously fake and lives under campaign slug
   "sandbox" and players @example.test, so it never mixes with canon.
     pnpm seed:sandbox          create (replaces an earlier sandbox)
     pnpm seed:sandbox --drop   remove it all */
import { config as loadEnv } from "dotenv";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: join(resolve(import.meta.dirname, ".."), ".env.local") });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const must = async <T>(p: PromiseLike<{ data: unknown; error: { message: string } | null }>, what: string) => {
  const { data, error } = await p; if (error) throw new Error(`${what}: ${error.message}`); return data as T;
};

async function drop() {
  const { data: c } = await db.from("campaigns").select("id").eq("slug", "sandbox").maybeSingle();
  if (c) {
    // votes and letters point at characters without cascading; clear them first
    await must(db.from("motions").delete().eq("campaign_id", c.id), "motions");
    await must(db.from("correspondence").delete().eq("campaign_id", c.id), "mail");
    await must(db.from("campaigns").delete().eq("id", c.id), "campaign");
  }
  await must(db.from("players").delete().like("email", "%@example.test"), "players");
  await must(db.from("model_ledger").delete().eq("tag", "sandbox"), "ledger");
  await must(db.from("jobs").delete().contains("payload", { sandbox: true }), "jobs");
  await must(db.from("cron_runs").delete().contains("detail", { sandbox: true }), "cron");
}

async function create() {
  await drop();
  const DAY = 86400_000;
  const now = Date.now();
  // Day 1 opened 9 days ago at 13:00 UTC (09:00 New York); locks at 00:00 UTC (20:00 New York).
  const start = Math.floor(now / DAY) * DAY - 9 * DAY + 13 * 3600_000;
  const c = await must<{ id: string }>(db.from("campaigns").insert({ slug: "sandbox", title: "Sandbox (test data)", status: "active" }).select("id").single(), "campaign");
  const eps = await must<{ id: string; number: number }[]>(db.from("episodes").insert([1, 2].map((n) => ({ campaign_id: c.id, number: n, title: `Sandbox Episode ${n}`, premise: "Test data for the console.", starts_round: (n - 1) * 14 + 1, status: n === 1 ? "active" : "planned" }))).select("id, number"), "episodes");
  const TODAY = 10;
  const rounds = await must<{ id: string; number: number }[]>(db.from("rounds").insert(Array.from({ length: 28 }, (_, i) => {
    const n = i + 1; const opens = start + i * DAY;
    return { campaign_id: c.id, episode_id: eps[n <= 14 ? 0 : 1].id, number: n, episode_round: ((n - 1) % 14) + 1, opens_at: new Date(opens).toISOString(), locks_at: new Date(opens + 11 * 3600_000).toISOString(), status: n < TODAY ? "resolved" : n === TODAY ? "open" : "scheduled", resolved_at: n < TODAY ? new Date(opens + 12 * 3600_000).toISOString() : null };
  })).select("id, number"), "rounds");
  const R = (n: number) => rounds.find((r) => r.number === n)!.id;

  const players = await must<{ id: string; email: string }[]>(db.from("players").insert(Array.from({ length: 6 }, (_, i) => ({ email: `test${String(i + 1).padStart(2, "0")}@example.test`, display_name: `Tester ${i + 1}`, consent_ai_processing_at: new Date(start).toISOString() }))).select("id, email"), "players");
  await must(db.from("subscriptions").insert(players.map((p, i) => ({ player_id: p.id, plan: i === 5 ? "comp" : "season-pass", status: ["active", "active", "trialing", "past_due", "canceled", "comp"][i], amount_cents: i === 5 ? 0 : 1500, started_at: new Date(start - 5 * DAY).toISOString(), current_period_end: new Date(start + 25 * DAY).toISOString(), provider: "manual" }))), "subs");
  const chars = await must<{ id: string; slug: string; player_id: string | null }[]>(db.from("characters").insert([
    ...players.map((p, i) => ({ campaign_id: c.id, player_id: p.id, slug: `tester${i + 1}`, name: `Test Employee ${i + 1}`, title: "Junior Analyst", clearance: 1, status: "active", specialization: ["analyst", "negotiator", "operative", "administrator", "analyst", "operative"][i] })),
    { campaign_id: c.id, slug: "npc-a", name: "Test NPC Alpha", title: "Committee Chair", clearance: 4, status: "active" },
    { campaign_id: c.id, slug: "npc-b", name: "Test NPC Beta", title: "Auditor", clearance: 3, status: "missing" },
  ]).select("id, slug, player_id"), "characters");
  const pcs = chars.filter((x) => x.player_id); const npcA = chars.find((x) => x.slug === "npc-a")!;
  const org = await must<{ id: string }>(db.from("organizations").insert({ campaign_id: c.id, slug: "sandbox-council", name: "Sandbox Council", kind: "council", charter: { method: "majority_of_votes" } }).select("id").single(), "org");
  await must(db.from("memberships").insert([...pcs.slice(0, 5), npcA].map((x) => ({ organization_id: org.id, character_id: x.id }))), "members");

  const motions = await must<{ id: string; closes_round: number; status: string }[]>(db.from("motions").insert([
    { campaign_id: c.id, organization_id: org.id, number: "T-001", title: "Test motion: adopt the agenda", kind: "governance", sponsor_id: npcA.id, threshold: { method: "majority_of_votes" }, opens_round: 2, closes_round: 4, status: "passed" },
    { campaign_id: c.id, organization_id: org.id, number: "T-002", title: "Test motion: audit the test ledger", kind: "investigative", sponsor_id: pcs[0].id, threshold: { method: "majority_of_seats" }, opens_round: 5, closes_round: 7, status: "failed" },
    { campaign_id: c.id, organization_id: org.id, number: "T-003", title: "Test motion: open today", kind: "allocation", sponsor_id: pcs[1].id, threshold: { method: "supermajority", fraction: 0.67 }, opens_round: 8, closes_round: TODAY, status: "open" },
    { campaign_id: c.id, organization_id: org.id, number: "T-004", title: "Test motion: closes tomorrow", kind: "governance", sponsor_id: pcs[2].id, threshold: { method: "majority_of_votes" }, opens_round: 9, closes_round: TODAY + 1, status: "open" },
  ]).select("id, closes_round, status"), "motions");
  const choices: Record<number, string[]> = { 0: ["for", "for", "against", "for", "abstain", "for"], 1: ["for", "against", "against", "for", "against", "against"], 2: ["for", "for", "against"], 3: ["against"] };
  const voters = [...pcs.slice(0, 5), npcA];
  await must(db.from("votes").insert(motions.flatMap((m, i) => choices[i].map((ch, k) => ({ motion_id: m.id, character_id: voters[k].id, choice: ch, cast_round: m.closes_round - 1, source: k === 5 ? "web" : "email_grammar" })))), "votes");
  await must(db.from("events").insert(motions.filter((m) => m.status !== "open").map((m) => ({ campaign_id: c.id, round_id: R(m.closes_round), phase: "governance", kind: "motion.closed", payload: { motion_id: m.id, passed: m.status === "passed" }, idempotency_key: `sandbox:motion:${m.id}` }))), "events");
  await must(db.from("events").insert(Array.from({ length: TODAY - 1 }, (_, i) => ["lock", "validate", "send"].map((ph) => ({ campaign_id: c.id, round_id: R(i + 1), phase: ph, kind: ph === "lock" ? "round.locked" : "phase.done", payload: {}, idempotency_key: `sandbox:${ph}:${i + 1}` }))).flat()), "phase events");

  for (let n = 1; n < TODAY; n++) {
    const packets = await must<{ id: string; character_id: string }[]>(db.from("order_packets").insert(pcs.map((x, i) => ({ round_id: R(n), character_id: x.id, mode: i === 4 && n > 3 ? "missed" : i === 3 && n % 3 === 0 ? "hold" : "orders", source: i === 4 && n > 3 ? "default" : "email" }))).select("id, character_id"), "packets");
    const withOrders = packets.filter((p, i) => !(i === 4 && n > 3) && !(i === 3 && n % 3 === 0));
    await must(db.from("orders").insert(withOrders.map((p, i) => ({ packet_id: p.id, seq: 1, verb: ["investigate", "request_files", "surveil", "recruit", "travel", "investigate"][i % 6], args: { text: `test target ${n}` }, status: "resolved" }))), "orders");
  }
  await must(db.from("correspondence").insert(Array.from({ length: 24 }, (_, i) => {
    const from = pcs[i % 5]; const to = i % 3 === 0 ? npcA : pcs[(i + 1) % 5]; const n = (i % (TODAY - 1)) + 1;
    return { campaign_id: c.id, round_id: R(n), direction: "inbound", from_character: from.id, to_characters: [to.id], from_address: `test${(i % 5) + 1}@example.test`, subject: `Test letter ${i + 1}`, body_text: `This is test correspondence number ${i + 1}. I propose we vote together on T-00${(i % 4) + 1}.`, trusted: true, received_at: new Date(start + n * DAY - 3600_000).toISOString() };
  })), "mail");
  await must(db.from("model_ledger").insert(Array.from({ length: 30 }, (_, i) => ({ tag: "sandbox", model: ["qwen/qwen3.8-27b", "qwen/qwen3.6-35b-a3b", "qwen/qwen3.8-flash-next"][i % 3], ok: i % 3 !== 0, status: i % 3 === 0 ? 429 : 200, ms: 800 + i * 137, prompt_tokens: i % 3 ? 900 + i * 10 : null, completion_tokens: i % 3 ? 200 + i : null, error: i % 3 === 0 ? "answered 429" : null, created_at: new Date(now - i * 40 * 60_000).toISOString() }))), "ledger");
  await must(db.from("jobs").insert([
    { kind: "extract", payload: { sandbox: true }, run_after: new Date(now - 3700_000).toISOString(), attempts: 0, error: null, locked_at: null, done_at: new Date(now - 3600_000).toISOString() },
    { kind: "extract", payload: { sandbox: true }, run_after: new Date(now + 10 * 60_000).toISOString(), attempts: 2, error: "qwen/qwen3.8-27b answered 429", locked_at: null, done_at: null },
    { kind: "send", payload: { sandbox: true }, run_after: new Date(now - 7300_000).toISOString(), locked_at: null, attempts: 5, error: "RESEND_API_KEY not set", done_at: new Date(now - 7200_000).toISOString() },
  ]), "jobs");
  await must(db.from("cron_runs").insert([
    { route: "tick", started_at: new Date(now - 14 * 3600_000).toISOString(), finished_at: new Date(now - 14 * 3600_000 + 2000).toISOString(), ok: true, detail: { sandbox: true, locked: TODAY - 1 } },
    { route: "work", started_at: new Date(now - 45_000).toISOString(), finished_at: new Date(now - 44_000).toISOString(), ok: true, detail: { sandbox: true, done: 0 } },
  ]), "cron");
  console.log(`✓ sandbox season ${c.id}: 2 episodes, 28 days (today = day ${TODAY}), 6 players, 4 motions`);
}

(process.argv.includes("--drop") ? drop().then(() => console.log("✓ sandbox removed")) : create()).catch((e) => { console.error("✗", e.message); process.exit(1); });
