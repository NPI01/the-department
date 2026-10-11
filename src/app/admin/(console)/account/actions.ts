"use server";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseServer } from "@/lib/supabase/server";

export type PasswordState = { ok?: boolean; error?: string } | undefined;

/* Sets the signed-in admin's own password. Supabase applies it to the session's
   user, so nobody can set another account's password through this. */
export async function setPassword(_: PasswordState, fd: FormData): Promise<PasswordState> {
  await requireAdmin();
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (password !== confirm) return { error: "The two entries don't match." };
  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: true };
}
