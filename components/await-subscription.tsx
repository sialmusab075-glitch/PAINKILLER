"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 2000;
const GIVE_UP_AFTER_MS = 2 * 60 * 1000;

/** Re-renders the server page until it redirects (subscription recorded) or we time out. */
export function AwaitSubscription() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
        clearInterval(timer);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  if (!timedOut) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-ink">
      This is taking longer than expected. If you were charged, your access will appear
      automatically once Stripe confirms it.{" "}
      <Link href="/pricing" className="font-medium text-brand hover:underline">
        Back to pricing
      </Link>
    </div>
  );
}
