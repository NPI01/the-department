import { Resend } from "resend";
import { randomUUID } from "node:crypto";

/* Outbound mail. Every message gets an engine-generated Message-ID so replies
   thread back to a correspondence row, and a plain-text part so it survives
   1977-flavoured mail clients and spam filters alike. */

export function emailDomain() { return process.env.EMAIL_DOMAIN || "weird.delivery"; }
export function emailFrom() { return process.env.EMAIL_FROM || `The Department <thedepartment@${emailDomain()}>`; }

/* The one mailbox every in-game letter leaves from and returns to. The in-game
   From and To live in the letter itself. A player's seal (mail_token) rides in
   the plus-part of the reply address so the inbound side can trust the sender
   even when the From header is forged. */
export function gameMailbox() {
  const from = emailFrom();
  const address = (from.match(/<([^>]+)>/)?.[1] ?? from).trim().toLowerCase();
  const local = address.split("@")[0];
  return { address, local, reply: (token: string) => `${local}+${token}@${emailDomain()}` };
}

/* Kept for the legacy per-character addressing some tests use. */
export function characterAddress(characterSlug: string, playerToken?: string) {
  return playerToken ? `${characterSlug}+${playerToken}@${emailDomain()}` : `${characterSlug}@${emailDomain()}`;
}

export function newMessageId() { return `<${randomUUID()}@${emailDomain()}>`; }

export type OutboundMail = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string[];
  messageId?: string;
};

export async function sendMail(m: OutboundMail): Promise<{ id: string | null; messageId: string; error: string | null }> {
  const key = process.env.RESEND_API_KEY;
  const messageId = m.messageId ?? newMessageId();
  if (!key) return { id: null, messageId, error: "RESEND_API_KEY not set" };
  const resend = new Resend(key);
  const headers: Record<string, string> = { "Message-ID": messageId };
  if (m.inReplyTo) headers["In-Reply-To"] = m.inReplyTo;
  if (m.references?.length) headers["References"] = m.references.join(" ");
  const { data, error } = await resend.emails.send({
    from: m.from ?? emailFrom(),
    to: m.to,
    subject: m.subject,
    text: m.text,
    html: m.html,
    replyTo: m.replyTo,
    headers,
  });
  return { id: data?.id ?? null, messageId, error: error ? error.message : null };
}
