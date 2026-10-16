/* The morning dispatch: one letter per player at the campaign's dispatch time.
   Facts come from the engine (last night's orders and what became of them, what
   arrived, what is scheduled); the model narrates them and proposes the day's
   menu; the engine validates the menu, records it, and sends on the letterhead.
   Models narrate; they never decide outcomes, and nothing secret reaches them. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { chat, type LedgerRow } from "@/lib/cobble";
import { gameDate, letterLinks } from "@/lib/email/letter";
import { dispatchBallotLines, loadBallots } from "@/lib/game/ballots";
import { newMessageId } from "@/lib/email/resend";
import { recordMenu, renderMenu, type MenuOption } from "./dispatch";
import { rule } from "./rounds";
import { pressureFor, episodeOf } from "./world";
import { standingFor } from "./contacts";
import { listStanding, STANDING_UPKEEP } from "./standing";
import { proxiesOf } from "./proxies";

const SECRET_TERMS = /\bconvergence\b|68-24|\bthe keepers\b|\bkeepers\b|\bascendants?\b|\b1984\b|retrocausal|sublevel nine|\bkessler\b|omega point|marsh is alive|closed causal|causal loop|time loop|from the future|\bvetch\b|clara wren|\bsentinel\b|\bnightjar\b|\bchoir\b|\borpheus\b/i;

const VERBS: Record<string, string> = {
  request_files: "ask a department or Records for specific files",
  interview: "talk to a named person, on the record or over lunch",
  surveil: "watch a place or a person for a night",
  examine: "study something you hold or can reach",
  visit: "go somewhere on campus or in the county",
  lobby: "work on a committee member before a vote",
  submit_manifest: "file paperwork that puts something on the record",
  search: "look through a room, a drawer, a locker",
  attend: "be present at a meeting, a test, a service",
  research: "read up on a subject in the company library and the county records; a Research Brief by morning",
  requisition: "sign equipment out of Procurement stores: a camera, a cassette recorder, a motor pool truck for the night, a temporary badge",
  protect: "spend the night guarding your desk, one item, a file your department keeps, or your own movements",
  recruit: "ask a staff member or local who knows you to pass along what they see and hear, for 2 AU a round",
  analyze: "put something you hold through your department's laboratory; a report by morning if the department has something to say about it",
  travel: "drive beyond the fence to a town or a place and stay there until an order brings you home; orders there cost no further trip",
  sponsor_motion: "put a motion before the Board, the Research Committee or the Safety Committee; it opens with tomorrow's dispatch",
};

type Facts = {
  first: string; name: string; title: string | null; department: string | null;
  date: string; round: number; episodeRound: number; episodeTitle: string; au: number;
  lastNight: { label: string; status: string; ruling: string | null }[];
  mode: string | null;
  arrived: string[];
  scheduled: string[];
};

function fallbackMenu(f: Facts): MenuOption[] {
  return [
    { code: "A", verb: "request_files", args: `${f.department ?? "your department"} files touching last night's matter`, label: `Ask Records for ${f.department ?? "your department"}'s file on what you found`, cost: 6 },
    { code: "B", verb: "interview", args: "a colleague in your building", label: "Buy a colleague lunch and ask what they have heard", cost: 4 },
    { code: "C", verb: "surveil", args: "the perimeter road after dark", label: "Walk the perimeter road after dark and see what lands", cost: 10 },
    { code: "D", verb: "examine", args: "what arrived in the mail", label: "Go through what arrived in the mail, line by line", cost: 3 },
  ];
}

function fallbackText(f: Facts): { narrative: string; overnight: string[] } {
  const did = f.lastNight.filter((o) => o.status === "resolved");
  const narrative = [
    did.length
      ? `${f.first}, the night went the way nights here go: slowly, and then all at once. ${did.map((o) => o.label).join("; ")}. None of it is finished, and some of it has already been noticed.`
      : f.mode === "hold" ? `${f.first}, you kept your head down last night and your units with it. The building did not notice; the building notices very little, which is a thing to remember.` : `${f.first}, you sent no orders last night, so the night took its own course. Your desk is as you left it, except that it is not quite.`,
    `This is ${f.date}, Round ${f.round} of 14, ${f.episodeTitle}. Orders lock at 8:00 PM Eastern.`,
  ].join("\n\n");
  const overnight = f.arrived.length ? f.arrived.map((a) => a.replace(/;\s*the player has read (it|them)\.?$/i, "").replace(/^(\d+) letters from (.+?), the latest on "(.+)"$/, "$1 letters from $2, the latest headed \"$3\"").replace(/^a letter from (.+?) \(subject: (.+)\)$/, "a letter from $1, headed \"$2\"")) : ["Nothing came in the overnight mail that bore your name."];
  return { narrative, overnight };
}

/* What each verb looks like on the menu, with its target. */
const VERB_LINE: Record<string, (what: string) => string> = {
  request_files: (w) => `Ask Records for ${w}`,
  interview: (w) => `Talk to ${w}`,
  surveil: (w) => `Watch ${w} for a night`,
  examine: (w) => `Examine ${w}`,
  visit: (w) => `Go to ${w}`,
  lobby: (w) => `Lobby ${w}`,
  submit_manifest: (w) => `File ${w}`,
  search: (w) => `Search ${w}`,
  attend: (w) => `Attend ${w}`,
  research: (w) => `Research ${w}`,
  requisition: (w) => `Sign out ${w}`,
  protect: (w) => `Guard ${w}`,
  recruit: (w) => `Recruit ${w}`,
  analyze: (w) => `Analyze ${w}`,
  travel: (w) => `Drive to ${w}`,
  sponsor_motion: (w) => `Sponsor a motion ${w}`,
};

/* The line the player reads is the action and its target, built from the verb;
   the model's own line follows it as the reason when it reads as one. The
   model has written bare numbers in that column, and lines that never named
   the target ("Verifying the current count"), so it never stands alone. */
export function menuLabel(verb: string, args: string, modelLine: string): string {
  const what = args.replace(/^(the|a|an)\s/i, (x) => x.toLowerCase());
  const action = (VERB_LINE[verb] ?? ((w: string) => w))(what);
  const why = modelLine.trim();
  const usable = /[a-z]{3,}/i.test(why) && why.split(/\s+/).length >= 3 && !action.toLowerCase().includes(why.toLowerCase());
  return usable && action.length + why.length < 130 ? `${action}: ${why.charAt(0).toLowerCase()}${why.slice(1)}` : action;
}

/* The letter above a "~~~" line; OVERNIGHT and MENU lines below it. */
function parse(text: string): { narrative: string; overnight: string[]; menu: MenuOption[]; complete: boolean } {
  const clean = text.replace(/^```[a-z]*\n?|```$/gm, "").trim();
  const [top, ...rest] = clean.split(/^\s*~{3,}\s*$/m);
  const tail = rest.join("\n");
  const overnight = [...tail.matchAll(/^\s*[-•]\s+(.+)$/gm)].map((m) => m[1].trim()).filter(Boolean);
  const menu: MenuOption[] = [];
  for (const m of tail.matchAll(/^\s*([A-D])\s*\|\s*([a-z_]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(\d{1,2})\s*$/gim)) {
    const verb = m[2].toLowerCase(); const cost = Number(m[5]);
    if (!VERBS[verb] || cost < 3 || cost > 12) continue;
    menu.push({ code: m[1].toUpperCase(), verb, args: m[3].trim(), label: menuLabel(verb, m[3].trim(), m[4].trim().replace(/\.$/, "")), cost });
  }
  return { narrative: top.trim(), overnight, menu, complete: rest.length > 0 };
}

export async function composeDispatch(f: Facts, onLedger?: (r: LedgerRow) => void | Promise<void>): Promise<{ narrative: string; overnight: string[]; menu: MenuOption[]; model: string; fallback: boolean; rejected: { reason: string; text: string }[] }> {
  const system = `You write the morning dispatch for one player of a correspondence game set at Royce Industries, a private research company at Station R in north-central North Dakota, in October 1977. The dispatch is from Personnel & Administration; it is what the player reads first each day. Second person. Plain, exact, a little dry; corporate and bureaucratic cosmic horror enters through small specifics (a form, a signature, a door, a clock), never through exclamation. Period: no personal computers, no internet; memos, carbons, teletypes, telephone logs.

RULES
- Narrate only the facts you are given. Each order's outcome is stated in the facts (delivered, refused, referred, a sighting, nothing, a conversation, a ruling); render that outcome exactly, adding texture but never changing it: a refusal stays a refusal, a night that showed nothing showed nothing. Never a revelation, never a conclusion, never a document's full contents. Do not invent people who are not named in the facts; you may invent clerks, guards and weather.
- Letters the player received are theirs to read: name the sender and the subject, nothing more. Never quote, summarise or characterise what a letter said, and never say how many letters a person sent unless the facts give a number.
- Never use these words or ideas: Convergence, Drawing 68-24, the Keepers, the Ascendants, 1984, retrocausal, Sublevel Nine, Kessler, Vetch, Clara Wren, the Omega Point, time loops, the future, SENTINEL, NIGHTJAR, CHOIR, ORPHEUS.
- Do not explain the plot. Do not tell the player what to think. No bullet points or headers in the narrative.
- On a night with no orders, do not inventory the mail; the OVERNIGHT lines do that. Write the morning instead: the building, the weather, one small thing out of place on the desk, and the day ahead.
- Every MENU line names its target so a clerk could act on it: a person by name, a file by its title, a place by its name. Never "him", "the note", "the data".

FORMAT. Two short paragraphs of narrative (120 to 200 words in all). Then a line of exactly three tildes: ~~~
Then:
OVERNIGHT:
- three to five lines, each one thing that arrived or happened that the player would learn of this morning, drawn from the facts; a line may be mundane
MENU:
A | <verb> | <what, specifically> | <the line the player reads, 6 to 12 words> | <cost 3-12>
B | ...
C | ...
D | ...
Verbs you may use, and what they mean: ${Object.entries(VERBS).map(([k, v]) => `${k} (${v})`).join("; ")}. Menu options follow from last night and from what arrived; at least one is cheap and ordinary, at least one is risky.`;
  const user = [
    `TODAY: ${f.date}. Round ${f.round} of 14 (day ${f.episodeRound} of the episode "${f.episodeTitle}").`,
    `THE PLAYER: ${f.name}${f.title ? `, ${f.title}` : ""}${f.department ? ` (${f.department})` : ""}; first name ${f.first}. Action Units this morning: ${f.au}.`,
    f.lastNight.length ? `LAST NIGHT'S ORDERS AND WHAT THE CLERK RECORDED:\n${f.lastNight.map((o) => `- ${o.label} → ${o.status}${o.ruling ? ` (${o.ruling})` : ""}`).join("\n")}` : `LAST NIGHT: ${f.mode === "hold" ? "the player held (no orders; kept their units)" : "the player sent no orders"}.`,
    f.arrived.length ? `WHAT ARRIVED OR HAPPENED, FROM THE RECORD:\n${f.arrived.map((a) => `- ${a}`).join("\n")}` : "WHAT ARRIVED: nothing addressed to the player.",
    f.scheduled.length ? `SCHEDULED FOR TODAY (the company's calendar; mention only what the player would notice):\n${f.scheduled.map((a) => `- ${a}`).join("\n")}` : "",
    "Write the dispatch.",
  ].filter(Boolean).join("\n\n");
  const ask = (sys: string) => chat([{ role: "system", content: sys }, { role: "user", content: user }], { tag: "dispatch", temperature: 0.8, maxTokens: 1200, think: false, timeoutMs: 120_000, model: process.env.DISPATCH_MODEL || undefined, onLedger });
  let model = "";
  const rejected: { reason: string; text: string }[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await ask(attempt ? system + `\n\nYour previous draft was rejected: ${rejected[rejected.length - 1]?.reason ?? "it did not follow the format"}. Write it again, in the exact format: narrative, a line of three tildes, OVERNIGHT: with dashed lines, MENU: with four pipe-separated lines A to D.` : system);
      model = res.model;
      const out = parse(res.text);
      const bad = (out.narrative + " " + out.overnight.join(" ") + " " + out.menu.map((m) => m.label + m.args).join(" ")).match(SECRET_TERMS);
      // A menu short of four options is padded from the standard list rather than thrown away.
      const codes = new Set(out.menu.map((m) => m.code));
      const menu = [...out.menu, ...fallbackMenu(f).filter((m) => !codes.has(m.code))].slice(0, 4).map((m, i) => ({ ...m, code: "ABCD"[i] }));
      const overnight = out.overnight.length >= 2 ? out.overnight : fallbackText(f).overnight;
      const reason = !out.complete ? "no ~~~ line separating the letter from the clerk's lines" : out.narrative.length <= 200 ? "the narrative was too short" : bad ? `it used the word "${bad[0]}"` : out.menu.length < 2 ? "the MENU lines were missing or malformed (A | verb | what | line | cost)" : null;
      if (!reason) return { narrative: out.narrative, overnight, menu, model, fallback: false, rejected };
      rejected.push({ reason, text: res.text.slice(0, 1500) });
    } catch (e) { rejected.push({ reason: `model error: ${(e as Error).message.slice(0, 80)}`, text: "" }); }
  }
  const fb = fallbackText(f);
  return { ...fb, menu: fallbackMenu(f), model: model || "template", fallback: true, rejected };
}

/* Scheduled beats for a round from the beat sheet, player-facing kinds only. */
export function beatsFor(md: string, round: number): string[] {
  const out: string[] = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("| ")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 5) continue;
    const [, rounds, kind, beat] = cells;
    if (!/^\d/.test(rounds) || !["dispatch", "pressure", "decision"].includes(kind)) continue;
    const m = rounds.match(/^(\d+)(?:\s*[–-]\s*(\d+))?$/); if (!m) continue;
    const lo = Number(m[1]), hi = Number(m[2] ?? m[1]);
    if (round < lo || round > hi) continue;
    // The engine's notes to itself (how a tier is mitigated, open TBDs) are not for the player.
    const text = beat.replace(/`[^`]*`/g, "").replace(/^Tier \d+:\s*/i, "").replace(/\b(Mitigated by|TBD:?)[^.]*\.?/g, "").replace(/\s+/g, " ").trim();
    if (SECRET_TERMS.test(text)) continue;
    out.push(`${kind}: ${text}`);
  }
  return out;
}

export async function sendMorningDispatch(db: SupabaseClient, p: { roundId: string; characterId: string }, onLedger?: (r: LedgerRow) => void | Promise<void>): Promise<void> {
  const key = `dispatch:${p.roundId}:${p.characterId}`;
  const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
  if (dup) return;
  const { data: round } = await db.from("rounds").select("id, campaign_id, number, episode_round, opens_at, episodes(number, title)").eq("id", p.roundId).single();
  if (!round) throw new Error("round missing");
  const ep = (Array.isArray(round.episodes) ? round.episodes[0] : round.episodes) as { number: number; title: string } | null;
  const { data: ch } = await db.from("characters").select("id, name, title, divisions(name), players(email, mail_token, file_token, display_name)").eq("id", p.characterId).single();
  if (!ch) throw new Error("character missing");
  type P = { email: string; mail_token: string; file_token: string | null; display_name: string | null };
  const pl = (ch as unknown as { players?: P | P[] | null }).players;
  const player = Array.isArray(pl) ? pl[0] : pl;
  if (!player?.email) return;
  const department = (Array.isArray(ch.divisions) ? ch.divisions[0]?.name : (ch.divisions as { name: string } | null)?.name) ?? null;
  const first = ch.name.split(" ")[0];
  const { data: au } = await db.from("resources").select("balance").eq("character_id", ch.id).eq("kind", "au").maybeSingle();

  // Last night: the previous round's packet.
  const { data: prev } = await db.from("rounds").select("id, number, opens_at").eq("campaign_id", round.campaign_id).eq("number", round.number - 1).maybeSingle();
  const lastNight: Facts["lastNight"] = []; let mode: string | null = null;
  if (prev) {
    const { data: pk } = await db.from("order_packets").select("mode, orders(seq, verb, args, status, ruling)").eq("round_id", prev.id).eq("character_id", ch.id).maybeSingle();
    mode = (pk?.mode as string | undefined) ?? null;
    for (const o of ((pk?.orders ?? []) as { seq: number; verb: string; args: { text?: string; code?: string; outcome?: { kind: string; summary: string } }; status: string; ruling: string | null }[]).sort((a, b) => a.seq - b.seq)) {
      const outcome = o.args.outcome;
      const a = o.args as { conditional?: boolean; condition_label?: string; standing?: number };
      lastNight.push({ label: `${a.standing ? `Standing ${a.standing}: ` : ""}${a.conditional ? `IF ${a.condition_label ?? "the condition held"} THEN ` : ""}${o.verb.replace(/_/g, " ")}: ${o.args.text ?? ""}`.trim(), status: outcome ? `${o.status} (${outcome.kind})` : o.status, ruling: outcome?.summary ?? o.ruling });
    }
  }
  // What arrived since the previous round opened: staff letters, filed forms, closed ballots.
  const since = prev?.opens_at ?? new Date(Date.now() - 86400_000).toISOString();
  const arrived: string[] = [];
  const { data: letters } = await db.from("correspondence").select("subject, from_character, raw, characters!correspondence_from_character_fkey(name)").eq("direction", "outbound").contains("to_characters", [ch.id]).not("from_character", "is", null).gte("received_at", since).order("received_at").limit(20);
  const bySender = new Map<string, { n: number; subject: string | null }>();
  for (const l of letters ?? []) {
    if ((l.raw as { superseded?: boolean } | null)?.superseded) continue;
    const who = ((Array.isArray(l.characters) ? l.characters[0] : l.characters) as { name: string } | null)?.name ?? "a colleague";
    const cur = bySender.get(who) ?? { n: 0, subject: null }; bySender.set(who, { n: cur.n + 1, subject: l.subject ?? cur.subject });
  }
  for (const [who, v] of bySender) arrived.push(v.n === 1 ? `a letter from ${who} (subject: ${v.subject ?? "none"}); the player has read it` : `${v.n} letters from ${who}, the latest on "${v.subject ?? "no subject"}"; the player has read them`);
  const { data: evs } = await db.from("events").select("kind, payload").contains("visible_to", [ch.id]).gte("created_at", since).in("kind", ["form.filed", "motion.closed", "election.closed", "goal.met", "goal.failed", "contact.seen", "contact.watch", "condition.fired", "bulletin.published", "research.briefed", "equipment.returned", "equipment.seized", "contact.theft", "contact.theft_failed", "informant.lapsed", "directive.issued", "proxy.given"]).limit(16);
  for (const e of evs ?? []) { const v = e.payload as { form?: string; index?: string; motion_id?: string; number?: string; title?: string; passed?: boolean; winner_name?: string | null; awarded?: number; partial?: boolean; goal_key?: string; text?: string; condition?: string; issue?: string };
    if (e.kind === "contact.seen") arrived.push(`a contact report: ${v.text} (the player saw this themselves last night)`);
    if (e.kind === "contact.watch") arrived.push(`from the player's own desk, while they held: ${v.text}`);
    if (e.kind === "condition.fired") arrived.push(`the player's conditional order fired because ${v.condition}`);
    if (e.kind === "research.briefed") arrived.push(`the company library filed a Research Brief on "${(v as { subject?: string }).subject ?? "the subject asked for"}" in the player's Case File, under Research`);
    if (e.kind === "contact.theft" || e.kind === "contact.theft_failed") arrived.push(`from the player's own desk: ${v.text}`);
    if (e.kind === "proxy.given") arrived.push(`${(v as { from_name?: string }).from_name ?? "a colleague"} gave the player their proxy on ${(v as { motion?: string }).motion ?? "a ballot"}: unless they vote themselves, their vote follows the player's`);
    if (e.kind === "directive.issued") arrived.push(`an emergency directive, ${(v as { number?: string }).number ?? ""}, was issued by ${(v as { by_name?: string }).by_name ?? "an officer"}: ${(v as { label?: string }).label ?? ""}; it reached every desk as a memo`);
    if (e.kind === "informant.lapsed") arrived.push(`${(v as { name?: string }).name ?? "an informant"} has stopped answering: the consideration could not be paid this week`);
    if (e.kind === "equipment.returned") arrived.push(`the ${(v as { name?: string }).name ?? "equipment"} the player had signed out went back to stores at the end of its loan`);
    if (e.kind === "equipment.seized") arrived.push(`the ${(v as { name?: string }).name ?? "equipment"} the player held was collected: ${(v as { note?: string }).note ?? "seized"}`);
    if (e.kind === "bulletin.published") arrived.push(`the ${v.issue ?? "Minot Daily News"} came out this morning; a copy is in the player's Case File`); if (e.kind === "goal.met") arrived.push(`Personnel recorded one of the player's Personal Goals as ${v.partial ? "partly " : ""}met, worth ${v.awarded} points; the player will read the particulars on their file`); if (e.kind === "goal.failed") arrived.push(`Personnel recorded one of the player's Personal Goals as not met by the end of the episode`); if (e.kind === "form.filed") arrived.push(`the clerk filed your Form ${v.form} as ${v.index}`); if (e.kind === "motion.closed") arrived.push(`the ballot on ${v.number ?? "a motion"} "${v.title ?? ""}" closed: ${v.passed ? "carried" : "failed"}${(v as { finding?: string | null }).finding ? `; the body recorded a finding: ${(v as { finding?: string }).finding}` : ""}`); if (e.kind === "election.closed") arrived.push(`the election ${v.number ?? ""} closed: ${v.winner_name ? `${v.winner_name} takes the seat` : "no votes were cast; the seat stays empty"}`); }
  const { data: office } = await db.from("correspondence").select("subject, raw").eq("direction", "outbound").contains("to_characters", [ch.id]).is("from_character", null).gte("received_at", since).limit(8);
  for (const o of office ?? []) { const r = o.raw as { scripted?: string; office?: { office: string } | null } | null; if (r?.scripted) arrived.push(`a ${r.office ? `memo from ${r.office.office}` : "notice"}: "${o.subject ?? ""}"`); }
  // Open ballots go in their own section, written by the engine, not the model: the exact line to send must survive.
  const { ballots } = await loadBallots(db, round.campaign_id, ch.id);
  const ballotLines = dispatchBallotLines(ballots, letterLinks(player.file_token).file ?? null);
  const { data: beatDoc } = await db.from("canon_docs").select("content").eq("path", "canon/secret/09-episode-01-beats.md").maybeSingle();
  const epNo = ep?.number ?? episodeOf(round.number);
  const scheduled = epNo === 1 && beatDoc ? beatsFor(beatDoc.content as string, round.episode_round ?? round.number) : [];
  // The pressure band the day sits in, any episode; the player notices the symptom, never the tier.
  const band = pressureFor(epNo).find((t) => (round.episode_round ?? round.number) >= t.rounds[0] && (round.episode_round ?? round.number) <= t.rounds[1]);
  if (band && epNo !== 1) scheduled.push(`around the company: ${band.text}`);

  const facts: Facts = { first, name: ch.name, title: ch.title, department, date: gameDate(round.number), round: round.number, episodeRound: round.episode_round ?? round.number, episodeTitle: ep?.title ?? "Orientation", au: Number(au?.balance ?? 0), lastNight, mode, arrived, scheduled };
  const out = await composeDispatch(facts, onLedger);
  await recordMenu(db, round.campaign_id, round.id, ch.id, out.menu);
  const menuBlock = renderMenu(out.menu, facts.au).split("\n").slice(1).join("\n");
  // Standing declarations, written by the engine: the player's own, never anyone else's.
  const st = await standingFor(db, round.campaign_id, ch.id);
  const { data: loc } = await db.from("facts").select("value").eq("campaign_id", round.campaign_id).eq("key", `location.${ch.id}`).maybeSingle();
  const where = loc?.value as { name: string; round: number } | null;
  const sos = await listStanding(db, ch.id);
  const proxies = await proxiesOf(db, round.campaign_id, ch.id);
  const standingLines = [
    ...proxies.map((p) => `• Your proxy on ${p.motion} is with ${p.to_name}; a VOTE of your own takes it back, or PROXY ${p.motion} TO NOBODY.`),
    ...sos.map((s) => `• Standing ${s.seq}: ${s.label} — ${STANDING_UPKEEP} AU a round; CANCEL STANDING ${s.seq} ends it.`),
    ...(where ? [`• You are in ${where.name} (since Round ${where.round}). Orders there cost no further trip; any order on campus, or TRAVEL back, brings you home. Nobody is watching your desk while you are away.`] : []),
    ...(st.friendly.length ? [`• Friendly toward ${st.friendly.join(", ")}: they may pull ${department ?? "your department"}'s files, and your watch lets them pass.`] : []),
    ...(st.authorized.length ? [`• ${st.authorized.join(", ")} may pull ${department ?? "your department"}'s files (AUTHORIZE).`] : []),
    ...(st.hostile.length ? [`• Hostile toward ${st.hostile.join(", ")}: any sighting of them in your reports goes to Security the same night.`] : []),
  ];
  const body = [out.narrative, "", "## What arrived overnight", ...out.overnight.map((l) => `• ${l}`), ...(ballotLines.length ? ["", "## Ballots", ...ballotLines] : []), ...(standingLines.length ? ["", "## Standing", ...standingLines, "• Change these with AUTHORIZE, REVOKE or ATTITUDE <name>: FRIENDLY | NEUTRAL | HOSTILE. The people named are never told."] : []), "", "## Your orders for tonight", menuBlock].join("\n");
  const subject = `${facts.date} — Round ${round.number} of ${Number(await rule(db, round.campaign_id, "episode.rounds", 14))} — ${facts.episodeTitle}`;
  const { data: row, error } = await db.from("correspondence").insert({ campaign_id: round.campaign_id, round_id: round.id, direction: "outbound", message_id: newMessageId(), from_character: null, to_characters: [ch.id], to_addresses: [player.email], subject, body_text: body, raw: { letter_kind: "dispatch", model: out.model, fallback: out.fallback, menu: out.menu, rejected: out.rejected } }).select("id").single();
  if (error) throw new Error(error.message);
  await db.from("jobs").insert({ kind: "send", payload: { correspondence_id: row.id } });
  await db.from("events").insert({ campaign_id: round.campaign_id, round_id: round.id, phase: "open", kind: "dispatch.sent", payload: { character: ch.id, correspondence_id: row.id, model: out.model, fallback: out.fallback }, idempotency_key: key, visible_to: [ch.id] });
}
