import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { createSubscriptionCheckout } from "@/lib/billing/service";
import { conflict, toResponse } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * Starts the $5/month subscription. Returns a Stripe Checkout URL, or the
 * billing portal if the user already has a subscription to fix. Paying does
 * not grant access here; the Stripe webhook does.
 */
export async function POST() {
  try {
    const user = await requireApiUser();
    if (user.subscribed) {
      throw conflict("You already have an active subscription.");
    }

    const url = await createSubscriptionCheckout(user);
    return NextResponse.json({ url });
  } catch (error) {
    return toResponse(error, "We couldn't start checkout. Please try again.");
  }
}
