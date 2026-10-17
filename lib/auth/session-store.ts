// Runtime-agnostic session lookup: no `server-only` or `next/headers`, so the
// proxy (middleware) can import it alongside pages and route handlers.
import { db } from "@/lib/db";
import { verifySessionJwt } from "@/lib/auth/jwt";
import { hasActiveSubscription } from "@/lib/billing/subscription";
import type { SessionUser } from "@/lib/auth/types";

export const SESSION_COOKIE = "resume_checker_session";

/**
 * Identity comes from the stateless JWT. Subscription state is read live from
 * the DB because only the Stripe webhook may grant or revoke access, and a
 * value baked into the token would go stale.
 */
export async function findSessionUser(token: string | undefined): Promise<SessionUser | null> {
  const claims = await verifySessionJwt(token);
  if (!claims) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: claims.sub },
    select: { subscriptionStatus: true, currentPeriodEnd: true },
  });
  if (!user) {
    return null;
  }

  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name,
    subscribed: hasActiveSubscription(user),
    subscriptionStatus: user.subscriptionStatus,
  };
}
