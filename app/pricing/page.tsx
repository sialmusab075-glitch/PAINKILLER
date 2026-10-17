import { redirect } from "next/navigation";
import { BillingButton } from "@/components/billing-button";
import { requireUser } from "@/lib/auth/session";
import { PLAN, PLAN_AMOUNT_LABEL, PLAN_PRICE_LABEL } from "@/lib/billing/plan";
import { EXISTING_SUBSCRIPTION_STATUSES } from "@/lib/billing/subscription";

const FEATURES = [
  "Unlimited resume analyses with a 0–100 score",
  "Grammar, keyword, and ATS optimization feedback",
  "A full AI-improved resume draft you can download",
  "Your analysis history saved to your account",
];

const primaryButton =
  "w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90";

/** The paywall: proxy.ts sends signed-in users here until the webhook confirms a subscription. */
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await requireUser();
  if (user.subscribed) {
    redirect("/");
  }

  const { checkout } = await searchParams;
  const hasSubscriptionIssue =
    !!user.subscriptionStatus && EXISTING_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <div className="rounded-[1.75rem] border border-line bg-white p-8 shadow-soft">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">Subscription</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          Subscribe to start analyzing
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          AI Resume Checker is available to subscribers. Cancel any time from the billing portal.
        </p>

        <div className="mt-6 flex items-end gap-2">
          <span className="text-5xl font-semibold tracking-tight text-ink">{PLAN_AMOUNT_LABEL}</span>
          <span className="pb-1.5 text-muted">/ {PLAN.interval}</span>
        </div>

        <ul className="mt-6 space-y-3 text-sm text-muted">
          {FEATURES.map((feature) => (
            <li key={feature} className="rounded-2xl bg-canvas px-4 py-3">
              {feature}
            </li>
          ))}
        </ul>

        {checkout === "cancelled" ? (
          <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-ink">
            Checkout was cancelled. You can subscribe whenever you&apos;re ready.
          </div>
        ) : null}

        <div className="mt-6">
          {hasSubscriptionIssue ? (
            <>
              <div className="mb-6 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                Your subscription is {user.subscriptionStatus?.replace("_", " ")}. Update your
                payment method in the billing portal to restore access.
              </div>
              <BillingButton endpoint="/api/payment/portal" className={primaryButton}>
                Manage billing
              </BillingButton>
            </>
          ) : (
            <BillingButton endpoint="/api/payment/create" className={primaryButton}>
              Subscribe for {PLAN_PRICE_LABEL}
            </BillingButton>
          )}
        </div>
      </div>
    </div>
  );
}
