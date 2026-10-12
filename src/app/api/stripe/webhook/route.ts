import type Stripe from "stripe";
import { stripe, recordSubscription } from "@/lib/stripe";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email/resend";
import { letterLinks } from "@/lib/email/letter";
import { renderTemplate } from "@/lib/email/template-store";

/* Stripe → us. checkout.session.completed creates the player and subscription
   and mails the application link; subscription updates keep the status
   current. Signature-verified; idempotent (upserts on the subscription id). */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return new Response("webhook not configured", { status: 400 });
  const raw = await req.text();
  let event: Stripe.Event;
  try { event = stripe().webhooks.constructEvent(raw, sig, secret); } catch (e) { return new Response(`bad signature: ${(e as Error).message}`, { status: 400 }); }
  if (!supabaseConfigured()) return Response.json({ ok: false, reason: "database not configured" });
  const db = supabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    if (s.mode !== "subscription" || !s.subscription) return Response.json({ ignored: "not a subscription" });
    const sub = await stripe().subscriptions.retrieve(typeof s.subscription === "string" ? s.subscription : s.subscription.id);
    const email = s.customer_details?.email ?? s.customer_email ?? null;
    const player = await recordSubscription(db, sub, email);
    // Mail the application link once per player.
    const key = `application_link:${player.id}`;
    const { data: dup } = await db.from("events").select("id").eq("idempotency_key", key).maybeSingle();
    if (!dup) {
      const links = letterLinks(player.file_token);
      const { subject, html, text } = await renderTemplate(db, "application_link", { email: player.email, apply_url: `${links.rules.replace(/\/rules$/, "")}/apply/${player.file_token}` }, links);
      const r = await sendMail({ to: player.email, subject, html, text });
      await db.from("events").insert({ campaign_id: process.env.CAMPAIGN_ID, kind: "player.subscribed", payload: { player_id: player.id, sent: !r.error, error: r.error }, idempotency_key: key });
    }
    return Response.json({ ok: true });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted" || event.type === "customer.subscription.created") {
    const sub = event.data.object;
    try { await recordSubscription(db, sub, null); } catch (e) { return Response.json({ ok: false, error: (e as Error).message }); }
    return Response.json({ ok: true });
  }
  return Response.json({ ignored: event.type });
}
