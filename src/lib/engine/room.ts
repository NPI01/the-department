/* The Showrunner's Room (docs/showrunner-room-proposal.md): the agentic layer
   that runs the story each night with no human in the loop after season setup.

     triage  (after grow)   decide everything waiting: held world drafts, open
                            PROPOSED items, goals the predicates proposed or
                            could not judge
     moves   (after world)  read the night, propose at most MOVES_PER_NIGHT moves
                            from a closed set, check each (Continuity, Skeptic,
                            Rules Lawyer), take a dissent read for Level 2, commit
     log                    the season log: one page the room writes for itself

   Authority (decided 2026-10-16): the room decides; Level 2 moves need a second
   Showrunner read from a fresh context to agree; Level 3 (the truth ledger, the
   arc, the allegiance matrix, the charter, the principal cast) is read-only data
   the code refuses to write. Mode per campaign: rules key room.mode = shadow
   (everything runs and is logged, nothing commits) or live. Models: the Qwen
   27B first, the 35B behind it. A failure anywhere here costs nothing but
   story: the night goes out as it would have. Never throws. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { chat, chatJson, type LedgerRow } from "@/lib/cobble";
import { gameDate } from "@/lib/email/letter";
import { gameMailbox, newMessageId } from "@/lib/email/resend";
import { GOALS } from "@/lib/game/creation";
import { assignGoal } from "@/lib/game/goals";
import { growRequest, instantiate, limitsPerson, loadLivePlaces, publicContext, SECRET_TERMS, type WorldRequest } from "./grow";
import { beatsFor } from "./morning";
import { rule } from "./rounds";
import { episodeOf, placesFor, pressureFor, scheduledFor } from "./world";
import type { DocumentDef } from "./world/types";

type Db = SupabaseClient;
type Ledger = ((r: LedgerRow) => void | Promise<void>) | undefined;
type Round = { id: string; campaignId: string; number: number; episodeRound: number };
export type RoomMode = "shadow" | "live";

export const MOVES_PER_NIGHT = 2;
export const SIDE_THREADS_OPEN = 3;
const MODELS = ["qwen/qwen3.8-27b", "qwen/qwen3.6-35b-a3b"];
const LEVEL2 = new Set(["new_document", "new_secret_character", "fact", "motion"]);
const MOVE_TYPES = ["npc_initiative", "beat_shift", "side_thread", "consequence", "goal_offer", "new_document", "new_secret_character", "fact", "motion"] as const;
type MoveType = (typeof MOVE_TYPES)[number];
/* Level 3 and engine-owned fact prefixes: the room may never write these. */
const FIXED_FACT_PREFIX = /^(finding\.|pressure\.|motion\.|goal\.|purge\.|filed\.|room\.)/;

export async function roomMode(db: Db, campaignId: string): Promise<RoomMode> {
  const m = await rule<string>(db, campaignId, "room.mode", "shadow");
  return m === "live" ? "live" : "shadow";
}

const HOUSE = `You are the Showrunner of THE DEPARTMENT, a correspondence game set in October 1977 in north-central North Dakota: players are new hires at Royce Industries, a private R&D company on the prairie, and the strangeness enters through paperwork that does not agree. You run the story each night for one cohort, inside a season whose arc, cast of principals, secret truth and charter are fixed and not yours to change. Your job is to keep the season alive and fair: answer what players reach for, keep pressure on, never give away more than the round allows, never decide outcomes the rules decide. You add depth and consequence; you do not add spectacle. Write plainly.`;

async function ask<T>(system: string, user: string, tag: string, onLedger: Ledger, opts: { json?: boolean; maxTokens?: number; temperature?: number } = {}): Promise<{ data: T | null; text: string; model: string }> {
  if (opts.json === false) {
    const r = await chat([{ role: "system", content: system }, { role: "user", content: user }], { tag, models: MODELS, temperature: opts.temperature ?? 0.3, maxTokens: opts.maxTokens ?? 400, think: false, timeoutMs: 110_000, onLedger });
    return { data: null, text: r.text, model: r.model };
  }
  const r = await chatJson<T>([{ role: "system", content: system }, { role: "user", content: user }], { tag, models: MODELS, temperature: opts.temperature ?? 0.3, maxTokens: opts.maxTokens ?? 900, think: false, timeoutMs: 110_000, onLedger });
  return { data: r.data, text: r.result.text, model: r.result.model };
}

/* ---------- the brief ---------- */
type Person = { id: string; slug: string; name: string; title: string | null; player: boolean; division: string | null; listed: boolean; npc_state: Record<string, unknown> | null };
type Brief = {
  round: Round; episode: number; date: string; mode: RoomMode;
  players: Person[]; staff: Person[];
  didLastNight: string[]; arrived: string[]; openBallots: string[]; pressure: string | null; beats: string[]; upcomingMail: { key: string; round: number; subject: string }[];
  standings: string[]; arc: string; lastWeek: string[]; notes: Record<string, unknown> | null; sideThreadsOpen: number;
  text: string;
};

async function brief(db: Db, round: Round, mode: RoomMode): Promise<Brief> {
  const episode = episodeOf(round.number);
  const [{ data: chars }, { data: packets }, { data: motions }, { data: arcDoc }, { data: beatDoc }, { data: last }, { data: note }, { data: threads }, { data: goals }] = await Promise.all([
    db.from("characters").select("id, slug, name, title, player_id, npc_state, divisions(slug)").eq("campaign_id", round.campaignId).eq("status", "active"),
    db.from("order_packets").select("character_id, mode, orders(verb, args, status, ruling)").eq("round_id", round.id),
    db.from("motions").select("number, title, kind, closes_round, organizations(name)").eq("campaign_id", round.campaignId).eq("status", "open").lte("opens_round", round.number),
    db.from("canon_docs").select("content").eq("path", "canon/secret/10-episode-arcs.md").maybeSingle(),
    db.from("canon_docs").select("content").eq("path", "canon/secret/09-episode-01-beats.md").maybeSingle(),
    db.from("room_decisions").select("phase, kind, verdict, reason, committed, reversed_at, round").eq("campaign_id", round.campaignId).gte("round", round.number - 7).order("created_at", { ascending: false }).limit(30),
    db.from("room_log").select("notes").eq("campaign_id", round.campaignId).eq("round", round.number - 1).maybeSingle(),
    db.from("world_requests").select("id").eq("campaign_id", round.campaignId).gte("round", round.number - 14).in("status", ["done", "open"]),
    db.from("character_goals").select("character_id, text, status").eq("campaign_id", round.campaignId),
  ]);
  const people: Person[] = ((chars ?? []) as unknown as { id: string; slug: string; name: string; title: string | null; player_id: string | null; npc_state: Record<string, unknown> | null; divisions: { slug: string } | { slug: string }[] | null }[]).map((c) => ({
    id: c.id, slug: c.slug, name: c.name, title: c.title, player: Boolean(c.player_id), division: (Array.isArray(c.divisions) ? c.divisions[0] : c.divisions)?.slug ?? null, listed: c.npc_state?.listed !== false, npc_state: c.npc_state,
  }));
  const players = people.filter((p) => p.player); const staff = people.filter((p) => !p.player);
  const name = new Map(people.map((p) => [p.id, p.name]));
  const didLastNight: string[] = [];
  for (const pk of packets ?? []) {
    const who = name.get(pk.character_id as string) ?? "?";
    const os = ((pk.orders ?? []) as { verb: string; args: { text?: string; outcome?: { summary?: string } }; status: string; ruling: string | null }[]).filter((o) => o.status === "resolved");
    if (!os.length) didLastNight.push(`${who}: ${pk.mode === "hold" ? "held" : "no orders"}`);
    for (const o of os) didLastNight.push(`${who}: ${o.verb.replace(/_/g, " ")} "${(o.args.text ?? "").slice(0, 80)}" → ${(o.args.outcome?.summary ?? o.ruling ?? "").slice(0, 160)}`);
  }
  const openBallots = (motions ?? []).map((m) => { const o = (Array.isArray(m.organizations) ? m.organizations[0] : m.organizations) as { name: string } | null; return `${m.number} "${m.title}" (${m.kind}) before the ${o?.name ?? "Board"}, closes Round ${m.closes_round}`; });
  const band = pressureFor(episode).find((t) => round.episodeRound >= t.rounds[0] && round.episodeRound <= t.rounds[1]);
  const beats = beatDoc && episode === 1 ? beatsFor(beatDoc.content as string, round.episodeRound + 1) : [];
  const arcAll = (arcDoc?.content as string | undefined) ?? "";
  const m = arcAll.match(new RegExp(`## Episode 0?${episode}[^\\n]*\\n([\\s\\S]*?)(?=\\n## Episode|$)`));
  const arc = (m?.[1] ?? "").replace(/\*\*(\w[^*]*)\*\*/g, "$1").trim().slice(0, 2600);
  const upcomingMail = scheduledFor(episode).filter((i) => i.round > round.episodeRound && i.round <= round.episodeRound + 4).map((i) => ({ key: i.key, round: i.round, subject: i.subject }));
  const standings = players.map((p) => { const gs = (goals ?? []).filter((g) => g.character_id === p.id); return `${p.name}: ${gs.filter((g) => g.status === "met").length} goal(s) met, ${gs.filter((g) => g.status === "open").length} open${gs.filter((g) => g.status === "open").map((g) => ` ("${g.text}")`).join("")}`; });
  const lastWeek = (last ?? []).map((d) => `R${d.round} ${d.phase}/${d.kind}: ${d.verdict}${d.committed ? "" : " (not committed)"}${d.reversed_at ? " (reversed)" : ""} — ${(d.reason ?? "").slice(0, 120)}`);
  const text = [
    `TONIGHT: Round ${round.number} (day ${round.episodeRound} of Episode ${episode}), ${gameDate(round.number)}. Mode: ${mode}.`,
    `THE EPISODE'S ARC (fixed; you serve it, you do not change it):\n${arc || "(none on file)"}`,
    band ? `PRESSURE THIS WEEK: ${band.text}` : "",
    beats.length ? `SCHEDULED FOR TOMORROW:\n${beats.map((b) => `- ${b}`).join("\n")}` : "",
    upcomingMail.length ? `MAIL ALREADY SCHEDULED (key · episode day · subject):\n${upcomingMail.map((u) => `- ${u.key} · day ${u.round} · ${u.subject}`).join("\n")}` : "",
    `PLAYERS (slug · name, title):\n${players.map((p) => `- ${p.slug} · ${p.name}${p.title ? `, ${p.title}` : ""}${p.division ? ` (${p.division})` : ""}`).join("\n")}`,
    `STAFF AND LOCALS THE PLAYERS CAN REACH (slug · name, title):\n${staff.filter((s) => s.listed).map((p) => `- ${p.slug} · ${p.name}${p.title ? `, ${p.title}` : ""}${p.division ? ` (${p.division})` : " (off campus)"}`).join("\n")}`,
    `WHAT PLAYERS DID TONIGHT AND WHAT CAME OF IT:\n${didLastNight.map((d) => `- ${d}`).join("\n") || "- nothing"}`,
    openBallots.length ? `OPEN BALLOTS:\n${openBallots.map((b) => `- ${b}`).join("\n")}` : "",
    `STANDINGS:\n${standings.map((s) => `- ${s}`).join("\n")}`,
    lastWeek.length ? `YOUR OWN DECISIONS THIS WEEK (reversed ones were wrong; do not repeat them):\n${lastWeek.map((l) => `- ${l}`).join("\n")}` : "",
    note?.notes ? `YOUR NOTES FROM LAST NIGHT: ${JSON.stringify(note.notes)}` : "",
  ].filter(Boolean).join("\n\n");
  return { round, episode, date: gameDate(round.number), mode, players, staff, didLastNight, arrived: [], openBallots, pressure: band?.text ?? null, beats, upcomingMail, standings, arc, lastWeek, notes: (note?.notes as Record<string, unknown> | null) ?? null, sideThreadsOpen: (threads ?? []).length, text };
}

/* ---------- the checks ---------- */
type Checks = { continuity: string[]; skeptic: string[]; rules: string[] };
const quoteVerified = (text: string, draft: string): string[] => {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length || /^pass\b/i.test(lines[0])) return [];
  const soft = (t: string) => t.toLowerCase().replace(/[‘’“”]/g, "'").replace(/\s+/g, " ");
  const hay = soft(draft); const out: string[] = [];
  for (const l of lines.slice(1)) { const m = l.match(/^-\s*(.*?)["“](.+?)["”]\s*$/); if (m && m[2].length >= 6 && hay.includes(soft(m[2]).replace(/"/g, "'"))) out.push(`${m[1].trim()} "${m[2]}"`); }
  return out.slice(0, 3);
};

async function checks(db: Db, b: Brief, what: string, draft: string, onLedger: Ledger, playerFacing = ""): Promise<Checks> {
  const ctx = await publicContext(db, b.round.campaignId);
  const [{ data: ledger }, { data: sheetsDoc }] = await Promise.all([
    db.from("canon_docs").select("content").eq("path", "canon/secret/00-truth-ledger.md").maybeSingle(),
    db.from("canon_docs").select("content").eq("path", "canon/secret/03-factions-and-people.md").maybeSingle(),
  ]);
  const secret = `${((ledger?.content as string) ?? "").slice(0, 8000)}\n\n${((sheetsDoc?.content as string) ?? "").slice(0, 5000)}`;
  const continuity = ask<null>(`You are Continuity, the archivist for a 1977 correspondence game. The Showrunner proposes a decision for tonight. You know the canon: the public personnel directory, the secret truth ledger and the factions document below. FAIL only if the proposal contradicts canon (a person's role, status, location; an established event; geography), or has a canon character do or know something canon says they would not. Answer PASS, or FAIL with up to three lines each beginning "- " and quoting the offending phrase from the proposal exactly in double quotes. Nothing else.\n\nPUBLIC DIRECTORY:\n${ctx.directory}\n\nSECRET CANON:\n${secret}`, `THE PROPOSAL (${what}):\n${draft}`, "room:continuity", onLedger, { json: false, maxTokens: 250, temperature: 0.1 });
  const skeptic = ask<null>(`You are the Skeptic, the continuity editor for a 1977 corporate-intrigue correspondence game. The Showrunner proposes a decision for tonight, round ${b.round.number} (day ${b.round.episodeRound} of the episode; days 1–3 procedure and one oddity only, 4–7 crumbs, 8–14 hedged opinion). FAIL only for: 1. it gives players more than the day allows (a theory, a culprit, a finding, a secret); 2. it echoes secret canon or a secret name (${"convergence, 68-24, the Keepers, Ascendants, 1984, Sublevel Nine, Kessler, Omega Point, SENTINEL, NIGHTJAR, HARVEST, ORPHEUS, LANTERN, the chamber, Vetch, Wren"}) in anything a player would read; 3. it breaks the period (technology, slang, institutions wrong for rural North Dakota, 1977); 4. it decides an outcome the rules decide (a vote, an order's result, a goal) or changes a fixed thing (the arc, a principal's role); 5. it makes every strange thing the work of one conspiracy. When in doubt, PASS. Answer PASS, or FAIL with up to three lines each beginning "- " with the rule number and the offending phrase quoted exactly from the proposal in double quotes. Nothing else.`, `THE PROPOSAL (${what}):\n${draft}`, "room:skeptic", onLedger, { json: false, maxTokens: 250, temperature: 0.2 });
  const rules = ask<null>(`You are the Rules Lawyer for a 1977 correspondence game. Players act by orders that cost Action Units (request files 6, interview 4, surveil 10, visit 5, examine 3, search 8, lobby 5; a trip off campus 5); votes are cast by mail and decided by the body's rules; a motion closes two to five rounds after it opens; clearance 1 is a new hire, 2 is a committee seat, 3 opens restricted archives; Security notices restricted places. The Showrunner proposes a decision. FAIL only if it would give a player something the rules charge for without the charge, change a rule, a cost, a clearance, a seat or a vote, or make a committee act outside its charter (the Board: budget, appointments, policy; Research: projects, experiments, data classification, clearance; Safety: sealing orders, access, investigations, emergency authority). Answer PASS, or FAIL with up to three lines each beginning "- " and quoting the offending phrase from the proposal exactly in double quotes. Nothing else. Never invent numbers.`, `THE PROPOSAL (${what}):\n${draft}`, "room:rules", onLedger, { json: false, maxTokens: 200, temperature: 0.1 });
  const [c, s, r] = await Promise.all([continuity.catch(() => ({ text: "PASS", data: null, model: "" })), skeptic.catch(() => ({ text: "PASS", data: null, model: "" })), rules.catch(() => ({ text: "PASS", data: null, model: "" }))]);
  const leak = playerFacing.match(SECRET_TERMS);
  return { continuity: quoteVerified(c.text, draft), skeptic: [...quoteVerified(s.text, draft), ...(leak ? [`hard: secret term "${leak[0]}" in player-facing text`] : [])], rules: quoteVerified(r.text, draft) };
}

/* The parts of a move a player could read. A note to an NPC is not one: the
   staff-reply pipeline guards the letter it produces. */
function playerFacingText(m: Move): string {
  const p = m.params ?? {};
  switch (m.type) {
    case "new_document": return [p.title, p.body, p.from, ...(Array.isArray(p.aliases) ? p.aliases : [])].map(String).join(" ");
    case "new_secret_character": return [p.name, p.title, p.public_profile].map(String).join(" ");
    case "motion": return [p.title, p.text, p.stakes].map(String).join(" ");
    case "side_thread": return String(p.clause ?? "");
    case "goal_offer": return GOALS[String(p.goal_key)]?.text ?? "";
    default: return "";
  }
}
const blocked = (c: Checks) => c.continuity.length + c.skeptic.length + c.rules.length > 0;

/* Level 2: a second Showrunner, fresh context, must agree. */
async function dissent(b: Brief, what: string, draft: string, onLedger: Ledger): Promise<{ agree: boolean; reason: string }> {
  try {
    const r = await ask<{ agree: boolean; reason: string }>(`${HOUSE}\n\nAnother Showrunner, working the same night, proposes a consequential move. You have not seen their reasoning. Decide whether you would make the same move tonight, given the brief: does it serve the arc, is it fair to the players, is it the right night for it, and would you rather do something smaller? Output JSON only: {"agree": true|false, "reason": "one or two sentences"}.`, `${b.text}\n\nTHE PROPOSED MOVE (${what}):\n${draft}`, "room:dissent", onLedger, { maxTokens: 200, temperature: 0.4 });
    return { agree: Boolean(r.data?.agree), reason: r.data?.reason ?? r.text.slice(0, 200) };
  } catch (e) { return { agree: false, reason: `no read: ${(e as Error).message.slice(0, 80)}` }; }
}

async function record(db: Db, b: Brief, d: { phase: "triage" | "moves"; kind: string; ref?: unknown; level?: number; verdict: string; reason?: string; params?: unknown; checks?: Checks; dissent?: unknown; committed: boolean; touched?: unknown; provenance?: unknown }) {
  await db.from("room_decisions").insert({ campaign_id: b.round.campaignId, round: b.round.number, phase: d.phase, kind: d.kind, ref: d.ref ?? null, level: d.level ?? 1, verdict: d.verdict, reason: d.reason ?? null, params: d.params ?? null, checks: d.checks ?? null, dissent: d.dissent ?? null, mode: b.mode, committed: d.committed, touched: d.touched ?? null, provenance: d.provenance ?? null });
}

/* ---------- triage ---------- */
export async function triage(db: Db, round: Round, onLedger?: Ledger): Promise<{ decided: number }> {
  const mode = await roomMode(db, round.campaignId);
  const b = await brief(db, round, mode);
  const live = mode === "live";
  let decided = 0;
  const verdictOf = async <T,>(what: string, item: string, options: string, extra = ""): Promise<{ verdict: string; reason: string } & T> => {
    const r = await ask<{ verdict: string; reason: string } & T>(`${HOUSE}\n\nTonight you decide one item that is waiting. ${extra}Output JSON only: {"verdict": one of ${options}, "reason": "one or two sentences"${what === "goal" ? ', "note": "one player-facing sentence for the ruling"' : ""}}.`, `${b.text}\n\nTHE ITEM (${what}):\n${item}`, `room:triage:${what}`, onLedger, { maxTokens: 300 });
    return (r.data ?? { verdict: "", reason: r.text.slice(0, 200) }) as { verdict: string; reason: string } & T;
  };

  // 1. World drafts the Skeptic flagged.
  const { data: heldPeople } = await db.from("world_people").select("id, name, title, department_slug, public_profile, sheet, place_slug, origin, provenance").eq("status", "held");
  for (const p of (heldPeople ?? []).filter((x) => (x.origin as { campaign_id?: string }).campaign_id === round.campaignId)) {
    try {
      const item = `${p.name}${p.title ? `, ${p.title}` : ""} (${p.department_slug ?? "off campus"}) at ${p.place_slug}. ${p.public_profile}\nSheet: ${JSON.stringify(p.sheet).slice(0, 1500)}\nThe Skeptic's flags: ${JSON.stringify((p.provenance as { flags?: unknown }).flags)}`;
      const v = await verdictOf("held world person", item, '"keep" | "retire"', "The writers' room wrote this person for a place a player went to; the Skeptic flagged the draft on both reads. Keep them if the flags are wrong or harmless (depth that touches nothing); retire them if a flag is right. ");
      const verdict = v.verdict === "keep" ? "keep" : "retire";
      if (live) {
        await db.from("world_people").update({ status: verdict === "keep" ? "live" : "retired", decided_at: new Date().toISOString() }).eq("id", p.id);
        if (verdict === "keep") await instantiate(db, p.id as string, round.campaignId);
        const reqId = (p.origin as { request_id?: string }).request_id; if (reqId) await db.from("world_requests").update({ status: verdict === "keep" ? "done" : "retired" }).eq("id", reqId);
      }
      await record(db, b, { phase: "triage", kind: "world_person", ref: { id: p.id, name: p.name }, verdict, reason: v.reason, committed: live }); decided++;
    } catch (e) { await record(db, b, { phase: "triage", kind: "world_person", ref: { id: p.id }, verdict: "error", reason: (e as Error).message.slice(0, 200), committed: false }); }
  }
  const { data: heldPlaces } = await db.from("world_places").select("id, slug, def, origin, provenance").eq("status", "held");
  for (const p of (heldPlaces ?? []).filter((x) => (x.origin as { campaign_id?: string }).campaign_id === round.campaignId)) {
    try {
      const v = await verdictOf("held world place", `${JSON.stringify(p.def).slice(0, 1500)}\nThe Skeptic's flags: ${JSON.stringify((p.provenance as { flags?: unknown }).flags)}`, '"keep" | "retire"');
      const verdict = v.verdict === "keep" ? "keep" : "retire";
      if (live) { await db.from("world_places").update({ status: verdict === "keep" ? "live" : "retired", decided_at: new Date().toISOString() }).eq("id", p.id); const reqId = (p.origin as { request_id?: string }).request_id; if (reqId) await db.from("world_requests").update({ status: verdict === "keep" ? "done" : "retired" }).eq("id", reqId); }
      await record(db, b, { phase: "triage", kind: "world_place", ref: { id: p.id, slug: p.slug }, verdict, reason: v.reason, committed: live }); decided++;
    } catch (e) { await record(db, b, { phase: "triage", kind: "world_place", ref: { id: p.id }, verdict: "error", reason: (e as Error).message.slice(0, 200), committed: false }); }
  }

  // 2. Goals the predicates proposed as met, or could not judge at the episode's end.
  const { data: goalEvents } = await db.from("events").select("kind, payload").eq("campaign_id", round.campaignId).in("kind", ["goal.proposed_met", "goal.needs_review"]).order("created_at");
  for (const e of goalEvents ?? []) {
    const v0 = e.payload as { goal: string; character: string; goal_key: string; points?: number };
    const { data: g } = await db.from("character_goals").select("id, text, points, status, character_id").eq("id", v0.goal).maybeSingle();
    if (!g || g.status !== "open") continue;
    try {
      const who = b.players.find((p) => p.id === g.character_id);
      const [{ data: kn }, { data: items }] = await Promise.all([db.from("knowledge").select("fact_key").eq("character_id", g.character_id).limit(80), db.from("case_items").select("title").eq("character_id", g.character_id).eq("status", "held")]);
      const item = `${who?.name ?? "a player"}'s goal: "${g.text}" (${g.points} points). ${e.kind === "goal.proposed_met" ? "The record says the condition is met; a human was to confirm." : "The episode has ended and the record could not judge it."}\nWhat they know (keys): ${(kn ?? []).map((k) => k.fact_key).join(", ").slice(0, 1200)}\nWhat they hold: ${(items ?? []).map((i) => i.title).join("; ").slice(0, 600)}`;
      const v = await verdictOf<{ note?: string }>("goal", item, '"met" | "partly_met" | "not_met"', "Judge by the record, generously where the player did the work and strictly where they did not. ");
      const verdict = v.verdict === "met" ? "met" : v.verdict === "partly_met" ? "partly_met" : "not_met";
      const awarded = verdict === "met" ? Number(v0.points ?? g.points) : verdict === "partly_met" ? Math.ceil(Number(g.points) / 2) : 0;
      if (live) {
        await db.from("character_goals").update({ status: verdict === "not_met" ? "failed" : "met", awarded: verdict === "not_met" ? null : awarded, decided_round: round.number, decided_at: new Date().toISOString(), note: v.note ?? (verdict === "not_met" ? "Not met by the record." : "Judged by the record.") }).eq("id", g.id);
        await db.from("events").insert({ campaign_id: round.campaignId, round_id: round.id, phase: "triage", kind: verdict === "not_met" ? "goal.failed" : "goal.met", payload: { goal: g.id, character: g.character_id, goal_key: v0.goal_key, awarded, partial: verdict === "partly_met", round: round.number }, idempotency_key: `goal:${g.id}:${verdict === "not_met" ? "failed" : "met"}`, visible_to: [g.character_id] });
      }
      await record(db, b, { phase: "triage", kind: "goal", ref: { goal: g.id, character: g.character_id }, verdict, reason: v.reason, params: { awarded, note: v.note }, committed: live }); decided++;
    } catch (err) { await record(db, b, { phase: "triage", kind: "goal", ref: { goal: g.id }, verdict: "error", reason: (err as Error).message.slice(0, 200), committed: false }); }
  }

  // 3. PROPOSED items in canon that only arrange what canon already holds (at most five a night; the queue is show-wide).
  const { data: props } = await db.from("proposals").select("id, doc_path, kind, heading, text").eq("status", "open").eq("present", true).in("kind", ["item", "question"]).order("doc_path").limit(5);
  for (const p of props ?? []) {
    try {
      const v = await verdictOf<{ answer?: string }>("proposal", `In ${p.doc_path}${p.heading ? ` under "${p.heading}"` : ""}, marked PROPOSED:\n${(p.text as string).slice(0, 1500)}`, '"approve" | "reject" | "answer"', "A PROPOSED item is a fill a writer made where canon was silent. Approve it if it arranges what canon already holds and contradicts nothing; reject it if it decides something the season's fixed canon should decide, or contradicts it; for an open question, answer it in one sentence in \"answer\". ");
      const verdict = ["approve", "reject", "answer"].includes(v.verdict) ? v.verdict : "reject";
      // A rejection becomes "revise" with the room's reason: the review record keeps the item, and the next canon sync sees why.
      if (live) await db.from("proposals").update({ status: verdict === "approve" ? "approved" : verdict === "answer" ? "answered" : "revise", note: `[room] ${v.answer ?? v.reason}`, decided_at: new Date().toISOString() }).eq("id", p.id);
      await record(db, b, { phase: "triage", kind: "proposal", ref: { id: p.id, doc: p.doc_path }, verdict, reason: v.answer ? `${v.reason} Answer: ${v.answer}` : v.reason, committed: live }); decided++;
    } catch (err) { await record(db, b, { phase: "triage", kind: "proposal", ref: { id: p.id }, verdict: "error", reason: (err as Error).message.slice(0, 200), committed: false }); }
  }
  return { decided };
}

/* ---------- moves ---------- */
type Move = { type: MoveType; why: string; params: Record<string, unknown> };
const str = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/* Parameters are checked in code before any model reads them. Returns the clean move or a reason. */
function validateMove(m: Move, b: Brief, ctx: Awaited<ReturnType<typeof publicContext>>): { ok: true; move: Move } | { ok: false; reason: string } {
  if (!m || !MOVE_TYPES.includes(m.type)) return { ok: false, reason: "unknown move type" };
  const p = m.params ?? {};
  const player = b.players.find((x) => x.slug === str(p.player_slug)); const npc = b.staff.find((x) => x.slug === str(p.npc_slug));
  const need = (cond: unknown, why: string) => (cond ? null : why);
  let bad: string | null = null;
  switch (m.type) {
    case "npc_initiative": bad = need(player, "player_slug unknown") ?? need(npc, "npc_slug unknown") ?? need(str(p.about).length > 10, "about too short"); break;
    case "beat_shift": { const key = str(p.key); const delta = Number(p.delta); bad = need(scheduledFor(b.episode).some((i) => i.key === key), "key is not a scheduled item") ?? need(Number.isInteger(delta) && Math.abs(delta) <= 2 && delta !== 0, "delta must be ±1 or ±2"); break; }
    case "side_thread": bad = need(player, "player_slug unknown") ?? need(["person_at_place", "place"].includes(str(p.kind)), "kind") ?? need(str(p.clause).length > 10, "clause") ?? need(str(p.kind) !== "person_at_place" || placesFor(b.episode).some((x) => x.slug === str(p.place_slug)), "place_slug unknown") ?? need(b.sideThreadsOpen < SIDE_THREADS_OPEN, "too many side threads open"); break;
    case "consequence": bad = need(player, "player_slug unknown") ?? need(["security_notices", "obligation"].includes(str(p.kind)), "kind") ?? need(str(p.text).length > 10, "text") ?? need(str(p.kind) !== "obligation" || (npc && Math.abs(Number(p.delta)) <= 0.3), "obligation needs npc_slug and |delta| ≤ 0.3"); break;
    case "goal_offer": bad = need(player, "player_slug unknown") ?? need(GOALS[str(p.goal_key)], "goal_key not in the pool"); break;
    case "new_document": bad = need(str(p.title).length > 3, "title") ?? need(["document", "report", "memo", "map", "letter", "diagram", "object"].includes(str(p.kind)), "kind") ?? need(str(p.body).length > 80, "body") ?? need(Array.isArray(p.aliases) && (p.aliases as unknown[]).length > 0, "aliases") ?? need(Number.isInteger(Number(p.clearance)) && Number(p.clearance) >= 1 && Number(p.clearance) <= 3, "clearance 1–3") ?? need(npc || placesFor(b.episode).some((x) => x.slug === str(p.holder)) || str(p.holder) === "records", "holder must be an NPC slug, a place slug or records"); break;
    case "new_secret_character": {
      // The writers' room's hard limits apply here too: name, surname collision, real people, secret terms, department.
      const hard = limitsPerson({ name: str(p.name), title: str(p.title), department: str(p.department) || null, public_profile: str(p.public_profile), sheet: (p.sheet ?? {}) as never, reason_at_place: "" }, ctx);
      bad = (hard.length ? hard.join("; ") : null) ?? need(str(p.public_profile).length > 20, "public_profile") ?? need(typeof p.sheet === "object" && p.sheet !== null, "sheet") ?? need(str(p.secret).length > 10, "secret") ?? need(!p.place_slug || placesFor(b.episode).some((x) => x.slug === str(p.place_slug)), "place_slug unknown"); break;
    }
    case "fact": bad = need(/^[a-z0-9_.-]{4,60}$/.test(str(p.key)), "key") ?? need(!FIXED_FACT_PREFIX.test(str(p.key)), "key is engine-owned or fixed") ?? need(str(p.value).length > 3, "value"); break;
    case "motion": bad = need(["board", "research-committee", "safety-committee"].includes(str(p.body)), "body") ?? need(npc, "sponsor npc_slug unknown") ?? need(str(p.title).length > 5 && str(p.text).length > 30, "title/text") ?? need(Number.isInteger(Number(p.closes_in)) && Number(p.closes_in) >= 2 && Number(p.closes_in) <= 5, "closes_in 2–5") ?? need(str(p.stakes).length > 20, "stakes"); break;
    default: bad = "unknown move type";
  }
  return bad ? { ok: false, reason: bad } : { ok: true, move: { type: m.type, why: str(m.why, 300), params: p } };
}

async function commitMove(db: Db, b: Brief, m: Move, onLedger: Ledger): Promise<unknown> {
  const p = m.params; const r = b.round;
  const player = b.players.find((x) => x.slug === str(p.player_slug))!; const npc = b.staff.find((x) => x.slug === str(p.npc_slug));
  const origin = { campaign_id: r.campaignId, round: r.number, room: true };
  switch (m.type) {
    case "npc_initiative": {
      // A note to the NPC, in the player's thread, that the player never wrote: the staff-reply pipeline answers it as a first letter. Hidden from the Case File (letter_kind initiative).
      const { data: row } = await db.from("correspondence").insert({ campaign_id: r.campaignId, round_id: r.id, direction: "inbound", message_id: newMessageId(), from_character: player.id, from_address: null, to_characters: [npc!.id], to_addresses: [gameMailbox().address], subject: `Initiative: ${str(p.about, 60)}`, body_text: `[The showrunner's note, ${b.date}: you have decided to write to ${player.name} first, unprompted. Your reason, in your own terms: ${str(p.about)}. Say what you would say to a new hire you chose to write to; ask for what you want; give away nothing beyond what the day allows.]`, trusted: true, raw: { letter_kind: "initiative", source: "room" } }).select("id").single();
      if (row) await db.from("jobs").insert({ kind: "npc_reply", payload: { correspondence_id: row.id, character_id: npc!.id }, run_after: new Date(Date.now() + 60_000).toISOString() });
      return { correspondence_id: row?.id };
    }
    case "beat_shift": { const key = `beat.shift.${str(p.key)}`; await db.from("rules").upsert({ campaign_id: r.campaignId, key, value: Number(p.delta), effective_from_round: r.number, enacted_by: "room" }, { onConflict: "campaign_id,key" }); return { rule: key, delta: Number(p.delta) }; }
    case "side_thread": {
      const { data: req } = await db.from("world_requests").insert({ campaign_id: r.campaignId, round_id: r.id, round: r.number, character_id: player.id, kind: str(p.kind), place_slug: str(p.kind) === "person_at_place" ? str(p.place_slug) : null, clause: str(p.clause), verb: str(p.kind) === "person_at_place" ? "interview" : "visit" }).select("*").single();
      const out = req ? await growRequest(db, req as WorldRequest, onLedger) : null;
      if (out?.status === "done" && str(p.kind) === "person_at_place") {
        const { data: who } = await db.from("characters").select("id, slug, name").eq("campaign_id", r.campaignId).eq("npc_state->>place", str(p.place_slug)).is("player_id", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (who) await commitMove(db, b, { type: "npc_initiative", why: m.why, params: { player_slug: player.slug, npc_slug: who.slug, about: str(p.clause) } }, onLedger);
        return { request: req?.id, person: who?.slug ?? null };
      }
      return { request: req?.id, grow: out?.status };
    }
    case "consequence": {
      if (str(p.kind) === "security_notices") {
        const { data: sec } = await db.from("characters").select("id, divisions!inner(slug)").eq("campaign_id", r.campaignId).is("player_id", null).eq("divisions.slug", "corporate-security");
        for (const s of sec ?? []) await db.from("knowledge").insert({ character_id: s.id, fact_key: `noticed:${player.slug}:room:${r.number}`, value: { kind: "noticed", text: str(p.text), from: player.id, from_name: player.name, round: r.number }, confidence: 1, source_kind: "told", learned_round: r.number });
        return { security: (sec ?? []).length };
      }
      const { data: cur } = await db.from("relationships").select("obligation").eq("from_character", npc!.id).eq("to_character", player.id).maybeSingle();
      const obligation = Math.max(-1, Math.min(1, Number(cur?.obligation ?? 0) + Number(p.delta)));
      await db.from("relationships").upsert({ campaign_id: r.campaignId, from_character: npc!.id, to_character: player.id, obligation, updated_at: new Date().toISOString() }, { onConflict: "from_character,to_character" });
      await db.from("knowledge").insert({ character_id: npc!.id, fact_key: `room.consequence.${r.number}`, value: { kind: "told", text: str(p.text), from: player.id, round: r.number }, confidence: 1, source_kind: "told", learned_round: r.number });
      return { obligation };
    }
    case "goal_offer": { const { data: open } = await db.from("character_goals").select("id").eq("character_id", player.id).eq("status", "open"); if (open?.length) return { skipped: "has an open goal" }; await assignGoal(db, { campaignId: r.campaignId, characterId: player.id, goalKey: str(p.goal_key), round: r.number }); return { goal: str(p.goal_key) }; }
    case "new_document": {
      const slug = str(p.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
      const def: DocumentDef = { slug, episode: b.episode, title: str(p.title, 120), kind: str(p.kind) as DocumentDef["kind"], aliases: (p.aliases as unknown[]).map((a) => String(a).toLowerCase()).slice(0, 6), holder: str(p.holder), access: { clearance: Number(p.clearance) }, grants: [`read.${slug}`], wrongDetail: null, body: str(p.body, 4000), from: str(p.from, 80) || undefined, written: str(p.written, 40) || undefined };
      const { error } = await db.from("world_documents").insert({ slug, def, status: "live", origin, provenance: { why: m.why } });
      if (error) return { error: error.message };
      await loadLivePlaces(db); return { document: slug };
    }
    case "new_secret_character": {
      const sheet = { ...(p.sheet as object), never_says: [...(((p.sheet as { never_says?: string[] }).never_says) ?? []), str(p.secret)], secret: str(p.secret) };
      const slug = str(p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48);
      const { data: row, error } = await db.from("world_people").insert({ slug, name: str(p.name, 60), title: str(p.title, 80) || null, department_slug: str(p.department) || null, public_profile: str(p.public_profile, 600), sheet, place_slug: str(p.place_slug) || null, status: "live", origin, provenance: { why: m.why, secret: true } }).select("id").single();
      if (error) return { error: error.message };
      const id = await instantiate(db, row.id as string, r.campaignId);
      if (id && !p.place_slug) await db.from("characters").update({ npc_state: { ...sheet, listed: true, world_person_id: row.id } }).eq("id", id);
      return { person: slug, character: id };
    }
    case "fact": { await db.from("facts").upsert({ campaign_id: r.campaignId, key: str(p.key), value: { text: str(p.value), by: "room", round: r.number }, established_round: r.number, secret: true }, { onConflict: "campaign_id,key" }); return { fact: str(p.key) }; }
    case "motion": {
      const { data: org } = await db.from("organizations").select("id, name").eq("campaign_id", r.campaignId).eq("slug", str(p.body)).maybeSingle();
      if (!org) return { error: "no such body" };
      const { data: seat } = await db.from("memberships").select("character_id").eq("organization_id", org.id).eq("character_id", npc!.id).maybeSingle();
      if (!seat) return { error: `${npc!.name} holds no seat on the ${org.name}` };
      const prefix = str(p.body) === "board" ? "B" : str(p.body) === "research-committee" ? "R" : "S";
      const { count } = await db.from("motions").select("id", { count: "exact", head: true }).eq("campaign_id", r.campaignId).like("number", `${prefix}-77-%`);
      const number = `${prefix}-77-${String((count ?? 0) + 1).padStart(3, "0")}`;
      await db.from("motions").insert({ campaign_id: r.campaignId, organization_id: org.id, number, title: str(p.title, 120), text: str(p.text, 1500), stakes: str(p.stakes, 600), kind: "governance", sponsor_id: npc!.id, threshold: { method: "majority_of_votes" }, opens_round: r.number + 1, closes_round: r.number + 1 + Number(p.closes_in), status: "open" });
      return { motion: number };
    }
  }
}

export async function moves(db: Db, round: Round, onLedger?: Ledger): Promise<{ proposed: number; committed: number }> {
  const mode = await roomMode(db, round.campaignId);
  await loadLivePlaces(db);
  const b = await brief(db, round, mode);
  const live = mode === "live";
  const out = { proposed: 0, committed: 0 };
  let proposed: Move[] = [];
  try {
    const r = await ask<{ moves: Move[] }>(`${HOUSE}

Read the brief and propose at most ${MOVES_PER_NIGHT} moves for tonight, or none if the night needs none. A move is one of these types with these parameters:
- npc_initiative {npc_slug, player_slug, about}: a staff member or local writes to a player first, from their own wants (an offer, a warning, a question, a door closing). At most one a night.
- beat_shift {key, delta}: a scheduled item of mail goes out earlier or later by one or two days (delta −2..2).
- side_thread {kind: "person_at_place"|"place", place_slug?, clause, player_slug}: a depth-only thread for one player: a person at a known place, or a new place, spun from what they are chasing.
- consequence {kind: "security_notices"|"obligation", player_slug, npc_slug?, text, delta?}: Security notices a pattern in what a player has done, or a staff member's obligation toward a player moves (delta −0.3..0.3) for a reason.
- goal_offer {player_slug, goal_key}: a new Personal Goal from the pool for a player with none open. Pool keys: ${Object.keys(GOALS).join(", ")}.
- new_document {title, kind, aliases[], holder, clearance, body, from?, written?}: a document enters the index: a plain period paper in full (a memo, a log page, a letter) that a player can request or find; holder is an NPC slug, a place slug, or "records". Consequential.
- new_secret_character {name, title, department, public_profile, sheet{voice{register,rules,phrases,signoff}, wants_from_newcomer, will_trade[], never_says[], knows[], fears[]}, place_slug?, secret}: a named person who carries one secret of their own that is NOT the company's secret and touches no fixed canon. Consequential.
- fact {key, value}: a piece of world truth the engine should remember (key like "vane.sold_the_north_pasture"). Consequential.
- motion {body: "board"|"research-committee"|"safety-committee", npc_slug (a member), title, text, closes_in (2–5), stakes}: a staff member sponsors a motion. Consequential.

Prefer the smallest move that answers what players are doing. Never give away a theory, a culprit or a secret. Never repeat a reversed decision. Output JSON only: {"moves": [{"type": "...", "why": "one or two sentences", "params": {...}}]}.`, b.text, "room:propose", onLedger, { maxTokens: 1400, temperature: 0.5 });
    proposed = Array.isArray(r.data?.moves) ? r.data!.moves.slice(0, MOVES_PER_NIGHT) : [];
  } catch (e) { await record(db, b, { phase: "moves", kind: "propose", verdict: "error", reason: (e as Error).message.slice(0, 200), committed: false }); }
  let initiatives = 0;
  const ctx = await publicContext(db, round.campaignId);
  for (const raw of proposed) {
    out.proposed++;
    const v = validateMove(raw, b, ctx);
    if (!v.ok) { await record(db, b, { phase: "moves", kind: String(raw?.type ?? "?"), verdict: "rejected", reason: `invalid: ${v.reason}`, params: raw?.params, committed: false }); continue; }
    const m = v.move;
    if (m.type === "npc_initiative" && initiatives++ > 0) { await record(db, b, { phase: "moves", kind: m.type, verdict: "rejected", reason: "one initiative a night", params: m.params, committed: false }); continue; }
    const level = LEVEL2.has(m.type) ? 2 : 1;
    const draft = `${m.type}: ${m.why}\n${JSON.stringify(m.params, null, 1)}`;
    let c = await checks(db, b, m.type, draft, onLedger, playerFacingText(m));
    let final = m;
    if (blocked(c)) {
      // One revision with the objections, then reject.
      try {
        const rv = await ask<Move>(`${HOUSE}\n\nYour move was blocked by the checks below. Revise it once so the objections no longer apply, keeping the same type, or output {"type": "none"} to drop it. Output JSON only: {"type": "...", "why": "...", "params": {...}}.`, `${b.text}\n\nYOUR MOVE:\n${draft}\n\nOBJECTIONS:\n${[...c.continuity, ...c.skeptic, ...c.rules].map((x) => `- ${x}`).join("\n")}`, "room:revise", onLedger, { maxTokens: 1200, temperature: 0.4 });
        const rev = rv.data && rv.data.type === m.type ? validateMove(rv.data, b, ctx) : null;
        if (rev && rev.ok) { final = rev.move; c = await checks(db, b, final.type, `${final.type}: ${final.why}\n${JSON.stringify(final.params, null, 1)}`, onLedger, playerFacingText(final)); }
      } catch { /* fall through to rejection */ }
      if (blocked(c)) { await record(db, b, { phase: "moves", kind: m.type, level, verdict: "rejected", reason: "blocked by checks", params: final.params, checks: c, committed: false }); continue; }
    }
    let dis: { agree: boolean; reason: string } | null = null;
    if (level === 2) {
      dis = await dissent(b, final.type, `${final.type}: ${final.why}\n${JSON.stringify(final.params, null, 1)}`, onLedger);
      if (!dis.agree) { await record(db, b, { phase: "moves", kind: m.type, level, verdict: "rejected", reason: `dissent: ${dis.reason}`, params: final.params, checks: c, dissent: dis, committed: false }); continue; }
    }
    let touched: unknown = null;
    if (live) { try { touched = await commitMove(db, b, final, onLedger); out.committed++; } catch (e) { touched = { error: (e as Error).message.slice(0, 200) }; } }
    await record(db, b, { phase: "moves", kind: final.type, level, verdict: "commit", reason: final.why, params: final.params, checks: c, dissent: dis, committed: live && !(touched as { error?: string } | null)?.error, touched });
  }
  await writeLog(db, b, proposed, onLedger);
  return out;
}

/* The season log: one page the room writes for itself, and notes for tomorrow's brief. */
async function writeLog(db: Db, b: Brief, proposed: Move[], onLedger: Ledger) {
  const { data: tonight } = await db.from("room_decisions").select("phase, kind, verdict, reason, committed").eq("campaign_id", b.round.campaignId).eq("round", b.round.number).order("created_at");
  const decisions = (tonight ?? []).map((d) => `${d.phase}/${d.kind}: ${d.verdict}${d.committed ? "" : b.mode === "shadow" ? " (shadow)" : " (not committed)"} — ${(d.reason ?? "").slice(0, 160)}`);
  let log = `Round ${b.round.number}. ${decisions.length} decision(s).\n${decisions.map((d) => `- ${d}`).join("\n")}`;
  let notes: Record<string, unknown> = {};
  try {
    const r = await ask<{ log: string; notes: { heading: string; dropped: string[]; watch: string[] } }>(`${HOUSE}\n\nWrite tonight's page of the season log for this cohort: what the players did, what you decided and why (from the list), what you are building toward over the next few nights, and what you are leaving alone. Under 300 words, plain, in the past tense. Then notes for yourself for tomorrow. Output JSON only: {"log": "...", "notes": {"heading": "what you are building toward, one sentence", "dropped": ["..."], "watch": ["..."]}}.`, `${b.text}\n\nTONIGHT'S DECISIONS:\n${decisions.map((d) => `- ${d}`).join("\n") || "- none"}\n\nMOVES PROPOSED: ${JSON.stringify(proposed).slice(0, 2000)}`, "room:log", onLedger, { maxTokens: 700, temperature: 0.4 });
    if (r.data?.log) { log = r.data.log; notes = r.data.notes ?? {}; }
  } catch { /* the plain list stands */ }
  await db.from("room_log").upsert({ campaign_id: b.round.campaignId, round: b.round.number, log, notes, mode: b.mode }, { onConflict: "campaign_id,round" });
}
