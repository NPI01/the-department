"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { isAllowlisted } from "@/lib/admin/auth";

export type LoginState = { sent?: boolean; error?: string } | undefined;

/* Sends a magic link only to allowlisted addresses, and answers the same way
   either way so the form does not reveal who is on the staff list. */
export async function requestLink(_: LoginState, fd: FormData): Promise<LoginState> {
  const parsed = z.string().email().max(200).safeParse(String(fd.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: "Enter a valid address." };
  const email = parsed.data;
  if (await isAllowlisted(email)) {
    const h = await headers();
    const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
    const sb = await supabaseServer();
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/confirm?next=/admin`, shouldCreateUser: true } });
    if (error) return { error: `The link could not be sent: ${error.message}` };
  }
  return { sent: true };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/admin/login");
}
