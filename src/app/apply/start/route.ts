import { NextRequest, NextResponse } from "next/server";
import { stripe, recordSubscription } from "@/lib/stripe";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";

/* Where Stripe Checkout returns. Confirms the session server-side, records
   the subscription (the webhook does the same, whichever arrives first), and
   opens the applicant's Employment Application. */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("session_id");
  if (!id || !supabaseConfigured()) return NextResponse.redirect(new URL("/subscribe?error=session", req.url));
  try {
    const s = await stripe().checkout.sessions.retrieve(id, { expand: ["subscription"] });
    if (s.mode !== "subscription" || !s.subscription || typeof s.subscription === "string") throw new Error("no subscription on session");
    const player = await recordSubscription(supabaseAdmin(), s.subscription, s.customer_details?.email ?? s.customer_email ?? null);
    return NextResponse.redirect(new URL(`/apply/${player.file_token}`, req.url));
  } catch (e) {
    console.error(`[apply/start] ${(e as Error).message}`);
    return NextResponse.redirect(new URL("/subscribe?error=session", req.url));
  }
}
