import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { PLAN } from "@/lib/billing/plan";
import { getStripeClient } from "@/lib/billing/stripe";
import { EXISTING_SUBSCRIPTION_STATUSES } from "@/lib/billing/subscription";
import type { SessionUser } from "@/lib/auth/types";

async function getOrCreateStripeCustomer(user: SessionUser) {
  const existing = await db.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }

  const customer = await getStripeClient().customers.create(
    { email: user.email, metadata: { userId: user.id } },
    // Double-clicking "Subscribe" must not create two customers.
    { idempotencyKey: `customer-${user.id}` },
  );

  await db.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/**
 * Returns the URL to send the user to: Stripe Checkout for new subscribers, or
 * the Billing Portal if they already have a subscription (e.g. past_due) so
 * they fix it instead of buying a second one. Access is never granted here;
 * only the webhook (via syncStripeCustomer) does that.
 */
export async function createSubscriptionCheckout(user: SessionUser) {
  if (user.subscriptionStatus && EXISTING_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus)) {
    return createBillingPortalSession(user);
  }

  const { APP_URL } = env();
  const customer = await getOrCreateStripeCustomer(user);
  const session = await getStripeClient().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PLAN.currency,
          unit_amount: PLAN.amountCents,
          recurring: { interval: PLAN.interval },
          product_data: { name: PLAN.name },
        },
      },
    ],
    subscription_data: { metadata: { userId: user.id } },
    success_url: `${APP_URL}/billing/success`,
    cancel_url: `${APP_URL}/pricing?checkout=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }
  return session.url;
}

export async function createBillingPortalSession(user: SessionUser) {
  const customer = await getOrCreateStripeCustomer(user);
  const session = await getStripeClient().billingPortal.sessions.create({
    customer,
    return_url: `${env().APP_URL}/pricing`,
  });
  return session.url;
}

function periodEnd(subscription: Stripe.Subscription) {
  // Since API 2025-03-31.basil the billing period lives on the subscription items.
  const ends = subscription.items.data.map((item) => item.current_period_end);
  return ends.length ? new Date(Math.max(...ends) * 1000) : null;
}

/**
 * Re-reads the customer's latest subscription from Stripe and mirrors it onto
 * the user. Always fetching (rather than trusting event payloads) makes this
 * idempotent and immune to webhooks arriving out of order.
 */
export async function syncStripeCustomer(customerId: string) {
  const { data } = await getStripeClient().subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });
  const subscription = data[0];

  await db.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: subscription
      ? {
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEnd(subscription),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        }
      : {
          subscriptionId: null,
          subscriptionStatus: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
  });
}
