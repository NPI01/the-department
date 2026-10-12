"use server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { characterForToken } from "@/lib/game/case-file";
import { FORMS } from "@/lib/engine/forms";
import { fileForm } from "@/lib/engine/file-form";

/* Filing from the hosted page. The file token is the only key, as everywhere
   in the personnel file. Every required question must be answered here; the
   email path is more forgiving and lets Security complain instead. */
export async function submitForm(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const formId = String(formData.get("form") ?? "").toUpperCase();
  const def = FORMS[formId];
  if (!def || !/^[a-f0-9]{32}$/.test(token)) redirect("/");
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) redirect("/");
  const answers: Record<number, string> = {};
  for (const q of def.questions) { const v = String(formData.get(`q${q.n}`) ?? "").trim().slice(0, 4000); if (v) answers[q.n] = v; }
  const missing = def.questions.filter((q) => q.required && !answers[q.n]).map((q) => q.n);
  if (missing.length) redirect(`/file/${token}/forms/${def.id}?missing=${missing.join(",")}`);
  const last = def.questions.length;
  const filed = await fileForm(db, { campaignId: me.campaignId, characterId: me.id, correspondenceId: null, source: "web", submission: { form: def.id, answers, signed: answers[last] ?? null, missing, startLine: 0, endLine: 0 } });
  redirect(`/file/${token}/forms/${def.id}?filed=${filed.index}`);
}
