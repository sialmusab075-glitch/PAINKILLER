import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { BillingButton } from "@/components/billing-button";
import { getCurrentUser } from "@/lib/auth/session";

const pillLink =
  "rounded-full border border-line px-4 py-2 text-muted transition hover:border-ink hover:text-ink";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          AI Resume Checker
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {user?.subscribed ? (
            <>
              <Link href="/results" className={pillLink}>
                Results
              </Link>
              <BillingButton endpoint="/api/payment/portal" className={pillLink}>
                Billing
              </BillingButton>
            </>
          ) : user ? (
            <Link href="/pricing" className={pillLink}>
              Subscribe
            </Link>
          ) : null}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-muted sm:inline">{user.name ?? user.email}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full bg-ink px-4 py-2 font-medium text-white transition hover:opacity-90"
                >
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-ink px-4 py-2 font-medium text-white transition hover:opacity-90"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
