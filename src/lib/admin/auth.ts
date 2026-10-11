import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/* The console's Data Access Layer. A signed-in Supabase user is an admin only
   if their email is on the `admins` allowlist. Every console read goes through
   adminDb(), which checks that first, so a page cannot reach the service-role
   client without a verified admin behind it. */

export type Admin = { id: string; email: string; role: string };

export const getAdmin = cache(async (): Promise<Admin | null> => {
  // Request-time only: the auth client reads the clock to check token expiry.
  await connection();
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) return null;
  const db = supabaseAdmin();
  const { data } = await db.from("admins").select("id, email, role, user_id").eq("email", user.email.toLowerCase()).maybeSingle();
  if (!data) return null;
  if (data.user_id !== user.id) await db.from("admins").update({ user_id: user.id }).eq("id", data.id);
  return { id: data.id, email: data.email, role: data.role };
});

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login?denied=1");
  return admin;
}

/* Service-role client, handed out only to a verified admin. */
export async function adminDb() {
  await requireAdmin();
  return supabaseAdmin();
}

export async function isAllowlisted(email: string) {
  const { data } = await supabaseAdmin().from("admins").select("id").eq("email", email.toLowerCase()).maybeSingle();
  return Boolean(data);
}
