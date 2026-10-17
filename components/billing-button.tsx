"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type BillingButtonProps = {
  endpoint: "/api/payment/create" | "/api/payment/portal";
  children: React.ReactNode;
  className?: string;
};

/** POSTs to a payment route and follows the returned Stripe URL. */
export function BillingButton({ endpoint, children, className }: BillingButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(endpoint, { method: "POST" });
        const payload = await response.json();
        if (!response.ok || !payload.url) {
          throw new Error(payload.error || "Something went wrong. Please try again.");
        }
        window.location.href = payload.url;
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Something went wrong.",
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn("disabled:cursor-not-allowed disabled:opacity-70", className)}
      >
        {isPending ? "Redirecting..." : children}
      </button>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </>
  );
}
