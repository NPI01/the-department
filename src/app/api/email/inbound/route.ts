import { NextRequest } from "next/server";
import { verifySvix, parseGameAddress, parseGrammar, stripQuoted } from "@/lib/email/inbound";
import { emailDomain } from "@/lib/email/resend";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";

async function fetchReceived(id: string): Promise<{ text: string; html: string | null; headers: Record<string, string> } | null> {
  const key = process.env.RESEND_API_KEY;
  if (!id || !key) return null;
  try {
    const r = await fetch(`https://api.resend.com/emails/receiving/${id}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return null;
    const j = await r.json();
    const headers: Record<string, string> = {};
    for (const h of (j.headers ?? []) as { name: string; value: string }[]) headers[String(h.name).toLowerCase()] = h.value;
    return { text: String(j.text ?? ""), html: j.html ?? null, headers };
  } catch { return null; }
}

/* Resend → us. Pipeline (docs/00-plan-audit.md §3):
   verify signature → store the original immutably → resolve sender and recipients →
   parse the deterministic grammar → enqueue model extraction (non-blocking).
   Idempotent on the provider's email id. Always 200 after verification so
   Resend does not retry a message we have already stored. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const v = verifySvix(raw, req.headers, process.env.RESEND_WEBHOOK_SECRET);
  if (!v.ok) return Response.json({ error: v.reason }, { status: 401 });

  let evt: { type?: string; data?: Record<string, unknown> };
  try { evt = JSON.parse(raw); } catch { return Response.json({ error: "bad json" }, { status: 400 }); }
  if (evt.type !== "email.received") return Response.json({ ignored: evt.type });
  const d = (evt.data ?? {}) as Record<string, unknown>;
  const domain = emailDomain();

  // The email.received event carries metadata only (to, from, subject,
  // email_id, message_id, attachments). The body comes from the receiving
  // API, which needs a full-access key. Measured 2026-10-11.
  const full = await fetchReceived(String(d.email_id ?? ""));
  if (full) { d.text = full.text; d.html = full.html; d.headers = full.headers; }

  const toList = ([] as string[]).concat((d.to as string[] | string) ?? []);
  const ccList = ([] as string[]).concat((d.cc as string[] | string) ?? []);
  const recipients = [...toList, ...ccList].map((a) => parseGameAddress(a, domain)).filter(Boolean) as { slug: string; token: string | null }[];
  const token = recipients.find((r) => r.token)?.token ?? null;
  const fromAddress = String(d.from ?? "").replace(/^.*<([^>]+)>.*$/, "$1").toLowerCase();
  const bodyText = stripQuoted(String(d.text ?? ""));
  const acts = parseGrammar(bodyText);

  if (!supabaseConfigured()) {
    // Local development without a database: show what would have happened.
    return Response.json({ stored: false, from: fromAddress, recipients, token_present: Boolean(token), acts });
  }

  const db = supabaseAdmin();
  const { data: player } = await db.from("players").select("id, mail_token").eq("email", fromAddress).maybeSingle();
  const trusted = Boolean(player && token && player.mail_token === token);

  const providerId = String(d.email_id ?? d.id ?? "");
  const messageId = String((d.headers as Record<string, string> | undefined)?.["message-id"] ?? d.message_id ?? (providerId ? `<${providerId}@resend>` : ""));
  const { data: row, error } = await db.from("correspondence").upsert({
    campaign_id: process.env.CAMPAIGN_ID, // single-campaign v1; routed per domain later
    direction: "inbound",
    message_id: messageId || null,
    in_reply_to: (d.headers as Record<string, string> | undefined)?.["in-reply-to"] ?? null,
    from_address: fromAddress,
    to_addresses: [...toList, ...ccList],
    subject: String(d.subject ?? ""),
    body_text: bodyText,
    body_html: (d.html as string) ?? null,
    raw: d,
    auth: { token_present: Boolean(token), token_matched: trusted },
    trusted,
  }, { onConflict: "message_id" }).select("id").single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Consequential acts only from a trusted sender; the rest waits for confirmation.
  await db.from("jobs").insert([
    { kind: "route", payload: { correspondence_id: row.id, recipients } },
    { kind: "grammar", payload: { correspondence_id: row.id, acts, trusted } },
    { kind: "extract", payload: { correspondence_id: row.id } },
  ]);
  return Response.json({ stored: true, id: row.id, trusted, acts: acts.length });
}
