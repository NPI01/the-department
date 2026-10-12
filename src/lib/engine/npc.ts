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

export type ReplyInput = {
  dossier: Dossier;
  player: { name: string; title: string | null; department: string | null };
  letter: { subject: string | null; body: string; date: string };
  thread: { from: string; body: string }[];       // earlier letters between the two, oldest first
  round: number;
  onLedger?: (r: LedgerRow) => void | Promise<void>;
};

export type StaffReply = { subject: string; body: string; shared: string[]; wants: string | null; model: string; guarded: boolean; rejected: string[] };

export async function generateStaffReply(input: ReplyInput): Promise<StaffReply> {
  const d = input.dossier;
  const system = `You are ${d.name}${d.title ? `, ${d.title}` : ""}${d.department ? ` in ${d.department}` : ""}, an employee of Royce Industries, writing a reply to an interoffice letter from a new employee. Stay entirely in character and in period.

${WORLD}

WHO YOU ARE (public):
${d.publicBlock || "(no public profile on file; use title and department)"}

WHAT YOU PRIVATELY WANT AND KNOW (shorthand notes for you alone; they shape what you say, what you avoid, what you ask for; never repeat their wording or names in a letter):
${d.secretRow || "(none)"}
${d.secretEntry || ""}

RULES
- Write a letter of 80 to 180 words. Answer what was actually asked, or pointedly decline to. One concrete detail from your work. Ask the writer for something in return, or give an instruction, if it suits you.
- You are a person with a job and something to lose. You can be curt, warm, suspicious, bureaucratic. You do not explain the plot. You do not reveal secrets; you can imply you know more than you say.
- Never mention these words or ideas: Convergence, Drawing 68-24, the Keepers, the Ascendants, 1984, retrocausal, Sublevel Nine, Kessler, Vetch, Clara Wren, the Omega Point, time loops, the future.
- No modern phrasing. No bullet points. No headers; the letterhead is added for you. Do not write "Dear" lines or a signature block; begin with the salutation line you would use (e.g. "Mr. Pruitt,") and end with how you sign (e.g. "— L. Fisk").

FORMAT. Write the letter as plain text. Then, on its own line, write exactly three tildes: ~~~
After the tildes, three lines for the clerk, which the writer never sees:
SUBJECT: <the subject line of your reply>
SHARED: <facts you chose to share, separated by semicolons, or "none">
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

  let guarded = false;
  const rejected: string[] = [];
  let res = await ask(system, `npc:${d.name}`, 0.8);
  let out = parse(res.text);
  if (!out.body || SECRET_TERMS.test(out.body)) {
    guarded = Boolean(out.body);
    rejected.push(out.body || `[unparsed] ${res.text.slice(0, 1500)}`);
    res = await ask(system + "\n\nYour previous draft mentioned something you must not, or was not a letter. Write the letter again, in the format above.", `npc:${d.name}:retry`, 0.6);
    out = parse(res.text);
  }
  if (!out.body || SECRET_TERMS.test(out.body)) {
    rejected.push(out.body || `[unparsed] ${res.text.slice(0, 1500)}`);
    // Last resort: a safe, in-character deferral rather than a leak or silence.
    const surname = input.player.name.replace(/\(.*?\)/g, "").trim().split(/\s+/).pop() || "Colleague";
    out = { body: `Mr. ${surname},\n\nYour letter is received. I am not in a position to discuss the matter you raise in writing. If it is urgent, come to my office; bring your badge and nothing else.\n\n— ${d.name.split(" ").map((w, i, a) => (i < a.length - 1 ? w[0] + "." : w)).join(" ")}`, subject: null, shared: [], wants: null };
    guarded = true;
  }
  const body = out.body;
  const subject = out.subject || (input.letter.subject ? (/^re:/i.test(input.letter.subject) ? input.letter.subject : `Re: ${input.letter.subject}`) : "Re: your letter");
  return { subject, body, shared: out.shared, wants: out.wants, model: res.model, guarded, rejected };
}
