import { redirect } from "next/navigation";
import { AwaitSubscription } from "@/components/await-subscription";
import { requireUser } from "@/lib/auth/session";

// Returning from Checkout proves nothing; access starts only once the Stripe
// webhook has recorded the subscription. Until then, wait here.
export default async function BillingSuccessPage() {
  const user = await requireUser();
  if (user.subscribed) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-[1.75rem] border border-line bg-white p-8 text-center shadow-soft">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-line border-t-brand" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">Confirming your payment</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          We&apos;re waiting for Stripe to confirm your subscription. This usually takes a few
          seconds.
        </p>
        <AwaitSubscription />
      </div>
    </div>
  );
}
