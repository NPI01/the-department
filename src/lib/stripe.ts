import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/* The subscription: $2.99 a month through Stripe Checkout. Env:
     STRIPE_SECRET_KEY      sk_live_… or sk_test_…
     STRIPE_PRICE_ID        the recurring price of the Weird.Delivery product
     STRIPE_WEBHOOK_SECRET  whsec_… for /api/stripe/webhook
   Server only. */

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

export const PLAN = { key: "department-monthly", amountCents: 299, currency: "usd" };

const STATUS: Record<string, string> = { active: "active", trialing: "trialing", past_due: "past_due", canceled: "canceled", unpaid: "past_due", incomplete: "incomplete", incomplete_expired: "canceled", paused: "canceled" };

/* Record a Stripe subscription against the player who owns its customer.
   Idempotent on the subscription id; creates the player on first sight. */
export async function recordSubscription(db: SupabaseClient, sub: Stripe.Subscription, email: string | null) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let { data: player } = await db.from("players").select("id, email, file_token").eq("stripe_customer_id", customerId).maybeSingle();
  if (!player && email) {
    const { data } = await db.from("players").upsert({ email: email.toLowerCase(), stripe_customer_id: customerId }, { onConflict: "email" }).select("id, email, file_token").single();
    player = data;
  }
  if (!player) throw new Error(`no player for customer ${customerId}`);
  const item = sub.items.data[0];
  const periodEnd = item?.current_period_end ?? null;
  await db.from("subscriptions").upsert({
    player_id: player.id,
    provider: "stripe",
    provider_customer_id: customerId,
    provider_subscription_id: sub.id,
    plan: PLAN.key,
    status: STATUS[sub.status] ?? "incomplete",
    amount_cents: item?.price?.unit_amount ?? PLAN.amountCents,
    currency: item?.price?.currency ?? PLAN.currency,
    started_at: new Date(sub.created * 1000).toISOString(),
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "provider_subscription_id" });
  return player as { id: string; email: string; file_token: string };
}

export const SUBSCRIBED = ["active", "trialing", "comp"];

export async function hasSubscription(db: SupabaseClient, playerId: string) {
  const { data } = await db.from("subscriptions").select("status").eq("player_id", playerId).in("status", SUBSCRIBED).limit(1);
  return Boolean(data?.length);
}
