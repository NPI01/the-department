"use server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { characterForToken } from "@/lib/game/case-file";
import { BIO_FIELDS, type Bio } from "@/lib/game/personnel";

/* The biography on the personnel file. The file token is the only key. It is
   merged into characters.sheet.profile; "In your own words" also becomes the
   public profile. Staff who write to the character read it from there. */
export async function saveBio(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const db = supabaseAdmin();
  const me = await characterForToken(db, token);
  if (!me) redirect("/");
  const profile: Bio = {};
  for (const f of BIO_FIELDS) { const v = String(formData.get(f.key) ?? "").trim().slice(0, f.key === "notes" ? 1500 : 400); if (v) profile[f.key] = v; }
  const { data: row } = await db.from("characters").select("sheet").eq("id", me.id).single();
  const sheet = { ...((row?.sheet as Record<string, unknown> | null) ?? {}), profile };
  await db.from("characters").update({ sheet, public_profile: profile.notes ?? null }).eq("id", me.id);
  redirect(`/file/${token}?bio=saved#bio`);
}
