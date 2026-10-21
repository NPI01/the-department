/* Synthetic players for simulated seasons (scripts/simulate.ts). Each is a
   model-driven agent that sees exactly what a real player sees (its own
   dispatches, letters, receipts, Case File and the Help reference), never the
   secret side, and writes what a real player writes: a reply to the dispatch
   with command lines, and letters to staff and colleagues. Its mail enters the
   engine the way the webhook's does: a trusted inbound correspondence row plus
   the route, grammar and extract jobs. Personas are fixed so runs compare. */
import { GOAL_BRIEFS } from "@/lib/game/goal-briefs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { chatJson, type LedgerRow } from "@/lib/cobble";
import { parseGrammar, parseSalutation, parseToLines } from "@/lib/email/inbound";
import { gameMailbox, newMessageId } from "@/lib/email/resend";
import { HELP_SECTIONS } from "@/lib/game/help";
import { deptName, labWorkFor } from "@/lib/engine/world";

type Db = SupabaseClient;

export type Persona = {
  name: string; identity: "credentialed" | "transfer" | "walk-in" | "referred"; specialization: "analyst" | "negotiator" | "operative" | "administrator";
  dept_prefs: string[]; skills: string[]; knowledge: string[]; bio: string; style: string;
};

export const PERSONAS: Persona[] = [
  { name: "Ruth Lindqvist", identity: "credentialed", specialization: "analyst", dept_prefs: ["information-systems", "applied-physics", "procurement-logistics"], skills: ["procedure", "accounting"], knowledge: ["computing", "personnel"], bio: "Came from a bank's data centre in Fargo. Reads everything twice.", style: "Methodical. Pulls files, examines them, analyzes what her department can, files evidence with committees. One or two orders a night, never over budget. Writes short, exact letters to staff; rarely to colleagues." },
  { name: "Dale Harker", identity: "walk-in", specialization: "operative", dept_prefs: ["corporate-security", "aerospace-systems", "biological-sciences"], skills: ["surveillance", "fieldcraft", "driving"], knowledge: ["security", "aviation"], bio: "Drove trucks out of Williston. Likes the night shift.", style: "Fieldwork. Travels, watches places after dark, signs out trucks and cameras, searches when he can. Takes risks, sometimes takes things. Terse letters, mostly to locals and guards." },
  { name: "Marjorie Pell", identity: "transfer", specialization: "negotiator", dept_prefs: ["personnel-administration", "procurement-logistics", "biological-sciences"], skills: ["persuasion", "interviewing"], knowledge: ["personnel", "press"], bio: "Transferred from the Royce office in Minneapolis. Knows how to work a room.", style: "People. Writes to everyone, staff and colleagues, two letters a night; lobbies committee members; proposes agreements and recruits informants; stands for the employee seat. Light on orders, heavy on correspondence. Warm, a little manipulative." },
  { name: "Tom Brekke", identity: "referred", specialization: "administrator", dept_prefs: ["procurement-logistics", "personnel-administration", "information-systems"], skills: ["procedure", "accounting"], knowledge: ["purchasing", "federal"], bio: "Referred by a director he will not name. Keeps his head down.", style: "Cautious and procedural. Holds often, guards his desk, requests files through channels, sponsors a motion when he can, votes on everything, uses forms. Writes careful memos to supervisors. Avoids anything that could be noticed." },
  { name: "Carla Osei", identity: "credentialed", specialization: "analyst", dept_prefs: ["biological-sciences", "advanced-materials", "applied-physics"], skills: ["instrumentation", "shorthand"], knowledge: ["biology", "metallurgy"], bio: "A veterinary degree and a year at a packing plant. Asks what the sample is.", style: "Curious and direct. Goes to see things (the barn, the jar), interviews scientists, researches subjects in the library, analyzes what she holds, trades copies with colleagues for lab work. Sometimes leaks to the paper when stonewalled. Plain letters." },
  { name: "Walt Sorensen", identity: "walk-in", specialization: "negotiator", dept_prefs: ["aerospace-systems", "corporate-security", "advanced-materials"], skills: ["driving", "persuasion"], knowledge: ["aviation", "local-history"], bio: "Grew up on a ranch near Stanley. Knows everyone's cousin.", style: "Local. Travels to Tagus and Minot, talks to ranchers and the sheriff, recruits locals as informants, trades favours, writes to colleagues to build a bloc, declares friends and enemies, occasionally reports someone to Security. Chatty, folksy letters." },
];

function reference(): string {
  return HELP_SECTIONS.map((s) => `## ${s.title}\n${s.intro ?? ""}\n${s.lines.map((l) => `- ${l.line}: ${l.what} Example: ${l.example.replace(/\n/g, " / ")}${l.note ? ` (${l.note})` : ""}`).join("\n")}`).join("\n\n");
}

export type Turn = { reply: string; letters: { to: string; subject: string; body: string }[] };

/* What the player sees this morning, from the record only. */
export async function playerView(db: Db, p: { campaignId: string; characterId: string; roundId: string; roundNo: number; prevOpenedAt: string | null }) {
  const [{ data: ch }, { data: dispatch }, { data: letters }, { data: items }, { data: goals }, { data: receipt }, { data: roster }] = await Promise.all([
    db.from("characters").select("name, title, divisions(name)").eq("id", p.characterId).single(),
    db.from("correspondence").select("subject, body_text, message_id").eq("round_id", p.roundId).contains("to_characters", [p.characterId]).eq("direction", "outbound").filter("raw->>letter_kind", "eq", "dispatch").order("received_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("correspondence").select("subject, body_text, from_character, raw, characters!correspondence_from_character_fkey(name)").eq("campaign_id", p.campaignId).eq("direction", "outbound").contains("to_characters", [p.characterId]).gte("received_at", p.prevOpenedAt ?? "1970-01-01").neq("raw->>letter_kind", "dispatch").order("received_at").limit(14),
    db.from("case_items").select("slug, title, kind, body, grade, status").eq("character_id", p.characterId).eq("status", "held").order("created_at", { ascending: false }).limit(24),
    db.from("character_goals").select("text, points, status, goal_key").eq("character_id", p.characterId).eq("status", "open"),
    db.from("events").select("payload").eq("kind", "grammar.recorded").contains("visible_to", [p.characterId]).order("id", { ascending: false }).limit(1).maybeSingle(),
    db.from("characters").select("name, title, player_id, npc_state, divisions(name)").eq("campaign_id", p.campaignId).eq("status", "active").order("name"),
  ]);
  const dept = (x: { divisions?: { name: string } | { name: string }[] | null }) => (Array.isArray(x.divisions) ? x.divisions[0]?.name : x.divisions?.name) ?? null;
  const listed = (roster ?? []).filter((r) => (r.npc_state as { listed?: boolean } | null)?.listed !== false);
  const directory = [
    `YOUR COHORT: ${listed.filter((r) => r.player_id).map((r) => `${r.name}${r.title ? `, ${r.title}` : ""}${dept(r) ? ` (${dept(r)})` : ""}`).join("; ")}`,
    `STAFF AND LOCALS: ${listed.filter((r) => !r.player_id).map((r) => `${r.name}${r.title ? `, ${r.title}` : ""}${dept(r) ? ` (${dept(r)})` : " (off campus)"}`).join("; ")}`,
  ].join("\n");
  const mail = (letters ?? []).map((l) => { const who = ((Array.isArray(l.characters) ? l.characters[0] : l.characters) as { name: string } | null)?.name ?? ((l.raw as { office?: { office: string } } | null)?.office?.office ?? "The Department"); return `FROM ${who} · "${l.subject ?? ""}"\n${String(l.body_text ?? "").slice(0, 1400)}`; }).join("\n\n---\n\n");
  // The Case File's Laboratory line, as the player would read it on the item.
  const lab = (i: { slug: string; title: string }) => { const d = labWorkFor(i.slug, i.title).map(deptName); return d.length ? `; laboratory: ${d.join(" or ")}` : ""; };
  const cabinet = (items ?? []).map((i) => `- ${i.slug} · ${i.title} (${i.kind}, ${i.grade}${lab(i)})${i.body ? `: ${String(i.body).replace(/\s+/g, " ").slice(0, 220)}…` : ""}`).join("\n");
  const rec = receipt?.payload as { onFile?: string[]; ignored?: string[] } | null;
  return {
    name: ch?.name ?? "", title: ch?.title ?? null, department: dept(ch ?? {}),
    dispatch: dispatch ? { subject: dispatch.subject as string, body: dispatch.body_text as string, messageId: dispatch.message_id as string | null } : null,
    // The goal as the personnel file shows it to a human: the text, and the brief's leads (exact index titles and orders).
    mail, cabinet, goals: (goals ?? []).map((g) => { const b = g.goal_key ? GOAL_BRIEFS[g.goal_key as string] : null; return `${g.text} (${g.points} points)${b ? `. Where to look, from your personnel file: ${b.leads.join(" ")} What would settle it: ${b.proof}` : ""}`; }), directory,
    lastReceipt: rec ? `ON FILE LAST TIME: ${(rec.onFile ?? []).join(" | ") || "nothing"}${rec.ignored?.length ? `\nNOT ACTED ON LAST TIME (fix these): ${rec.ignored.join(" | ")}` : ""}` : null,
  };
}

/* One turn: the model plays the character; its mail enters the engine as a real player's would. */
export async function playerTurn(db: Db, p: { campaignId: string; characterId: string; roundId: string; roundNo: number; prevOpenedAt: string | null; persona: Persona; email: string; mailToken: string }, onLedger?: (r: LedgerRow) => void | Promise<void>): Promise<{ turn: Turn | null; inserted: number; model: string | null }> {
  const v = await playerView(db, p);
  if (!v.dispatch) return { turn: null, inserted: 0, model: null };
  const system = `You are playing THE DEPARTMENT, a play-by-mail game of corporate intrigue set at Royce Industries, a research company in North Dakota, in October 1977. You are ${v.name}${v.title ? `, ${v.title}` : ""}${v.department ? ` in ${v.department}` : ""}. ${p.persona.bio}
YOUR WAY OF PLAYING: ${p.persona.style}
YOUR PERSONAL GOALS (confidential; they score points): ${v.goals.join("; ") || "none yet"}.

Each morning you get a dispatch with a lettered menu and news; during the day you write letters; at night your orders run. You answer the dispatch with command lines, and you may write letters to anyone in the directory. Use the lines exactly as this reference gives them; the clerk reads them literally and refunds what it cannot read:

${reference()}

RULES OF PLAY FOR YOU
- Choose one to three orders a night, within your Action Units (the dispatch states them; menu options cost what they say; ORDER: lines cost by what they ask). Some nights HOLD is right. Do not repeat an order the receipt said was not acted on without fixing it.
- Use what you hold: EXAMINE and ANALYZE items in your cabinet; SEND copies to colleagues whose department can analyze them; FILE evidence with a committee when you have it; VOTE on every open ballot; use IF … THEN trip-wires and PROTECT when colleagues might be after your desk.
- Write 0 to 2 letters, each to a named person from the directory, in character, 40 to 160 words, asking for something concrete or offering something. Address staff with their title. Letters go ONLY in the "letters" array: never put TO: lines or letter text in the reply. Never mention the game, rules, points or being an AI.
- Pursue your goals by the means your style favours. Respond to what arrived.

Output JSON only: {"reply": "<your reply to the dispatch: one command per line, plus at most two lines of note to the clerk>", "letters": [{"to": "<name>", "subject": "<subject>", "body": "<letter>"}]}`;
  const user = [
    `THIS MORNING'S DISPATCH:\n${v.dispatch.body}`,
    v.lastReceipt ? `YOUR LAST RECEIPT:\n${v.lastReceipt}` : "",
    v.mail ? `LETTERS THAT ARRIVED:\n${v.mail}` : "LETTERS THAT ARRIVED: none.",
    v.cabinet ? `YOUR CASE FILE (short names for orders):\n${v.cabinet}` : "YOUR CASE FILE: empty.",
    `DIRECTORY:\n${v.directory}`,
    "Play your turn. JSON only.",
  ].filter(Boolean).join("\n\n");
  let turn: Turn | null = null; let model: string | null = null;
  try {
    const { data, result } = await chatJson<Turn>([{ role: "system", content: system }, { role: "user", content: user }], { tag: "sim:player", temperature: 0.8, maxTokens: 1400, think: false, timeoutMs: 150_000, onLedger });
    model = result.model;
    if (data && typeof data.reply === "string") turn = { reply: data.reply, letters: Array.isArray(data.letters) ? data.letters.filter((l) => l && l.to && l.body).slice(0, 2) : [] };
  } catch { turn = null; }
  if (!turn) return { turn: null, inserted: 0, model };
  // The reply to the dispatch, then each letter, as the webhook would store them.
  const mailbox = gameMailbox().address;
  const inbound = async (subject: string, text: string, inReplyTo: string | null) => {
    const { names, body: unaddressed } = parseToLines(text);
    const bodyText = unaddressed.trim();
    const recipients = [...names.map((name) => ({ name })), ...parseSalutation(bodyText).names.map((name) => ({ name }))];
    const acts = parseGrammar(bodyText);
    const { data: row, error } = await db.from("correspondence").insert({ campaign_id: p.campaignId, direction: "inbound", message_id: newMessageId(), in_reply_to: inReplyTo, from_address: p.email, to_addresses: [mailbox.replace("@", `+${p.mailToken}@`)], subject, body_text: bodyText, raw: { sim: true, persona: p.persona.name }, auth: { token_present: true, token_matched: true, provider: null }, trusted: true }).select("id").single();
    if (error) throw new Error(error.message);
    await db.from("jobs").insert([
      { kind: "route", payload: { correspondence_id: row.id, recipients, sim: true } },
      { kind: "grammar", payload: { correspondence_id: row.id, acts, trusted: true, sim: true } },
      { kind: "extract", payload: { correspondence_id: row.id, sim: true } },
    ]);
  };
  let inserted = 0;
  await inbound(`Re: ${v.dispatch.subject}`, turn.reply, v.dispatch.messageId); inserted++;
  for (const l of turn.letters) { await inbound(l.subject || "A letter", `TO: ${l.to}\n\n${l.body}`, null); inserted++; }
  return { turn, inserted, model };
}
