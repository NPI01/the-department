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

export type Dossier = { name: string; title: string | null; department: string | null; publicBlock: string; secretRow: string; secretEntry: string };

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

export async function loadDossier(db: SupabaseClient, c: { name: string; title: string | null; department: string | null }): Promise<Dossier> {
  const [pub, sec] = await Promise.all([canonDoc(db, "canon/02-personnel-directory.md"), canonDoc(db, "canon/secret/05-allegiance-matrix.md")]);
  const surname = c.name.split(" ").pop() ?? c.name;
  const secretRow = sec.split("\n").find((l) => l.startsWith("|") && l.includes(surname)) ?? "";
  return { name: c.name, title: c.title, department: c.department, publicBlock: blockFor(pub, c.name), secretRow, secretEntry: blockFor(sec, c.name) };
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
};

export type ReplyInput = {
  dossier: Dossier;
  player: { name: string; title: string | null; department: string | null };
  letter: { subject: string | null; body: string; date: string };
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
export function pacing(round: number): string {
  if (round <= 3) return `DISCLOSURE, THIS WEEK. The writer started this week; you do not know them and have no reason to trust them. Keep to your job: procedures, forms, schedules, who to see, what is and is not your department. You may let one small oddity show (a form that asks a strange question, a door that is always locked, a name typed over on a roster, a colleague who stopped coming to the cafeteria) but you do not explain it and you do not connect it to anything else. Do not raise the newspapers' stories (the cult, the cattle, the helicopters, the lights) yourself; if the writer raises them, answer as an employee would: take the report, play it down, or refer it on, without speculation and without a theory. Do not accuse, suspect or name colleagues. Do not say what Security, Research or the Department is looking into. You never report what any log, camera, sensor, radar or file showed; if you said you would look into something, it is in hand, or there is nothing to report yet. No threats of dismissal or revocation over a first letter. You do not judge whether what the writer saw was plausible or improbable, and you do not say what any record does or does not show; you take the report. Your private notes above are for how you feel, not for what you say.
THE RIGHT LEVEL, for a first-week letter about a strange sighting (an example of the measure, not a text to copy): you note the report and the time; you say it has been logged and that Security does not comment on aircraft movements; you ask one routine thing (a signed statement on the proper form, or which gate they came through); you add one small, ordinary detail of your day (the form was reprinted last month with a new question on it, and nobody will say why); you close with an instruction to keep to channels.`;
  if (round <= 7) return `DISCLOSURE, SECOND WEEK. The writer has been here a week. You may acknowledge that people talk and that the papers print things, without endorsing any of it. You may ask one pointed question of your own. You may give one real crumb from your own work if the writer has earned it. Still no theories, no naming of suspects, no description of what any department is investigating.`;
  if (round <= 14) return `DISCLOSURE, LATER IN THE MONTH. You may hint at what you privately believe as your own opinion, hedged, and trade a real piece of information for one you want. You may name a colleague you distrust if you have a reason you can state. You still do not explain the plot and you still never use the forbidden words.`;
  return `DISCLOSURE. The writer is established. Speak as your private notes dispose you to, trading information for information, still without the forbidden words and still as a person who can be wrong.`;
}

/* Words a staff member would not put in writing to a newcomer in the first
   week unless the newcomer wrote them first. Checked only for rounds 1–3. */
const EARLY_TERMS = /\b(cults?|satan\w*|devil\w*|rituals?|occult\w*|sacrific\w*|covens?|mutilat\w*|conspirac\w*|cover-?ups?|jamming|disinformation|surveillance|logs?|sensors?|radar|cameras?|cctv|footage|investigat\w*|suspects?|suspicio\w*|interrogat\w*|revocation|revoked|dismissal|terminat\w*|insubordinat\w*|loyalty|anomal\w*)\b/gi;

export function leaks(draft: string, playerLetter: string, round: number): string[] {
  const out = new Set<string>();
  const m = draft.match(SECRET_TERMS); if (m) out.add(m[0]);
  if (round <= 3) {
    const theirs = new Set((playerLetter.match(EARLY_TERMS) ?? []).map((w) => w.toLowerCase().replace(/s$/, "")));
    for (const w of draft.match(EARLY_TERMS) ?? []) { const k = w.toLowerCase().replace(/s$/, ""); if (!theirs.has(k)) out.add(w); }
  }
  return [...out];
}

/* The Skeptic: a second, cheaper read of the draft against the pacing rules.
   Returns the reasons it fails, or none. */
export async function reviewDraft(draft: string, input: ReplyInput): Promise<string[]> {
  const system = `You are the Skeptic, the continuity editor for a 1977 corporate-intrigue correspondence game played by email. A staff character has drafted a reply to a player's letter. Your only job is pacing: does the draft give away more than this character would at this point in the game?

THE RULE FOR THIS ROUND
${pacing(input.round)}

FAIL the draft only for one of these:
1. It offers a theory about what an event really was or who is behind it, or connects separate events (a sighting and a disappearance, a rumor and a department). Being suspicious of the writer, or telling them to keep quiet, is not a theory.
2. It names, accuses or casts suspicion on a specific colleague before the rule above allows it.
3. In the first week, it reports findings: what logs, sensors, cameras or files showed, or what Security or Research has concluded.
4. It uses technology that did not exist in 1977 (computers on desks, email, mobile phones, video recording as routine).

Do not fail a draft for tone, formality, word choice, length, bureaucratic jargon, demands, forms, deadlines, repeating something the character said before, or small invented details about the character's job. Those are the character's business. When in doubt, PASS.

Answer with one line, PASS or FAIL. For a FAIL, add up to three lines, each beginning "- ", each giving the rule number and then the offending phrase copied exactly from the draft inside double quotes, like: - 3 "the footage shows only routine patrol". Nothing else.`;
  const user = `ROUND ${input.round}. THE CHARACTER: ${input.dossier.name}${input.dossier.title ? `, ${input.dossier.title}` : ""}.\n\nTHE PLAYER WROTE:\n${input.letter.body.slice(0, 2500)}\n\nTHE DRAFT REPLY:\n${draft}`;
  try {
    const res = await chat([{ role: "system", content: system }, { role: "user", content: user }], { tag: `skeptic:${input.dossier.name}`, temperature: 0.2, maxTokens: 250, think: false, timeoutMs: 60_000, onLedger: input.onLedger });
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
  const memoryBlock = mem && (mem.saidToThisPerson.length || mem.saidToOthers.length || mem.heardFromThisPerson.length)
    ? `\nWHAT YOU REMEMBER
${mem.heardFromThisPerson.length ? `This person has told you: ${mem.heardFromThisPerson.join("; ")}.\n` : ""}${mem.saidToThisPerson.length ? `You have already told this person: ${mem.saidToThisPerson.join("; ")}. Do not repeat it; build on it or move on.\n` : ""}${mem.saidToOthers.length ? `You have told others: ${mem.saidToOthers.map((s) => `(to ${s.to}) ${s.text}`).join("; ")}. Keep your story consistent with that.\n` : ""}`
    : "";
  const system = `You are ${d.name}${d.title ? `, ${d.title}` : ""}${d.department ? ` in ${d.department}` : ""}, an employee of Royce Industries, writing a reply to an interoffice letter from a new employee. Stay entirely in character and in period.

${WORLD}

WHO YOU ARE (public):
${d.publicBlock || "(no public profile on file; use title and department)"}

WHAT YOU PRIVATELY WANT AND KNOW (shorthand notes for you alone; they shape what you say, what you avoid, what you ask for; never repeat their wording or names in a letter):
${d.secretRow || "(none)"}
${d.secretEntry || ""}
${memoryBlock}
RULES
- Write a letter of 80 to 180 words. Answer what was actually asked, or pointedly decline to. One concrete detail from your work. Ask the writer for something in return, or give an instruction, if it suits you.
- You are a person with a job and something to lose. You can be curt, warm, suspicious, bureaucratic. You do not explain the plot. You do not reveal secrets; you can imply you know more than you say.
- Never mention these words or ideas: Convergence, Drawing 68-24, the Keepers, the Ascendants, 1984, retrocausal, Sublevel Nine, Kessler, Vetch, Clara Wren, the Omega Point, time loops, the future.
- No modern phrasing. No bullet points. No headers; the letterhead is added for you. Do not write "Dear" lines or a signature block; begin with the salutation line you would use (e.g. "Mr. Pruitt,") and end with how you sign (e.g. "— L. Fisk").

LIMITS FOR THIS POINT IN THE GAME (these override everything above)
${pacing(input.round)}${input.round <= 3 ? `
Words you do not use this week, whatever the writer says: surveillance, sensor, log, camera, CCTV, footage, radar, investigation, suspect, suspicious, interrogate, anomaly, loyalty, cult, ritual, occult, conspiracy, cover-up. If you must refer to a record, call it "the file" or "my notes" and say nothing of what is in it.` : ""}

FORMAT. Write the letter as plain text. Then, on its own line, write exactly three tildes: ~~~
After the tildes, three lines for the clerk, which the writer never sees:
SUBJECT: <the subject line of your reply>
SHARED: <every piece of information in your letter that the writer did not already have, including small things you made up about your work; separated by semicolons; or "none">
WANTS: <what you want from the writer, in one line, or "none">`;

  const history = input.thread.length ? `EARLIER LETTERS BETWEEN YOU, OLDEST FIRST:\n${input.thread.map((t) => `--- ${t.from} wrote:\n${t.body}`).join("\n\n")}\n\n` : "";
  const user = `${history}TODAY IS ${input.letter.date} (Round ${input.round}).\n\nLETTER FROM ${input.player.name}${input.player.title ? `, ${input.player.title}` : ""}${input.player.department ? ` (${input.player.department})` : ""}${input.letter.subject ? `\nSubject: ${input.letter.subject}` : ""}:\n\n${input.letter.body}\n\nWrite your reply.`;

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
    const sharedRaw = line("SHARED"); const wantsRaw = line("WANTS");
    const shared = sharedRaw && !/^none\b/i.test(sharedRaw) ? sharedRaw.split(/;\s*/).map((x) => x.trim()).filter(Boolean) : [];
    const wants = wantsRaw && !/^none\b/i.test(wantsRaw) ? wantsRaw : null;
    return { body, subject, shared, wants };
  };
  const ask = (sys: string, tag: string, temperature: number) => chat([{ role: "system", content: sys }, { role: "user", content: user }], { tag, temperature, maxTokens: 900, think: false, timeoutMs: 90_000, onLedger: input.onLedger });

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
    else {
      const bad = leaks(draft.body, input.letter.body, input.round);
      if (bad.length) { guarded = true; reasons.push(`uses words you must not: ${bad.join(", ")}`); }
      if (!reasons.length && input.review !== false) reasons.push(...(await reviewDraft(draft.body, input)));
    }
    if (!reasons.length) { out = draft; break; }
    rejected.push({ draft: draft.body || `[unparsed] ${res.text.slice(0, 1500)}`, reasons });
    feedback = `\n\nAN EDITOR REJECTED YOUR PREVIOUS DRAFT${attempt ? "S" : ""}. Problems found:\n${rejected.flatMap((r) => r.reasons).map((r) => `- ${r}`).join("\n")}\nStart again from nothing with a different opening and a different shape of letter. Shorter is better. Do not repair the old draft; do not reuse its sentences. Stay within the LIMITS section.`;
  }
  if (!out) {
    // Last resort: a safe, in-character deferral rather than a leak or silence.
    const surname = input.player.name.replace(/\(.*?\)/g, "").trim().split(/\s+/).pop() || "Colleague";
    out = { body: `Mr. ${surname},\n\nYour letter is received. I do not discuss matters of this kind in writing. Put what you have to say on the proper form, sign it, and bring it to my office by hand before the end of the week. Bring your badge and nothing else.\n\n— ${d.name.split(" ").map((w, i, a) => (i < a.length - 1 ? w[0] + "." : w)).join(" ")}`, subject: null, shared: [], wants: "A signed statement on the proper form, brought by hand" };
    guarded = true;
  }
  const subject = out.subject || (input.letter.subject ? (/^re:/i.test(input.letter.subject) ? input.letter.subject : `Re: ${input.letter.subject}`) : "Re: your letter");
  return { subject, body: out.body, shared: out.shared, wants: out.wants, model, guarded, rejected };
}
