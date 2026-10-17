// Pure access rule shared by middleware, pages, and API routes.

/** Only these Stripe statuses grant access; past_due, unpaid, canceled, incomplete etc. do not. */
const ACCESS_STATUSES = new Set<string>(["active", "trialing"]);

/** Statuses where the customer already has a subscription and should manage it, not buy another. */
export const EXISTING_SUBSCRIPTION_STATUSES = new Set<string>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

export function hasActiveSubscription(user: {
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
}) {
  return (
    !!user.subscriptionStatus &&
    ACCESS_STATUSES.has(user.subscriptionStatus) &&
    !!user.currentPeriodEnd &&
    user.currentPeriodEnd > new Date()
  );
}
