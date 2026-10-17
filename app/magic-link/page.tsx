import { redirect } from "next/navigation";
import { verifyMagicLinkAction } from "@/app/actions/auth";

// The token is consumed by a POST from this page rather than on GET, so email
// security scanners that prefetch links cannot burn the one-time token.
export default async function MagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    redirect("/login?error=link-expired");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-[1.75rem] border border-line bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">Almost there</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Confirm sign in</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Continue to sign in to AI Resume Checker on this device.
        </p>
        <form action={verifyMagicLinkAction} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
