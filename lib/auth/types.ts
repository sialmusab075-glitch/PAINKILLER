export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  /** True only while the webhook-mirrored Stripe subscription grants access. */
  subscribed: boolean;
  subscriptionStatus: string | null;
};
