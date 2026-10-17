// The single subscription plan, shared by Stripe Checkout (inline price_data)
// and the pricing UI so they can never disagree.
export const PLAN = {
  name: "AI Resume Checker",
  amountCents: 500,
  currency: "usd",
  interval: "month",
} as const;

export const PLAN_AMOUNT_LABEL = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: PLAN.currency.toUpperCase(),
}).format(PLAN.amountCents / 100);

export const PLAN_PRICE_LABEL = `${PLAN_AMOUNT_LABEL} / ${PLAN.interval}`;
