import { createHmac, timingSafeEqual } from "node:crypto";

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
  | { kind: "select"; code: string }
  | { kind: "vote"; motion: string; choice: "for" | "against" | "abstain" }
  | { kind: "hold" }
  | { kind: "order"; verb: string; args: string }
  | { kind: "accept"; agreement: string }
  | { kind: "reject"; agreement: string }
  | { kind: "transfer"; amount: number; resource: string; to: string };

export function parseGrammar(text: string): GrammarAct[] {
  const acts: GrammarAct[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith(">")) continue; // quoted
    let m: RegExpMatchArray | null;
    // A line that is only a letter, or letters separated by commas/spaces
    // ("A", "A, C", "ORDER B"), picks options from the morning menu.
    if ((m = line.match(/^(?:ORDER\s*:?\s*)?([A-GX](?:\s*[,/ ]\s*[A-GX])*)\.?$/i))) {
      for (const c of m[1].toUpperCase().split(/[^A-GX]+/).filter(Boolean)) acts.push({ kind: "select", code: c });
      continue;
    }
    if ((m = line.match(/^VOTE\s+([A-Z0-9-]+)\s*:\s*(FOR|AGAINST|ABSTAIN|REMOVE|RETAIN)\b/i))) {
      const c = m[2].toUpperCase(); acts.push({ kind: "vote", motion: m[1].toUpperCase(), choice: c === "FOR" || c === "REMOVE" ? "for" : c === "ABSTAIN" ? "abstain" : "against" });
    } else if (/^HOLD\s*(POSITION)?\s*$/i.test(line)) acts.push({ kind: "hold" });
    else if ((m = line.match(/^ORDER\s*:\s*([A-Z_]+)\s*(.*)$/i))) acts.push({ kind: "order", verb: m[1].toLowerCase(), args: m[2].trim() });
    else if ((m = line.match(/^ACCEPT\s+(?:TREATY|AGREEMENT)\s+([A-Z0-9-]+)/i))) acts.push({ kind: "accept", agreement: m[1].toUpperCase() });
    else if ((m = line.match(/^REJECT\s+(?:TREATY|AGREEMENT)\s+([A-Z0-9-]+)/i))) acts.push({ kind: "reject", agreement: m[1].toUpperCase() });
    else if ((m = line.match(/^TRANSFER\s+(\d+)\s+([A-Z_]+)\s+TO\s+([a-z0-9._-]+)/i))) acts.push({ kind: "transfer", amount: Number(m[1]), resource: m[2].toLowerCase(), to: m[3].toLowerCase() });
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
  for (const l of lines) {
    if (/^On .{5,120} wrote:\s*$/.test(l) || /^-----Original Message-----/.test(l) || /^From: .+Sent: /.test(l)) break;
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
