import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/* Where the magic link lands. Handles both shapes Supabase sends: a PKCE
   ?code= (default template) and ?token_hash=&type= (custom template). */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const nextParam = p.get("next") ?? "/admin";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/admin";
  const fail = new URL("/admin/login?error=link", req.url);

  const sb = await supabaseServer();
  const code = p.get("code");
  const tokenHash = p.get("token_hash");
  const type = p.get("type") as EmailOtpType | null;
  const { error } = code
    ? await sb.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await sb.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("no code") };
  if (error) return NextResponse.redirect(fail);

  const { data: { user } } = await sb.auth.getUser();
  if (user?.email) {
    await supabaseAdmin().from("admins").update({ user_id: user.id, last_sign_in_at: new Date().toISOString() }).eq("email", user.email.toLowerCase());
  }
  return NextResponse.redirect(new URL(next, req.url));
}
