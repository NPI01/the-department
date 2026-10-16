import { createHmac, timingSafeEqual } from "node:crypto";
import { parseFormSubmission } from "@/lib/engine/forms";

/* Resend signs webhooks the Svix way: headers svix-id, svix-timestamp,
   svix-signature; signed content is `${id}.${timestamp}.${rawBody}`; the
   secret is `whsec_` + base64; the signature header holds one or more
   `v1,<base64>` entries. Reject anything older than five minutes. */
export function verifySvix(rawBody: string, headers: Headers, secret: string | undefined): { ok: boolean; reason?: string } {
  if (!secret) return { ok: false, reason: "RESEND_WEBHOOK_SECRET not set" };
  const id = headers.get("svix-id"); const ts = headers.get("svix-timestamp"); const sig = headers.get("svix-signature");
  if (!id || !ts || !sig) return { ok: false, reason: "missing svix headers" };
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return { ok: false, reason: "stale timestamp" };
  const keyB64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const expected = createHmac("sha256", Buffer.from(keyB64, "base64")).update(`${id}.${ts}.${rawBody}`).digest();
  for (const part of sig.split(" ")) {
    const [ver, val] = part.split(",");
    if (ver !== "v1" || !val) continue;
    const given = Buffer.from(val, "base64");
    if (given.length === expected.length && timingSafeEqual(given, expected)) return { ok: true };
  }
  return { ok: false, reason: "signature mismatch" };
}

/* Local part → character slug + player token. "fletcher+k7f2" → {slug:"fletcher", token:"k7f2"} */
export function parseGameAddress(address: string, domain: string): { slug: string; token: string | null } | null {
  const m = address.trim().toLowerCase().match(/^([a-z0-9._-]+)(?:\+([a-z0-9]+))?@(.+)$/);
  if (!m || m[3] !== domain.toLowerCase()) return null;
  return { slug: m[1], token: m[2] ?? null };
}

/* The deterministic grammar for consequential acts. These lines, at the start
   of a line, are parsed without any model. Everything else is prose. */
export type GrammarAct =
  | { kind: "command"; name: "directory" | "help" | "resign" }
  | { kind: "form_request"; form: string }
  | { kind: "send"; item: string; to: string }
  | { kind: "elect"; motion: string; candidate: string }
  | { kind: "invitation"; answer: "accept" | "decline"; society: string }
  | { kind: "file"; item: string; with: string }
  | { kind: "select"; code: string }
  | { kind: "vote"; motion: string; choice: "for" | "against" | "abstain" }
  | { kind: "hold"; except?: string[] }
  | { kind: "order"; verb: string; args: string }
  | { kind: "conditional"; trigger: string; then: { kind: "select"; code: string } | { kind: "order"; verb: string; args: string } }
  | { kind: "declare"; what: "authorize" | "revoke" | "attitude"; to: string; attitude?: "friendly" | "neutral" | "hostile" }
  | { kind: "accept"; agreement: string }
  | { kind: "reject"; agreement: string }
  | { kind: "transfer"; amount: number; resource: string; to: string };

/* "also", "add", "plus" mean: keep what is on file and add these. Anything
   else means the reply replaces the earlier packet. */
export function replyMode(text: string): "append" | "replace" {
  return /\b(also|add|adding|plus|in addition|as well|too)\b/i.test(text) ? "append" : "replace";
}

const CUE = /\b(do|does|doing|choose|chose|pick|take|taking|option|options|go with|go for|select|want|like|try|then|plus|and|instead|switch to|change to|also|letter|keep|keeping|stick with|stay with)\b/i;

/* The lines after an ORDER: line that belong to it: up to a blank line, a
   quoted line, another command, or a sign-off. Indexes into `lines`. */
const COMMAND_START = /^(?:ORDER\s*:|STANDING ORDER|FALLBACK|AUTHORIZE\s|REVOKE\s|ATTITUDE\s|VOTE\s|HOLD\b|H\.?$|ACCEPT\s|DECLINE\s|REFUSE\s|REJECT\s|TRANSFER\s|FILE\s|SEND\s|GIVE\s|FORWARD\s|FORM\s|DIRECTORY\b|HELP\b|RESIGN\b|[A-GX](?:\s*[,/ ]\s*[A-GX])*\.?$)/i;
const SIGN_OFF = /^(?:thanks|thank you|best|regards|cheers|sincerely|yours|--|—|sent from)\b/i;
export function orderContinuation(lines: string[], i: number): number[] {
  const out: number[] = [];
  for (let j = i + 1; j < lines.length; j++) {
    const l = lines[j].trim();
    if (!l || l.startsWith(">") || COMMAND_START.test(l) || /^IF\s/.test(l) || SIGN_OFF.test(l) || /^On .{5,120} wrote:\s*$/.test(l)) break;
    out.push(j);
  }
  return out;
}

/* The order a conditional fires: a letter from the morning's list, ORDER: and a
   verb or prose, or just the prose. */
function thenPart(text: string): { kind: "select"; code: string } | { kind: "order"; verb: string; args: string } {
  const t = text.trim().replace(/^(?:ORDER\s*:\s*)?/i, "").trim();
  let m: RegExpMatchArray | null;
  if ((m = t.match(/^(?:option\s+)?([A-G])\.?$/i))) return { kind: "select", code: m[1].toUpperCase() };
  if ((m = t.match(/^([A-Z][A-Z_]{2,})\b\s*(.*)$/))) return { kind: "order", verb: m[1].toLowerCase(), args: m[2].trim() };
  return { kind: "order", verb: "freeform", args: t };
}

export function parseGrammar(text: string): GrammarAct[] {
  const acts: GrammarAct[] = [];
  // A filled-in form is a block of numbered answers; none of its lines are acts.
  // A bare "FORM 14-B" line asks for a blank.
  const form = parseFormSubmission(text);
  const filled = form && Object.keys(form.answers).length > 0;
  if (form && !filled) acts.push({ kind: "form_request", form: form.form });
  const lines = text.split(/\r?\n/);
  const consumed = new Set<number>();
  for (const [i, raw] of lines.entries()) {
    if (consumed.has(i)) continue;
    if (form && i >= form.startLine && i <= (filled ? form.endLine : form.startLine)) continue;
    const line = raw.trim();
    if (line.startsWith(">")) continue; // quoted
    let m: RegExpMatchArray | null;
    // Prose with a choice in it: "I'd also like to do D", "let's go with A and C".
    // A capital letter standing alone, not at the start of the line, in a short
    // line that has a cue word. Lowercase a/i never count (articles, pronouns).
    const soft = (): boolean => {
      if (line.split(/\s+/).length > 20 || !CUE.test(line)) return false;
      // "B instead of C", "not C", "drop C": the letter after the negation is excluded.
      const excluded = new Set([...line.matchAll(/\b(?:instead of|rather than|not|drop|remove|cancel|without|scratch)\s+(?:option\s+)?([A-GX])(?![A-Za-z0-9])/gi)].map((x) => x[1].toUpperCase()));
      const found = [...line.matchAll(/(?<![A-Za-z0-9'"])([A-GX])(?![A-Za-z0-9])/g)].filter((x) => x.index! > 0).map((x) => x[1]).filter((c) => !excluded.has(c));
      if (!found.length || found.length > 4) return excluded.size > 0;
      for (const c of [...new Set(found)]) acts.push({ kind: "select", code: c });
      return true;
    };
    // A line that is only a letter, or letters separated by commas/spaces
    // ("A", "A, C", "ORDER B"), picks options from the morning menu.
    if ((m = line.match(/^(?:ORDER\s*:?\s*)?(DIRECTORY|HELP|RESIGN)\.?$/i))) { acts.push({ kind: "command", name: m[1].toLowerCase() as "directory" | "help" | "resign" }); continue; }
    if ((m = line.match(/^(?:ORDER\s*:?\s*)?([A-GX](?:\s*[,/ ]\s*[A-GX])*)\.?$/i))) {
      for (const c of m[1].toUpperCase().split(/[^A-GX]+/).filter(Boolean)) acts.push({ kind: "select", code: c });
      continue;
    }
    if ((m = line.match(/^(ACCEPT|DECLINE|REFUSE)\s+(?:THE\s+)?INVITATION(?:\s+(?:FROM|TO|OF)?\s*(.+?))?\.?$/i))) { acts.push({ kind: "invitation", answer: m[1].toUpperCase() === "ACCEPT" ? "accept" : "decline", society: (m[2] ?? "").trim() }); continue; }
    if ((m = line.match(/^FILE\s+["\u201c]?(.+?)["\u201d]?\s+WITH\s+(?:THE\s+)?(.+?)\.?$/i))) { acts.push({ kind: "file", item: m[1].trim(), with: m[2].trim() }); continue; }
    if ((m = line.match(/^(?:SEND|GIVE|FORWARD)\s+(?:A\s+COPY\s+OF\s+)?["\u201c]?(.+?)["\u201d]?\s+TO\s+(.+?)\.?$/i))) { acts.push({ kind: "send", item: m[1].trim(), to: m[2].trim() }); continue; }
    if ((m = line.match(/^VOTE\s+(E-[A-Z0-9-]+)\s*:\s*(.+?)\.?$/i)) && !/^(FOR|AGAINST|ABSTAIN)$/i.test(m[2].trim())) { acts.push({ kind: "elect", motion: m[1].toUpperCase(), candidate: m[2].trim() }); continue; }
    if ((m = line.match(/^VOTE\s+([A-Z0-9-]+)\s*:\s*(FOR|AGAINST|ABSTAIN|REMOVE|RETAIN)\b/i))) {
      const c = m[2].toUpperCase(); acts.push({ kind: "vote", motion: m[1].toUpperCase(), choice: c === "FOR" || c === "REMOVE" ? "for" : c === "ABSTAIN" ? "abstain" : "against" });
    } else if ((m = line.match(/^(?:H\.?|HOLD(?:\s+POSITION)?)(?:\s+EXCEPT\s+(.+?))?\.?\s*$/i))) acts.push(m[1] ? { kind: "hold", except: m[1].split(/\s*(?:,|;|\band\b)\s*/i).map((x) => x.trim()).filter(Boolean) } : { kind: "hold" });
    else if (/^IF\s/.test(line) && (m = line.match(/^IF\s+(.+?)\s*(?:,?\s*THEN\b|:)\s*(.+)$/i))) {
      // IF <trigger> THEN <order>, in capitals so that "If you can, then write" in a
      // letter stays a sentence: filed now, judged after the night's first pass (contacts.ts).
      let rest = m[2].trim();
      for (const j of orderContinuation(lines, i)) { rest += " " + lines[j].trim(); consumed.add(j); }
      acts.push({ kind: "conditional", trigger: m[1].trim(), then: thenPart(rest) });
    }
    else if ((m = line.match(/^FALLBACK\s*:\s*(.+)$/i))) {
      let rest = m[1].trim();
      for (const j of orderContinuation(lines, i)) { rest += " " + lines[j].trim(); consumed.add(j); }
      acts.push({ kind: "conditional", trigger: "the order above fails", then: thenPart(rest) });
    }
    else if ((m = line.match(/^(AUTHORIZE|AUTHORISE|REVOKE)\s+(.+?)\.?$/i))) acts.push({ kind: "declare", what: m[1].toUpperCase() === "REVOKE" ? "revoke" : "authorize", to: m[2].trim() });
    else if ((m = line.match(/^ATTITUDE\s+(?:TOWARDS?\s+)?(.+?)\s*[:,]\s*(FRIENDLY|NEUTRAL|HOSTILE)\.?$/i))) acts.push({ kind: "declare", what: "attitude", to: m[1].trim(), attitude: m[2].toLowerCase() as "friendly" | "neutral" | "hostile" });
    else if ((m = line.match(/^ORDER\s*:\s*(.+)$/i))) {
      // "ORDER: REQUEST_FILES …" names an engine verb; "ORDER: I want to see
      // the directory" is prose and is kept whole for the morning ruling.
      // Mail clients wrap long lines, so an order runs on until a blank line,
      // another command, or a sign-off.
      let whole = m[1].trim();
      for (const j of orderContinuation(lines, i)) { whole += " " + lines[j].trim(); consumed.add(j); }
      const sv = whole.match(/^([A-Z][A-Z_]{2,})\b\s*(.*)$/);
      if (sv) acts.push({ kind: "order", verb: sv[1].toLowerCase(), args: sv[2].trim() });
      else acts.push({ kind: "order", verb: "freeform", args: whole });
    }
    else if ((m = line.match(/^ACCEPT\s+(?:TREATY|AGREEMENT)\s+([A-Z0-9-]+)/i))) acts.push({ kind: "accept", agreement: m[1].toUpperCase() });
    else if ((m = line.match(/^REJECT\s+(?:TREATY|AGREEMENT)\s+([A-Z0-9-]+)/i))) acts.push({ kind: "reject", agreement: m[1].toUpperCase() });
    else if ((m = line.match(/^TRANSFER\s+(\d+)\s+([A-Z_]+)\s+TO\s+([a-z0-9._-]+)/i))) acts.push({ kind: "transfer", amount: Number(m[1]), resource: m[2].toLowerCase(), to: m[3].toLowerCase() });
    else soft();
  }
  return acts;
}

/* "TO: <name>" lines at the top of a letter sent to the game mailbox name the
   in-game recipients. Returns the names and the body without those lines. */
export function parseToLines(text: string): { names: string[]; body: string } {
  const lines = text.split(/\r?\n/); const names: string[] = []; let i = 0;
  while (i < lines.length && (!lines[i].trim() || /^(TO|CC)\s*:/i.test(lines[i]))) {
    const m = lines[i].match(/^(?:TO|CC)\s*:\s*(.+)$/i);
    if (m) names.push(...m[1].split(/[,;]/).map((x) => x.replace(/<[^>]*>/g, "").trim()).filter(Boolean));
    i++;
  }
  return { names, body: names.length ? lines.slice(i).join("\n").trim() : text };
}

/* Strip quoted replies and signatures before anything reads the body. */
export function stripQuoted(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Gmail's attribution ("On Mon, Oct 12, 2026 at 11:12 AM The Department
    // <addr> wrote:") can wrap over two or three lines; join ahead to test it.
    const ahead = [l, lines[i + 1] ?? "", lines[i + 2] ?? ""].join(" ");
    if (/^On .{5,200}? wrote:\s*$/.test(l) || (/^On\b/.test(l) && /wrote:\s*(\s|$)/.test(ahead) && ahead.length < 320)) break;
    if (/^-----Original Message-----/.test(l) || /^From: .+Sent: /.test(l) || /^Sent from my (iPhone|iPad|Android)/.test(l)) break;
    if (/^--\s*$/.test(l)) break;
    if (l.trim().startsWith(">")) continue;
    out.push(l);
  }
  return out.join("\n").trim();
}

/* Resend's email.received event is metadata only; the body comes from the
   receiving API (full-access key). It can lag the event by seconds. */
export async function fetchReceived(id: string): Promise<{ text: string; html: string | null; headers: Record<string, string>; authentication: unknown } | null> {
  const key = process.env.RESEND_API_KEY;
  if (!id || !key) return null;
  try {
    const r = await fetch(`https://api.resend.com/emails/receiving/${id}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10_000) });
    if (!r.ok) { console.error(`[inbound] receiving API ${r.status} for ${id}: ${(await r.text()).slice(0, 200)} (key ${key.slice(0, 6)}…, len ${key.length})`); return null; }
    const j = await r.json();
    if (!j.text) console.error(`[inbound] receiving API returned no text for ${id}; keys=${Object.keys(j).join(",")}`);
    const headers: Record<string, string> = {};
    // Resend returns headers as an object map (measured 2026-10-11); accept the array form too.
    const raw = j.headers ?? {};
    if (Array.isArray(raw)) for (const h of raw as { name: string; value: string }[]) headers[String(h.name).toLowerCase()] = String(h.value);
    else for (const [k, v] of Object.entries(raw as Record<string, unknown>)) headers[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : String(v);
    return { text: String(j.text ?? ""), html: j.html ?? null, headers, authentication: j.authentication ?? null };
  } catch (e) { console.error(`[inbound] receiving API fetch failed for ${id}: ${(e as Error).message}`); return null; }
}

/* Who a letter is addressed to when the player wrote it the way people write
   letters: "Mr. Fisk," / "Dear Dr. Ely" / "Attn: Sloane" on the first lines.
   Also picks up a leading "Re: …" or "Subject: …" line as the subject. */
export function parseSalutation(text: string): { names: string[]; subject: string | null } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 4);
  const names: string[] = []; let subject: string | null = null;
  for (const l of lines) {
    let m: RegExpMatchArray | null;
    if ((m = l.match(/^(?:re|subject|subj)\s*:\s*(.+)$/i))) { subject = m[1].trim(); continue; }
    if ((m = l.match(/^(?:attn|attention|for)\s*:?\s*(.+?)[,:.]?$/i))) { names.push(m[1]); continue; }
    if ((m = l.match(/^(?:dear\s+)?((?:mr|mrs|ms|miss|dr|col|colonel|captain|capt|sheriff|deputy|sergeant|sgt|tech\.?\s*sgt|airman|reverend|rev|pastor|director|professor|prof)\.?\s+[A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)\s*[,:—-]?\s*$/i))) { names.push(m[1]); continue; }
    if ((m = l.match(/^dear\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)\s*[,:]?\s*$/i))) { names.push(m[1]); continue; }
  }
  return { names, subject };
}

/* "Mr. Fisk" → "fisk"; "Dr. Sarah Ely" → "ely"; "fisk@weird.delivery" → "fisk". */
export function surnameKey(name: string): string {
  const clean = name.replace(/<[^>]*>/g, "").replace(/@.*$/, "").replace(/\b(mr|mrs|ms|miss|dr|col|colonel|captain|capt|sheriff|deputy|sergeant|sgt|tech|airman|reverend|rev|pastor|director|professor|prof)\.?\s*/gi, "").replace(/[,.]/g, " ").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  return (parts[parts.length - 1] || "").toLowerCase();
}
