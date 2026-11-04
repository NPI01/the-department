import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { PASS_URL, GAME_SLUG } from "@/lib/pass";

/* The Season Pass library sends an entitled, signed-in player here.
   Signed out -> pass sign-in; not entitled -> pass checkout; otherwise connect
   the account to a players row (by user_id, then by email, else a new one),
   record it in pass.game_links and send the player in. */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("next") ?? "";
  const next = raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : null;

  const sb = await supabaseServer();
  const { data } = await sb.auth.getClaims();
  const uid = (data?.claims?.sub as string | undefined) ?? null;
  if (!uid) return NextResponse.redirect(`${PASS_URL}/sign-in?next=${encodeURIComponent(req.nextUrl.href)}`);

  const { data: entitled } = await sb.schema("pass").rpc("entitled", { game: GAME_SLUG });
  if (!entitled) return NextResponse.redirect(`${PASS_URL}/choose?game=${GAME_SLUG}&next=${encodeURIComponent(req.nextUrl.href)}`);
  if (!supabaseConfigured()) return NextResponse.redirect(new URL("/subscribe?error=session", req.url));

  try {
    const db = supabaseAdmin();
    const email = ((data?.claims?.email as string | undefined) ?? "").toLowerCase();
    const cols = "id, file_token, user_id";
    let { data: player } = await db.from("players").select(cols).eq("user_id", uid).maybeSingle();
    if (!player && email) {
      const { data: byEmail } = await db.from("players").select(cols).eq("email", email).maybeSingle();
      // An email match that already belongs to a different account is not ours to take.
      if (byEmail && (!byEmail.user_id || byEmail.user_id === uid)) {
        await db.from("players").update({ user_id: uid }).eq("id", byEmail.id);
        player = byEmail;
      }
    }
    if (!player) {
      if (!email) throw new Error("no email on the session");
      const { data: made, error } = await db.from("players").insert({ email, user_id: uid }).select(cols).single();
      if (error) throw error;
      player = made;
    }

    // Keep the admin pages' view of billing: one provider 'pass' row per account (provider is free text).
    await db.from("subscriptions").upsert({
      player_id: player.id,
      provider: "pass",
      provider_customer_id: uid,
      provider_subscription_id: `pass:${uid}`,
      plan: "season-pass",
      status: "active",
      updated_at: new Date().toISOString(),
    }, { onConflict: "provider_subscription_id" });

    await sb.schema("pass").rpc("link_game", { game: GAME_SLUG, external_id: player.id });

    if (next) return NextResponse.redirect(new URL(next, req.nextUrl.origin));
    const { data: approved } = await db.from("applications").select("id").eq("player_id", player.id).eq("status", "approved").limit(1);
    const to = approved?.length ? `/file/${player.file_token}` : `/apply/${player.file_token}`;
    return NextResponse.redirect(new URL(to, req.nextUrl.origin));
  } catch (e) {
    console.error(`[pass/begin] ${(e as Error).message}`);
    return NextResponse.redirect(new URL("/subscribe?error=session", req.url));
  }
}
