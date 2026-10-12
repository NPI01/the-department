import { z } from "zod";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email/resend";
import { letterLinks } from "@/lib/email/letter";
import { renderTemplate } from "@/lib/email/template-store";
import { renderSample, templateByKey } from "@/lib/email/templates";

const Body = z.object({ email: z.string().email().max(200), note: z.string().max(2000).optional().nullable() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "A valid correspondence address is required." }, { status: 400 });
  const { email, note } = parsed.data;

  if (supabaseConfigured()) {
    const db = supabaseAdmin();
    const { error } = await db.from("applicants").upsert({ email: email.toLowerCase(), note: note ?? null, source: "web" }, { onConflict: "email" });
    if (error) return Response.json({ error: "The form could not be filed." }, { status: 500 });
  }

  const { subject, html, text } = supabaseConfigured()
    ? await renderTemplate(supabaseAdmin(), "receipt", { email }, letterLinks())
    : renderSample(templateByKey("receipt")!, templateByKey("receipt")!.defaults);
  await sendMail({ to: email, subject, text, html });

  return Response.json({ message: "Your request has been filed. A receipt has been mailed to the address given." });
}
