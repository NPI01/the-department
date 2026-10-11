import { z } from "zod";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email/resend";

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

  await sendMail({
    to: email,
    subject: "Receipt of Form RI-1",
    text: [
      "ROYCE INDUSTRIES", "PERSONNEL & ADMINISTRATION · STATION R, NORTH DAKOTA", "",
      "Your application for employment has been received and filed.", "",
      "Employees are hired in cohorts. You will be notified at this address when a cohort is convened.", "",
      "Please retain this receipt. Do not reply to this message.", "",
      "PERSONNEL & ADMINISTRATION",
    ].join("\n"),
  });

  return Response.json({ message: "Your request has been filed. A receipt has been mailed to the address given." });
}
