import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { syncStripeCustomer } from "@/lib/billing/service";
import { stripeEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/billing/stripe";

export const runtime = "nodejs";

/**
 * Events that can change whether a customer has access. Any status change also
 * emits customer.subscription.updated; the rest make the first grant and
 * payment outcomes land promptly. Each one triggers a full re-sync.
 */
const SUBSCRIPTION_EVENTS = new Set<Stripe.Event["type"]>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

/**
 * The only place subscription access is granted or revoked. Verifies the
 * Stripe signature, then mirrors the customer's subscription onto the user.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // Outside the try: a missing secret is a config error (500), not a bad signature.
  const { STRIPE_WEBHOOK_SECRET } = stripeEnv();

  let event: Stripe.Event;
  try {
    // Signature verification needs the exact raw body.
    event = getStripeClient().webhooks.constructEvent(
      await request.text(),
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (!SUBSCRIPTION_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const { customer } = event.data.object as { customer?: string | Stripe.Customer | null };
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) {
    return NextResponse.json({ received: true });
  }

  try {
    await syncStripeCustomer(customerId);
  } catch (error) {
    console.error(`Stripe sync failed for ${customerId} (${event.type})`, error);
    // Non-2xx makes Stripe retry with backoff.
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
