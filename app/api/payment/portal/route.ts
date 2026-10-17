import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { createBillingPortalSession } from "@/lib/billing/service";
import { toResponse } from "@/lib/errors";

export const runtime = "nodejs";

/** Stripe billing portal URL, where users update payment details or cancel. */
export async function POST() {
  try {
    const user = await requireApiUser();
    const url = await createBillingPortalSession(user);
    return NextResponse.json({ url });
  } catch (error) {
    return toResponse(error, "We couldn't open the billing portal. Please try again.");
  }
}
