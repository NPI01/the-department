"use server";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email/resend";
import { renderSample, templateByKey, type TemplateFields } from "@/lib/email/templates";

export type MailState = { ok?: string; error?: string } | undefined;

const FIELDS: (keyof TemplateFields)[] = ["label", "subject", "preheader", "classification", "fromName", "fromTitle", "date", "body", "signatureName", "signatureTitle"];

function readFields(fd: FormData): TemplateFields {
  return Object.fromEntries(FIELDS.map((k) => [k, String(fd.get(k) ?? "")])) as TemplateFields;
}

export async function saveTemplate(_: MailState, fd: FormData): Promise<MailState> {
  const admin = await requireAdmin();
  const def = templateByKey(String(fd.get("key") ?? ""));
  if (!def) return { error: "Unknown template." };
  const fields = readFields(fd);
  if (!fields.subject.trim() || !fields.body.trim()) return { error: "Subject and body are required." };
  const { error } = await supabaseAdmin().from("mail_templates").upsert({ key: def.key, fields, updated_by: admin.id, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { error: error.message };
  refresh();
  return { ok: "Saved. The next message sent from this template uses it." };
}

export async function resetTemplate(fd: FormData) {
  await requireAdmin();
  const key = String(fd.get("key") ?? "");
  if (fd.get("confirm") !== "yes" || !templateByKey(key)) return;
  await supabaseAdmin().from("mail_templates").delete().eq("key", key);
  refresh();
}

/* Sends the editor's current (possibly unsaved) version, filled with sample
   values, to the signed-in admin's own address. */
export async function sendTest(_: MailState, fd: FormData): Promise<MailState> {
  const admin = await requireAdmin();
  const def = templateByKey(String(fd.get("key") ?? ""));
  if (!def) return { error: "Unknown template." };
  const { subject, html, text } = renderSample(def, readFields(fd));
  const r = await sendMail({ to: admin.email, subject: `[Test] ${subject}`, html, text });
  if (r.error) return { error: `Not sent: ${r.error}` };
  return { ok: `Test sent to ${admin.email}.` };
}
