import { z } from "zod";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { siteUrl } from "@/lib/email/letter";

/* Starts a Checkout session for the monthly subscription and sends the
   browser to Stripe. Success lands on /apply/start, which creates the player
   and opens the Employment Application. */
export async function POST(req: Request) {
  if (!stripeConfigured()) return Response.json({ error: "Subscriptions are not open yet." }, { status: 503 });
  const fd = await req.formData();
  const parsed = z.string().email().max(200).safeParse(String(fd.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return Response.redirect(`${siteUrl()}/subscribe?error=email`, 303);
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: parsed.data,
    allow_promotion_codes: true,
    success_url: `${siteUrl()}/apply/start?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/subscribe?canceled=1`,
    metadata: { product: "the-department" },
  });
  return Response.redirect(session.url!, 303);
}
