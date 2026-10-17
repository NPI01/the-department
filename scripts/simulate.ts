/* A simulated season: a sandbox cohort of synthetic players plays rounds
   against the real engine, with no waiting and no mail sent.

     pnpm tsx scripts/simulate.ts --players 6 --rounds 14 [--slug sim-oct17] [--resume <campaign id>]

   Each round: the morning (open the round, scheduled mail, notices,
   invitations, the paper, the newsletter, dispatches) → the worker drains →
   every player takes a turn (src/lib/sim/players.ts) → the worker drains →
   the lock and every phase → the worker drains → a round report. Only this
   cohort's jobs are run here; delays on its jobs are collapsed. The report
   goes to docs/agent-runs/<slug>.md as it runs; transcripts per player at
   the end. The cohort is left in place, status "complete", for inspection
   (scripts/sim-drop.ts removes it). */
import { config } from "dotenv";
import { resolve } from "node:path";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { cloneCampaign, startDueCohorts } from "../src/lib/game/cohorts";
import { approveApplication, firstMemo } from "../src/lib/engine/onboarding";
import { openNextRound, queueMorningDispatches } from "../src/lib/engine/rounds";
import { deliverScheduledMail } from "../src/lib/engine/scripted";
import { deliverBallotNotices } from "../src/lib/engine/ballots";
import { issueInvitations } from "../src/lib/engine/societies";
import { publishBulletin } from "../src/lib/engine/bulletin";
import { publishNewsletter } from "../src/lib/engine/newsletter";
import { PHASES } from "../src/lib/engine/phases";
import { runJob } from "../src/lib/engine/jobs";
import { episodeOf } from "../src/lib/engine/world";
import { PERSONAS, playerTurn } from "../src/lib/sim/players";
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
process.env.MAIL_SINK = "1";

const args = process.argv.slice(2);
const opt = (k: string, d?: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const N = Number(opt("--players", "6")); const R = Number(opt("--rounds", "14"));
const slug = opt("--slug", `sim-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}`)!;
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const t0 = Date.now();
const stamp = () => `${((Date.now() - t0) / 60000).toFixed(1).padStart(6)}m`;
const log = (s: string) => console.log(`[${stamp()}] ${s}`);
mkdirSync("docs/agent-runs", { recursive: true });
const reportPath = `docs/agent-runs/${slug}.md`;
const report = (s: string) => appendFileSync(reportPath, s + "\n");
const ledger = async (r: { tag: string; model: string; ok: boolean; status: number | null; ms: number; usage: { prompt_tokens: number; completion_tokens: number } | null; error: string | null }) => { await db.from("model_ledger").insert({ tag: r.tag, model: r.model, ok: r.ok, status: r.status, ms: r.ms, prompt_tokens: r.usage?.prompt_tokens ?? null, completion_tokens: r.usage?.completion_tokens ?? null, error: r.error }); };

type Player = { id: string; name: string; email: string; mailToken: string; persona: (typeof PERSONAS)[number] };

async function setup(): Promise<{ cid: string; players: Player[] }> {
  const resume = opt("--resume");
  if (resume) {
    const { data: chars } = await db.from("characters").select("id, name, players(email, mail_token)").eq("campaign_id", resume).not("player_id", "is", null).order("created_at");
    const players: Player[] = (chars ?? []).map((c, i) => { const pl = (Array.isArray(c.players) ? c.players[0] : c.players) as { email: string; mail_token: string }; return { id: c.id as string, name: c.name as string, email: pl.email, mailToken: pl.mail_token, persona: PERSONAS.find((p) => p.name === c.name) ?? PERSONAS[i % PERSONAS.length] }; });
    log(`resuming ${resume} with ${players.length} players`);
    return { cid: resume, players };
  }
  const cid = await cloneCampaign(db, { templateId: process.env.CAMPAIGN_ID!, slug, title: `Simulation ${slug}`, cohortSize: N, scheduledStart: new Date().toISOString() });
  log(`cohort ${slug} = ${cid}`);
  const players: Player[] = [];
  for (const [i, persona] of PERSONAS.slice(0, N).entries()) {
    const email = `${slug}-p${i + 1}@example.test`;
    const { data: pl, error } = await db.from("players").insert({ email, display_name: persona.name, consent_ai_processing_at: new Date().toISOString() }).select("id, mail_token").single();
    if (error) throw new Error(`player: ${error.message}`);
    const { data: app, error: e2 } = await db.from("applications").insert({ player_id: pl.id, campaign_id: cid, status: "submitted", name: persona.name, bio: persona.bio, identity: persona.identity, specialization: persona.specialization, dept_prefs: persona.dept_prefs, skills: persona.skills, knowledge: persona.knowledge, points_total: 10, points_spent: 6, timezone: "America/Chicago" }).select("id").single();
    if (e2) throw new Error(`application: ${e2.message}`);
    await approveApplication(db, app.id as string);
    await firstMemo(db, app.id as string);
    const { data: ch } = await db.from("characters").select("id, name").eq("player_id", pl.id).single();
    players.push({ id: ch!.id as string, name: ch!.name as string, email, mailToken: pl.mail_token as string, persona });
    log(`hired ${persona.name} as ${ch!.name}`);
  }
  const started = await startDueCohorts(db);
  log(`started: ${started.join(", ") || "(already)"}`);
  return { cid, players };
}

/* Only this cohort's jobs, with their delays collapsed. */
async function simIds(cid: string) {
  const [{ data: rounds }, { data: chars }, { data: mail }, { data: apps }] = await Promise.all([
    db.from("rounds").select("id").eq("campaign_id", cid), db.from("characters").select("id").eq("campaign_id", cid),
    db.from("correspondence").select("id").eq("campaign_id", cid), db.from("applications").select("id").eq("campaign_id", cid),
  ]);
  return { rounds: new Set((rounds ?? []).map((r) => r.id as string)), chars: new Set((chars ?? []).map((c) => c.id as string)), mail: new Set((mail ?? []).map((m) => m.id as string)), apps: new Set((apps ?? []).map((a) => a.id as string)) };
}
function mine(payload: Record<string, unknown>, ids: Awaited<ReturnType<typeof simIds>>, cid: string) {
  const p = payload as { campaign_id?: string; round_id?: string; character_id?: string; correspondence_id?: string; application_id?: string; brief_id?: string };
  return p.campaign_id === cid || (p.round_id && ids.rounds.has(p.round_id)) || (p.correspondence_id && ids.mail.has(p.correspondence_id)) || (p.character_id && ids.chars.has(p.character_id)) || (p.application_id && ids.apps.has(p.application_id));
}
async function drain(cid: string, label: string): Promise<number> {
  let done = 0; const started = Date.now();
  for (let pass = 0; pass < 400; pass++) {
    const ids = await simIds(cid);
    const { data: jobs } = await db.from("jobs").select("id, kind, payload, attempts, locked_at, run_after").is("done_at", null).order("id").limit(300);
    const ours = (jobs ?? []).filter((j) => mine(j.payload as Record<string, unknown>, ids, cid) && j.kind !== "player_brief");
    if (!ours.length) break;
    const stale = Date.now() - 10 * 60_000;
    const j = ours.find((x) => !x.locked_at || new Date(x.locked_at as string).getTime() < stale);
    if (!j) { await new Promise((r) => setTimeout(r, 3000)); continue; }
    // Simulated cohorts' jobs are parked far in the future (migration 0022) so the production
    // worker never takes them; this driver claims them directly, whatever their run_after.
    const now = new Date().toISOString();
    const q = db.from("jobs").update({ locked_at: now }).eq("id", j.id);
    const { data: won } = await (j.locked_at ? q.eq("locked_at", j.locked_at) : q.is("locked_at", null)).select("id");
    if (!won?.length) continue;
    const t = Date.now();
    await runJob(db, { id: j.id as number, kind: j.kind as string, payload: j.payload as Record<string, unknown>, attempts: j.attempts as number });
    done++;
    if (Date.now() - t > 20_000) log(`  ${label}: ${j.kind} took ${((Date.now() - t) / 1000).toFixed(0)}s`);
  }
  log(`${label}: ${done} job(s) in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  return done;
}

async function morning(cid: string) {
  const { round } = await openNextRound(db, cid);
  // The production lock cron locks any open round past its locks_at; a simulated round is locked by this driver only.
  await db.from("rounds").update({ locks_at: "2999-01-01T00:00:00Z" }).eq("id", round.id);
  const { data: ep } = round.episode_id ? await db.from("episodes").select("number").eq("id", round.episode_id).maybeSingle() : { data: null };
  const r = { id: round.id, number: round.number, episodeRound: round.episode_round ?? round.number, episodeNumber: (ep?.number as number | undefined) ?? episodeOf(round.number) };
  const mail = await deliverScheduledMail(db, cid, r);
  const notices = await deliverBallotNotices(db, cid, { id: round.id, number: round.number });
  const invited = await issueInvitations(db, cid, { id: round.id, number: round.number, episode: r.episodeNumber, episodeRound: r.episodeRound });
  const paper = await publishBulletin(db, cid, { id: round.id, number: round.number, episodeRound: r.episodeRound, episode: r.episodeNumber }, { onLedger: ledger });
  const letter = await publishNewsletter(db, cid, { id: round.id, number: round.number, episodeRound: r.episodeRound, episode: r.episodeNumber }, { onLedger: ledger });
  const queued = await queueMorningDispatches(db, cid, round.id);
  log(`round ${round.number} opened: scripted ${mail.delivered}, notices ${notices.sent}, invited ${invited}, paper ${paper.published}, newsletter ${letter.published}, dispatches ${queued}`);
  return round;
}

async function lock(cid: string, roundId: string) {
  await db.from("rounds").update({ status: "locked" }).eq("id", roundId);
  await db.from("events").insert({ campaign_id: cid, round_id: roundId, phase: "lock", kind: "round.locked", payload: { at: new Date().toISOString(), sim: true }, idempotency_key: `lock:${roundId}` });
  await db.from("jobs").insert(PHASES.map((phase, i) => ({ kind: "tick_phase", payload: { round_id: roundId, phase, seq: i } })));
}

async function roundReport(cid: string, round: { id: string; number: number }, players: Player[], turns: Record<string, { reply: string; letters: number } | null>) {
  const lines: string[] = [`\n## Round ${round.number}\n`];
  const { data: packets } = await db.from("order_packets").select("character_id, mode, orders(seq, verb, args, status, ruling)").eq("round_id", round.id);
  for (const p of players) {
    const pk = (packets ?? []).find((x) => x.character_id === p.id);
    const { data: au } = await db.from("resources").select("balance").eq("character_id", p.id).eq("kind", "au").maybeSingle();
    const t = turns[p.id];
    lines.push(`### ${p.name} (${p.persona.specialization}) · ${au?.balance ?? "?"} AU · ${pk?.mode ?? "no packet"}`);
    if (t) lines.push(`Reply:\n\`\`\`\n${t.reply.trim().slice(0, 600)}\n\`\`\`\nLetters written: ${t.letters}`); else lines.push("No turn (the agent failed or had no dispatch).");
    for (const o of ((pk?.orders ?? []) as { seq: number; verb: string; args: { text?: string; conditional?: boolean; standing?: number; outcome?: { kind: string; summary: string } }; status: string; ruling: string | null }[]).sort((a, b) => a.seq - b.seq)) {
      lines.push(`- ${o.args.standing ? `[standing ${o.args.standing}] ` : ""}${o.args.conditional ? "[IF] " : ""}**${o.verb}** ${String(o.args.text ?? "").slice(0, 80)} → ${o.status}${o.args.outcome ? ` (${o.args.outcome.kind})` : ""}: ${(o.args.outcome?.summary ?? o.ruling ?? "").slice(0, 240)}`);
    }
  }
  const { data: evs } = await db.from("events").select("kind, payload").eq("round_id", round.id).in("kind", ["contacts.reported", "standing.queued", "agreements.enforced", "absence.ticked", "informants.reported", "world.grown", "room.triage", "room.moves", "room.error", "pressure.tier_reached", "motion.closed", "election.closed", "contact.seen", "contact.theft", "contact.theft_failed", "condition.fired", "security.reported", "directive.issued", "motion.sponsored", "research.briefed", "bulletin.published", "newsletter.published"]);
  const counts = new Map<string, number>(); const notes: string[] = [];
  for (const e of evs ?? []) { counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1); if (["contacts.reported", "standing.queued", "agreements.enforced", "absence.ticked", "informants.reported", "world.grown", "room.triage", "room.moves", "room.error", "motion.closed", "election.closed"].includes(e.kind)) notes.push(`${e.kind}: ${JSON.stringify(e.payload).slice(0, 200)}`); }
  lines.push(`\nEngine: ${[...counts.entries()].map(([k, n]) => `${k}×${n}`).join(", ") || "nothing recorded"}`);
  for (const n of notes) lines.push(`- ${n}`);
  const { data: dispatches } = await db.from("correspondence").select("raw").eq("round_id", round.id).filter("raw->>letter_kind", "eq", "dispatch");
  const fallbacks = (dispatches ?? []).filter((d) => (d.raw as { fallback?: boolean }).fallback).length;
  const { data: replies } = await db.from("correspondence").select("raw").eq("campaign_id", cid).eq("round_id", round.id).eq("direction", "outbound").not("raw->guarded", "is", null);
  const guarded = (replies ?? []).filter((r) => (r.raw as { guarded?: boolean }).guarded).length;
  lines.push(`Dispatches: ${dispatches?.length ?? 0} (${fallbacks} templated fallbacks). Staff replies: ${replies?.length ?? 0} (${guarded} guarded).`);
  report(lines.join("\n"));
}

async function finalReport(cid: string, players: Player[]) {
  const { data: led } = await db.from("model_ledger").select("tag, model, ok, ms, prompt_tokens, completion_tokens").gte("created_at", new Date(t0).toISOString());
  const byTag = new Map<string, { n: number; ok: number; ms: number; pt: number; ct: number }>();
  for (const r of led ?? []) { const k = r.tag as string; const v = byTag.get(k) ?? { n: 0, ok: 0, ms: 0, pt: 0, ct: 0 }; v.n++; if (r.ok) v.ok++; v.ms += Number(r.ms ?? 0); v.pt += Number(r.prompt_tokens ?? 0); v.ct += Number(r.completion_tokens ?? 0); byTag.set(k, v); }
  const lines = ["\n## Model ledger for the run\n", "| tag | calls | ok | minutes | prompt tokens | completion tokens |", "|---|---|---|---|---|---|"];
  for (const [k, v] of [...byTag.entries()].sort()) lines.push(`| ${k} | ${v.n} | ${v.ok} | ${(v.ms / 60000).toFixed(1)} | ${v.pt} | ${v.ct} |`);
  const { data: goals } = await db.from("character_goals").select("character_id, text, status, points, awarded").eq("campaign_id", cid);
  lines.push("\n## Goals\n");
  for (const p of players) for (const g of (goals ?? []).filter((g) => g.character_id === p.id)) lines.push(`- ${p.name}: ${g.text} (${g.points}) → ${g.status}${g.awarded ? ` (${g.awarded} awarded)` : ""}`);
  report(lines.join("\n"));
  mkdirSync(`docs/agent-runs/${slug}`, { recursive: true });
  for (const p of players) {
    const { data: mail } = await db.from("correspondence").select("direction, subject, body_text, received_at, from_character, to_characters, raw, characters!correspondence_from_character_fkey(name)").eq("campaign_id", cid).or(`from_character.eq.${p.id},to_characters.cs.{${p.id}}`).order("received_at");
    const out = [`# ${p.name} · ${p.persona.specialization}\n`];
    for (const m of mail ?? []) { const who = ((Array.isArray(m.characters) ? m.characters[0] : m.characters) as { name: string } | null)?.name ?? ((m.raw as { office?: { office: string } } | null)?.office?.office ?? (m.direction === "inbound" ? p.name : "The Department")); out.push(`\n---\n**${m.direction === "inbound" ? "→" : "←"} ${who}** · ${m.subject ?? ""} · ${String(m.received_at).slice(0, 16)}\n\n${m.body_text ?? ""}`); }
    writeFileSync(`docs/agent-runs/${slug}/${p.name.toLowerCase().replace(/\s+/g, "-")}.md`, out.join("\n"));
  }
}

async function main() {
  const { cid, players } = await setup();
  let prevOpenedAt: string | null = null;
  if (opt("--resume")) {
    report(`\n_Resumed ${new Date().toISOString()} after an interruption._\n`);
    // Locks left by the interrupted process are released; whatever was in flight finishes first.
    const ids = await simIds(cid);
    const { data: waiting } = await db.from("jobs").select("id, payload").is("done_at", null).not("locked_at", "is", null);
    for (const j of waiting ?? []) if (mine(j.payload as Record<string, unknown>, ids, cid)) await db.from("jobs").update({ locked_at: null }).eq("id", j.id);
    await drain(cid, "resume");
    const { data: rounds } = await db.from("rounds").select("id, number, status, opens_at").eq("campaign_id", cid).order("number");
    const last = (rounds ?? [])[(rounds ?? []).length - 1] as { id: string; number: number; status: string; opens_at: string } | undefined;
    if (last && last.status === "open") {
      // Interrupted during the day: lock and finish the night; the turns already sent stand.
      await lock(cid, last.id); await drain(cid, `night ${last.number}`);
    }
    if (last && !readFileSync(reportPath, "utf8").includes(`## Round ${last.number}\n`)) await roundReport(cid, { id: last.id, number: last.number }, players, Object.fromEntries(players.map((p) => [p.id, null])));
    prevOpenedAt = last?.opens_at ?? null;
    log(`resumed after round ${last?.number ?? 0}`);
  } else {
    writeFileSync(reportPath, `# Simulated season ${slug}\n\nCampaign ${cid}. ${players.length} synthetic players: ${players.map((p) => `${p.name} (${p.persona.specialization})`).join(", ")}. Started ${new Date().toISOString()}.\n`);
  }
  for (;;) {
    const { data: latest } = await db.from("rounds").select("number").eq("campaign_id", cid).order("number", { ascending: false }).limit(1).maybeSingle();
    if (Number(latest?.number ?? 0) >= R) break;
    const round = await morning(cid);
    await drain(cid, `morning ${round.number}`);
    const turns: Record<string, { reply: string; letters: number } | null> = {};
    for (const p of players) {
      const t = Date.now();
      const r = await playerTurn(db, { campaignId: cid, characterId: p.id, roundId: round.id, roundNo: round.number, prevOpenedAt, persona: p.persona, email: p.email, mailToken: p.mailToken }, ledger);
      turns[p.id] = r.turn ? { reply: r.turn.reply, letters: r.turn.letters.length } : null;
      log(`  ${p.name}: ${r.turn ? `${r.inserted} mail (${r.model})` : "no turn"} in ${((Date.now() - t) / 1000).toFixed(0)}s`);
    }
    await drain(cid, `day ${round.number}`);
    await lock(cid, round.id);
    await drain(cid, `night ${round.number}`);
    await roundReport(cid, round, players, turns);
    prevOpenedAt = round.opens_at;
    log(`round ${round.number} done`);
  }
  await finalReport(cid, players);
  await db.from("campaigns").update({ status: "complete" }).eq("id", cid);
  log(`finished; report at ${reportPath}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
