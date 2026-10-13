/* Staff replies. A non-player character answers a letter in their own voice.

   The dossier is read from canon as synced into canon_docs: the public block
   in 02-personnel-directory.md and the secret row and entry in
   05-allegiance-matrix.md. The model writes in character; it may hint at or
   trade on what the character knows, but a guard keeps engine-only secret
   terms out of anything a player reads. Models narrate; they never decide
   votes, transfers or outcomes, so a staff reply can promise, deflect or
   demand, and nothing in the world changes until an order or vote does. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { chat, type LedgerRow } from "@/lib/cobble";
import { formBriefFor } from "@/lib/engine/forms";

export type CastSheet = {
  voice?: { register?: string; rules?: string[]; phrases?: string[]; signoff?: string };
  letterhead?: { name: string; place: string } | null;
  wants_from_newcomer?: string; will_trade?: string[]; never_says?: string[];
  protects?: string[]; resents?: string[]; knows?: (string | { fact: string; how?: string })[]; believes?: (string | { belief: string })[];
  checkable_lie?: { claim: string; truth: string; where_to_check?: string };
  breaking_point?: string; ladder?: Record<string, string>; goals?: string[]; fears?: string[];
};
export type Dossier = { name: string; title: string | null; department: string | null; publicBlock: string; secretRow: string; secretEntry: string; sheet: CastSheet | null; outsider: boolean };

async function canonDoc(db: SupabaseClient, path: string): Promise<string> {
  const { data } = await db.from("canon_docs").select("content").eq("path", path).maybeSingle();
  return (data?.content as string) ?? "";
}

/* The "**Name**" block and following bullets from the public directory. */
function blockFor(md: string, name: string): string {
  const lines = md.split("\n");
  const start = lines.findIndex((l) => l.trim().startsWith("**") && l.includes(name));
  if (start < 0) return "";
  const out = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) { if (lines[i].trim().startsWith("**") && !lines[i].trim().startsWith("*   **")) break; if (lines[i].startsWith("#")) break; out.push(lines[i]); }
  return out.join("\n").trim();
}

export async function loadDossier(db: SupabaseClient, c: { name: string; title: string | null; department: string | null; sheet?: CastSheet | null }): Promise<Dossier> {
  const [pub, sec] = await Promise.all([canonDoc(db, "canon/02-personnel-directory.md"), canonDoc(db, "canon/secret/05-allegiance-matrix.md")]);
  const surname = c.name.split(" ").pop() ?? c.name;
  const secretRow = sec.split("\n").find((l) => l.startsWith("|") && l.includes(surname)) ?? "";
  return { name: c.name, title: c.title, department: c.department, publicBlock: blockFor(pub, c.name), secretRow, secretEntry: blockFor(sec, c.name), sheet: c.sheet ?? null, outsider: !c.department };
}

/* The cast sheet as prompt text. Everything here is for the character's eyes;
   the guard and the Skeptic decide what reaches the player. */
function sheetBlock(s: CastSheet | null, episode: number): string {
  if (!s) return "";
  const li = (xs?: (string | { fact?: string; how?: string; belief?: string })[]) => (xs ?? []).map((x) => typeof x === "string" ? x : x.fact ? `${x.fact}${x.how ? ` (${x.how})` : ""}` : x.belief ?? "").filter(Boolean).map((x) => `- ${x}`).join("\n");
  const ladderKey = Object.keys(s.ladder ?? {}).find((k) => k.endsWith(String(episode))) ?? Object.keys(s.ladder ?? {})[0];
  return [
    s.voice ? `HOW YOU WRITE: ${s.voice.register ?? ""}. ${(s.voice.rules ?? []).join(" ")} Phrases you use: ${(s.voice.phrases ?? []).map((p) => `"${p}"`).join(", ")}. You sign: ${s.voice.signoff ?? ""}` : "",
    s.wants_from_newcomer ? `WHAT YOU WANT FROM A NEW JUNIOR EMPLOYEE: ${s.wants_from_newcomer}` : "",
    s.will_trade?.length ? `WHAT YOU WILL TRADE, FOR THE RIGHT PRICE:\n${li(s.will_trade)}` : "",
    s.never_says?.length ? `WHAT YOU NEVER PUT IN WRITING:\n${li(s.never_says)}` : "",
    s.protects?.length || s.resents?.length ? `YOU PROTECT: ${(s.protects ?? []).join(", ") || "nobody"}. YOU RESENT: ${(s.resents ?? []).join(", ") || "nobody"}.` : "",
    s.knows?.length ? `WHAT YOU KNOW (never stated outright; it shapes what you avoid):\n${li(s.knows)}` : "",
    s.believes?.length ? `WHAT YOU BELIEVE BUT CANNOT PROVE:\n${li(s.believes)}` : "",
    s.checkable_lie ? `A THING YOU SAY THAT IS NOT TRUE, AND KEEP SAYING: ${s.checkable_lie.claim}` : "",
    s.goals?.length ? `YOUR GOALS THIS SEASON:\n${li(s.goals)}` : "",
    s.fears?.length ? `YOUR FEARS:\n${li(s.fears)}` : "",
    s.breaking_point ? `WHAT WOULD MAKE YOU ABANDON CAUTION: ${s.breaking_point}` : "",
    ladderKey && s.ladder?.[ladderKey] ? `HOW FAR YOU GO AT THIS POINT IN THE STORY (${ladderKey.replace(/_/g, " ")}): ${s.ladder[ladderKey]}` : "",
  ].filter(Boolean).join("\n\n");
}

/* Engine-only terms that must never reach a player, whatever the model does. */
const SECRET_TERMS = /\bconvergence\b|68-24|\bthe keepers\b|\bkeepers\b|\bascendants?\b|\b1984\b|retrocausal|sublevel nine|\bkessler\b|omega point|marsh is alive|closed causal|causal loop|time loop|from the future|\bvetch\b|clara wren/i;

const WORLD = `It is October 1977 at Station R, the North Dakota campus of Royce Industries, a private research and development company. You work there. The Department of Special Research and Development ("the Department") coordinates sensitive projects; most staff do not know what it does. Period: no personal computers, no internet; memos, carbon copies, teletypes, telephone logs. Public matters this month: a scientist, Dr. Evelyn Marsh, "transferred out of state" on September 29; a technician, Paul Greeley, died in an industrial accident in July; ranchers report cattle found dead and cut; unmarked helicopters fly at night; the papers talk about a "Devil Cult" near the town of Tagus; Building 7 is marked restricted on some maps and absent from others.`;

/* What this character remembers. Read from the knowledge table by the caller:
   what they have said to this writer and to others (source 'stated'), and what
   this writer has told them (source 'told', written by the extract job). */
export type Memory = {
  saidToThisPerson: string[];
  saidToOthers: { to: string; text: string }[];
  heardFromThisPerson: string[];
  filed?: string[];                                 // forms this person has on file, e.g. "Form 14-B (S-77-001), Round 1"
};

export type ReplyInput = {
  dossier: Dossier;
  player: { name: string; title: string | null; department: string | null; badge?: string; bio?: string };
  letter: { subject: string | null; body: string; date: string; formNote?: string | null };
  thread: { from: string; body: string }[];       // earlier letters between the two, oldest first
  round: number;
  memory?: Memory;
  review?: boolean;                                 // Skeptic pass on each draft (default true)
  onLedger?: (r: LedgerRow) => void | Promise<void>;
};

export type Rejection = { draft: string; reasons: string[] };
export type StaffReply = { subject: string; body: string; shared: string[]; wants: string | null; model: string; guarded: boolean; rejected: Rejection[] };

/* How much a staff member lets slip, by how long the writer has been here.
   Round 1 is the writer's first Monday. The arc opens the ground in Episode 4;
   the first three episodes are suspicion, paperwork and one oddity at a time. */
export function pacing(round: number, outsider = false): string {
  if (outsider && round <= 3) return `DISCLOSURE, THIS WEEK. The writer is a Royce newcomer you have never met, and Royce people have given you reasons to be careful. Answer short. You may say what you have or have not heard, whether anyone else has called, what the papers print, and what you think of the company in general; that is your business and nobody's secret. You do not volunteer what you yourself have seen, you do not hand over anything you hold, you do not name local people, and you offer no theory about what anything was. One small local detail of your own day is welcome. If you want something from them, say so plainly.`;
  if (outsider) return `DISCLOSURE. You know this writer a little now. You may trade what you have heard for what they know, say what you have seen if it serves you, and name people you trust. You still offer no theory about what anything was, and you still never use the forbidden words.`;
  if (round <= 3) return `DISCLOSURE, THIS WEEK. The writer started this week; you do not know them and have no reason to trust them. Keep to your job: procedures, forms, schedules, who to see, what is and is not your department. You may let one small oddity show (a form that asks a strange question, a door that is always locked, a name typed over on a roster, a colleague who stopped coming to the cafeteria) but you do not explain it and you do not connect it to anything else. Do not raise the newspapers' stories (the cult, the cattle, the helicopters, the lights) yourself; if the writer raises them, answer as an employee would: take the report, play it down, or refer it on, without speculation and without a theory. Do not accuse, suspect or name colleagues. Do not say what Security, Research or the Department is looking into. You never report what any log, camera, sensor, radar or file showed; if you said you would look into something, it is in hand, or there is nothing to report yet. No threats of dismissal or revocation over a first letter. You do not judge whether what the writer saw was plausible or improbable, and you do not say what any record does or does not show; you take the report. Your private notes above are for how you feel, not for what you say.
THE MEASURE of a first-week reply, in the abstract: acknowledge what was reported; decline, briefly and without reasons, anything that is not the writer's business; ask for one routine thing in a form your office would really use; let one small, ordinary oddity from your own day show, invented fresh each time and never explained; end with how you expect to be written to. Do not borrow phrasing from these instructions; write in your own words.`;
  if (round <= 7) return `DISCLOSURE, SECOND WEEK. The writer has been here a week. You may acknowledge that people talk and that the papers print things, without endorsing any of it. You may ask one pointed question of your own. You may give one real crumb from your own work if the writer has earned it. Still no theories, no naming of suspects, no description of what any department is investigating.`;
  if (round <= 14) return `DISCLOSURE, LATER IN THE MONTH. You may hint at what you privately believe as your own opinion, hedged, and trade a real piece of information for one you want. You may name a colleague you distrust if you have a reason you can state. You still do not explain the plot and you still never use the forbidden words.`;
  return `DISCLOSURE. The writer is established. Speak as your private notes dispose you to, trading information for information, still without the forbidden words and still as a person who can be wrong.`;
}

/* Words a staff member would not put in writing to a newcomer in the first
   week unless the newcomer wrote them first. Checked only for rounds 1–3. */
const EARLY_TERMS = /\b(cults?|satan\w*|devil\w*|rituals?|occult\w*|sacrific\w*|covens?|mutilat\w*|conspirac\w*|cover-?ups?|disinformation)\b/gi;
/* Words that are fine in a refusal ("Security does not release surveillance imagery")
   and wrong in a finding ("the surveillance showed"). Flagged for the Skeptic, not rejected. */
const SOFT_TERMS = /\b(surveillance|sensors?|logs?|cameras?|cctv|footage|radar|investigat\w*|suspects?|suspicio\w*|interrogat\w*|anomal\w*|loyalty|jamming|manifests?|records?)\b/gi;

/* "the badge log shows you were", "our manifests list no aircraft", "sensors detected nothing":
   a record named and then read from. A refusal names the record without reading it. */
const FINDING = /\b(logs?|footage|sensors?|records?|manifests?|cameras?|radar|surveillance|files?|data|register|tapes?)\b[^.;:\n]{0,50}?\b(show(s|ed|ing)?|indicat\w+|confirm(s|ed)?|reveal\w*|detect\w+|recorded|found|list(s|ed)?|place[sd]?|puts?|contradict\w*|consistent|inconsistent)\b|\b(our|the)\s+(records?|logs?|manifests?|files?)\s+(show|list|indicate|place)\b|\bcross-referenc\w*\b/i;

export function findings(draft: string): string | null {
  const m = draft.match(FINDING);
  return m ? m[0] : null;
}

function stem(w: string): string { return w.toLowerCase().replace(/s$/, ""); }
function notTheirs(draft: string, playerLetter: string, re: RegExp): string[] {
  const theirs = new Set((playerLetter.match(re) ?? []).map(stem));
  const out = new Set<string>();
  for (const w of draft.match(re) ?? []) if (!theirs.has(stem(w))) out.add(w);
  return [...out];
}

export function leaks(draft: string, playerLetter: string, round: number): string[] {
  const out = new Set<string>();
  const m = draft.match(SECRET_TERMS); if (m) out.add(m[0]);
  if (round <= 3) for (const w of notTheirs(draft, playerLetter, EARLY_TERMS)) out.add(w);
  return [...out];
}

export function softFlags(draft: string, playerLetter: string, round: number): string[] {
  return round <= 3 ? notTheirs(draft, playerLetter, SOFT_TERMS) : [];
}

/* The Skeptic: a second, cheaper read of the draft against the pacing rules.
   Returns the reasons it fails, or none. */
export async function reviewDraft(draft: string, input: ReplyInput, temperature = 0.2): Promise<string[]> {
  const system = `You are the Skeptic, the continuity editor for a 1977 corporate-intrigue correspondence game played by email. A staff character has drafted a reply to a player's letter. Your only job is pacing: does the draft give away more than this character would at this point in the game?

THE RULE FOR THIS ROUND
${pacing(input.round, input.dossier.outsider)}

FAIL the draft only for one of these:
1. It offers a theory about what a specific event really was or who is behind it, or connects separate events (a sighting and a disappearance, a rumor and a department). Being suspicious of the writer, telling them to keep quiet, or a general opinion about people or the company ("the company men fly where they please") is not a theory.
2. It names, accuses or casts suspicion on a specific colleague before the rule above allows it.
3. A Royce employee, in the first week, reports findings: what logs, sensors, cameras or files showed, or what Security or Research has concluded. (An outsider saying what they have or have not heard, or whether anyone called, is not a finding.)
4. It uses technology that did not exist in 1977 (computers on desks, email, mobile phones, video recording as routine).

Do not fail a draft for tone, formality, word choice, length, bureaucratic jargon, demands, forms, deadlines, repeating something the character said before, or small invented details about the character's job. Those are the character's business. When in doubt, PASS.

Answer with one line, PASS or FAIL. For a FAIL, add up to three lines, each beginning "- ", each giving the rule number and then the offending phrase copied exactly from the draft inside double quotes, like: - 3 "the footage shows only routine patrol". Nothing else.`;
  const user = `ROUND ${input.round}. THE CHARACTER: ${input.dossier.name}${input.dossier.title ? `, ${input.dossier.title}` : ""}.\n\nTHE PLAYER WROTE:\n${input.letter.body.slice(0, 2500)}\n\nTHE DRAFT REPLY:\n${draft}`;
  try {
    const res = await chat([{ role: "system", content: system }, { role: "user", content: user }], { tag: `skeptic:${input.dossier.name}`, temperature, maxTokens: 250, think: false, timeoutMs: 60_000, onLedger: input.onLedger });
    const lines = res.text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length || /^pass\b/i.test(lines[0])) return [];
    // A reason only counts if the phrase it quotes is really in the draft; the editor imagines things.
    const norm = (t: string) => t.toLowerCase().replace(/[\u2018\u2019\u201c\u201d]/g, "'").replace(/\s+/g, " ");
    const hay = norm(draft);
    const reasons: string[] = [];
    for (const l of lines.slice(1)) {
      const m = l.match(/^-\s*(\d)?[^"\u201c]*["\u201c](.+?)["\u201d]\s*$/);
      if (!m) continue;
      const quote = norm(m[2]).replace(/"/g, "'");
      if (quote.length >= 8 && hay.includes(quote)) reasons.push(`rule ${m[1] ?? "?"}: "${m[2]}"`);
    }
    return reasons.slice(0, 3);
  } catch {
    return []; // the editor being unavailable never blocks a letter; the deterministic guard still ran
  }
}

export async function generateStaffReply(input: ReplyInput): Promise<StaffReply> {
  const d = input.dossier;
  const mem = input.memory;
  const memoryBlock = mem && (mem.saidToThisPerson.length || mem.saidToOthers.length || mem.heardFromThisPerson.length || mem.filed?.length)
    ? `\nWHAT YOU REMEMBER
${mem.heardFromThisPerson.length ? `This person has told you: ${mem.heardFromThisPerson.join("; ")}.\n` : ""}${mem.saidToThisPerson.length ? `You have already told this person: ${mem.saidToThisPerson.join("; ")}. Do not repeat it; build on it or move on.\n` : ""}${mem.saidToOthers.length ? `You have told others: ${mem.saidToOthers.map((s) => `(to ${s.to}) ${s.text}`).join("; ")}. Keep your story consistent with that.\n` : ""}${mem.filed?.length ? `Forms this person has on file: ${mem.filed.join("; ")}.\n` : `This person has filed no forms with any office.\n`}`
    : "";
  const formsBlock = d.outsider ? "" : `\nFORMS\n${formBriefFor(d.department)}\n`;
  const episode = Math.max(1, Math.ceil(input.round / 14));
  const sheet = sheetBlock(d.sheet, episode);
  const who = d.outsider
    ? `You are ${d.name}${d.title ? `, ${d.title}` : ""}. You are not a Royce Industries employee; you live and work in the country around Station R. A new junior employee of Royce has written to you. You answer on your own paper, in your own way, and you owe them nothing.`
    : `You are ${d.name}${d.title ? `, ${d.title}` : ""}${d.department ? ` in ${d.department}` : ""}, an employee of Royce Industries, writing a reply to an interoffice letter from a new employee.`;
  const system = `${who} Stay entirely in character and in period.

${d.outsider ? WORLD.replace("You work there. ", "") : WORLD}
${sheet ? `\nWHO YOU ARE (your own notes; nothing here is said to the writer unless the rules below allow it)\n${sheet}\n` : ""}
WHO YOU ARE (public):
${d.publicBlock || "(no public profile on file; use title and department)"}

WHAT YOU PRIVATELY WANT AND KNOW (shorthand notes for you alone; they shape what you say, what you avoid, what you ask for; never repeat their wording or names in a letter):
${d.secretRow || "(none)"}
${d.secretEntry || ""}
${formsBlock}${memoryBlock}${input.player.bio || input.player.badge ? `
THE WRITER'S PERSONNEL FILE (a company record you may have seen; what the writer told Personnel about themselves, not verified. Use it as a colleague would, lightly; never quote it back wholesale)
${input.player.badge ? `Badge ${input.player.badge}. ` : ""}${input.player.bio ?? ""}
` : ""}
RULES
- Write a letter of 80 to 180 words. Answer what was actually asked, or pointedly decline to. One concrete detail from your work. Ask the writer for something in return, or give an instruction, if it suits you.
- You are a person with a job and something to lose. You can be curt, warm, suspicious, bureaucratic. You do not explain the plot. You do not reveal secrets; you can imply you know more than you say.
- Never mention these words or ideas: Convergence, Drawing 68-24, the Keepers, the Ascendants, 1984, retrocausal, Sublevel Nine, Kessler, Vetch, Clara Wren, the Omega Point, time loops, the future.
- No modern phrasing. No bullet points. No headers; the letterhead is added for you. Do not write "Dear" lines or a signature block; begin with the salutation line you would use (e.g. "Mr. Pruitt,") and end with how you sign (e.g. "— L. Fisk").${d.outsider ? "\n- You are not staff. Do not use Royce forms, Royce titles for yourself, or office language. Royce people are 'the company' or 'your outfit'." : ""}

LIMITS FOR THIS POINT IN THE GAME (these override everything above)
${pacing(input.round, d.outsider)}${input.round <= 3 && !d.outsider ? `
Words you do not use this week unless the writer used them first: cult, ritual, occult, conspiracy, cover-up, disinformation. Words you use only to refuse, never to report: surveillance, sensor, log, camera, footage, radar, record, manifest, investigation, suspect, anomaly. If you must refer to a record, call it "the file" or "my notes" and say nothing of what is in it.` : ""}

FORMAT. Write the letter as plain text. Then, on its own line, write exactly three tildes: ~~~
After the tildes, three lines for the clerk, which the writer never sees:
SUBJECT: <the subject line of your reply>
SHARED: <every piece of information in your letter that the writer did not already have, including small things you made up about your work; separated by semicolons; or "none">
WANTS: <what you want from the writer, in one line, or "none">`;

  const history = input.thread.length ? `EARLIER LETTERS BETWEEN YOU, OLDEST FIRST:\n${input.thread.map((t) => `--- ${t.from} wrote:\n${t.body}`).join("\n\n")}\n\n` : "";
  const user = `${history}TODAY IS ${input.letter.date} (Round ${input.round}).\n\nLETTER FROM ${input.player.name}${input.player.title ? `, ${input.player.title}` : ""}${input.player.department ? ` (${input.player.department})` : ""}${input.letter.subject ? `\nSubject: ${input.letter.subject}` : ""}:\n\n${input.letter.body}${input.letter.formNote ? `\n\n[Clerk's note, not part of the letter: ${input.letter.formNote}]` : ""}\n\nWrite your reply.`;

  /* Letter above a "~~~" line; SUBJECT/SHARED/WANTS below it for the clerk. */
  const parse = (t: string) => {
    const clean = t.replace(/^```[a-z]*\n?|```$/gm, "").trim();
    const [top, ...rest] = clean.split(/^\s*~{3,}\s*$/m);
    const tail = rest.join("\n");
    const line = (k: string) => tail.match(new RegExp(`^\\s*${k}\\s*:\\s*(.+)$`, "im"))?.[1]?.trim() ?? null;
    let body = top.trim();
    let subject = line("SUBJECT");
    // If the model put a subject line on top of the letter instead, peel it.
    const m = body.match(/^\s*(?:subject|re)\s*:\s*([^\n]+)\n+/i);
    if (m) { subject = subject ?? m[1].trim(); body = body.slice(m[0].length).trim(); }
    if (subject) subject = subject.replace(/[\s:.]+$/, "").trim() || null;
    // The first line must address the writer, not the character's own name or title.
    const own = new RegExp(`^(?:dear\\s+)?(?:${[d.name.split(" ").pop() ?? "", ...(d.title ?? "").split(/[,\s]+/).filter((w) => w.length > 3)].filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*[,:—-]?\\s*$`, "i");
    const firstLine = body.split("\n")[0]?.trim() ?? "";
    if (firstLine && own.test(firstLine)) body = `Mr. ${input.player.name.replace(/\(.*?\)/g, "").trim().split(/\s+/).pop()},` + body.slice(body.indexOf("\n") >= 0 ? body.indexOf("\n") : body.length);
    const sharedRaw = line("SHARED"); const wantsRaw = line("WANTS");
    const shared = sharedRaw && !/^none\b/i.test(sharedRaw) ? sharedRaw.split(/;\s*/).map((x) => x.trim()).filter(Boolean) : [];
    const wants = wantsRaw && !/^none\b/i.test(wantsRaw) ? wantsRaw : null;
    return { body, subject, shared, wants, complete: rest.length > 0 };
  };
  const ask = (sys: string, tag: string, temperature: number) => chat([{ role: "system", content: sys }, { role: "user", content: user }], { tag, temperature, maxTokens: 1400, think: false, timeoutMs: 120_000, onLedger: input.onLedger });

  /* Draft, check, redraft once with the editor's notes, else fall back. */
  let guarded = false;
  const rejected: Rejection[] = [];
  let out: ReturnType<typeof parse> | null = null;
  let model = "";
  let feedback = "";
  for (let attempt = 0; attempt < 4 && !out; attempt++) {
    const res = await ask(system + feedback, attempt ? `npc:${d.name}:retry${attempt}` : `npc:${d.name}`, attempt ? 0.6 : 0.7);
    model = res.model;
    const draft = parse(res.text);
    const reasons: string[] = [];
    if (!draft.body) reasons.push("not a letter in the required format");
    else if (!draft.complete) reasons.push("the letter was cut off before the ~~~ block; write it shorter (under 180 words) and finish with the three clerk lines");
    else {
      const bad = leaks(draft.body, input.letter.body, input.round);
      if (bad.length) { guarded = true; reasons.push(`uses words you must not: ${bad.join(", ")}`); }
      const found = input.round <= 3 && !d.outsider ? findings(draft.body) : null;
      if (found) reasons.push(`reports what a record showed: "${found}"; this week you only take the report`);
      if (!reasons.length && input.review !== false) {
        // The editor is strict and sometimes wrong; a draft is rejected only when two reads agree.
        const first = await reviewDraft(draft.body, input, 0.2);
        if (first.length) { const second = await reviewDraft(draft.body, input, 0.5); if (second.length) reasons.push(...first, ...second.filter((r) => !first.includes(r))); }
      }
    }
    if (!reasons.length) { out = draft; break; }
    rejected.push({ draft: draft.body || `[unparsed] ${res.text.slice(0, 1500)}`, reasons });
    feedback = `\n\nAN EDITOR REJECTED YOUR PREVIOUS DRAFT${attempt ? "S" : ""}. Problems found:\n${rejected.flatMap((r) => r.reasons).map((r) => `- ${r}`).join("\n")}\nStart again from nothing with a different opening and a different shape of letter. Shorter is better. Do not repair the old draft; do not reuse its sentences. Stay within the LIMITS section.`;
  }
  if (!out) {
    // Last resort: a safe, in-character deferral rather than a leak or silence.
    const surname = input.player.name.replace(/\(.*?\)/g, "").trim().split(/\s+/).pop() || "Colleague";
    const sign = d.sheet?.voice?.signoff ? `— ${d.sheet.voice.signoff.replace(/^[—-]\s*/, "")}` : `— ${d.name.split(" ").map((w, i, a) => (i < a.length - 1 ? w[0] + "." : w)).join(" ")}`;
    out = d.outsider
      ? { body: `Mr. ${surname},\n\nI got your letter. I don't put things like this down on paper for people I haven't met. If you want to talk, you know where to find me; come on your own time, not the company's.\n\n${sign}`, subject: null, shared: [], wants: "A visit in person, on the writer's own time", complete: true }
      : { body: `Mr. ${surname},\n\nYour letter is received. I do not discuss matters of this kind in writing. Put what you have to say on the proper form, sign it, and bring it to my office by hand before the end of the week. Bring your badge and nothing else.\n\n${sign}`, subject: null, shared: [], wants: "A signed statement on the proper form, brought by hand", complete: true };
    guarded = true;
  }
  const subject = out.subject || (input.letter.subject ? (/^re:/i.test(input.letter.subject) ? input.letter.subject : `Re: ${input.letter.subject}`) : "Re: your letter");
  return { subject, body: out.body, shared: out.shared, wants: out.wants, model, guarded, rejected };
}
