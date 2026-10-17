import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, findSessionUser } from "@/lib/auth/session-store";
import type { SessionUser } from "@/lib/auth/types";

/**
 * Request guards (Next 16 proxy, formerly middleware; always Node.js runtime,
 * so it can read the DB). Identity comes from the stateless JWT cookie; the
 * subscription is read live because only the Stripe webhook grants access.
 * Pages and API routes re-check (requireSubscriber / requireApiSubscriber),
 * so this is the first line of defense, not the only one.
 */

type Guard = (request: NextRequest) => Promise<NextResponse>;

// Reachable by anyone.
const PUBLIC_PATHS = ["/login", "/sign-up", "/magic-link", "/api/webhooks/stripe"];
// Signed-in users must reach these to pay or manage billing.
const AUTH_ONLY_PATHS = ["/pricing", "/billing", "/api/payment"];
// Everything else (/, /results, /api/analyze, and any future AI route) is paymentProtected.

function matches(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function deny(request: NextRequest, status: 401 | 402) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const error = status === 401 ? "Sign in to continue." : "An active subscription is required.";
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.redirect(new URL(status === 401 ? "/login" : "/pricing", request.url));
}

function currentUser(request: NextRequest): Promise<SessionUser | null> {
  return findSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
}

/** Valid session JWT required; otherwise /login (pages) or 401 (API). */
const authenticated: Guard = async (request) => {
  const user = await currentUser(request);
  return user ? NextResponse.next() : deny(request, 401);
};

/** Valid session and a webhook-confirmed subscription; otherwise /pricing (pages) or 402 (API). */
const paymentProtected: Guard = async (request) => {
  const user = await currentUser(request);
  if (!user) {
    return deny(request, 401);
  }
  return user.subscribed ? NextResponse.next() : deny(request, 402);
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (matches(pathname, PUBLIC_PATHS)) {
    return NextResponse.next();
  }
  if (matches(pathname, AUTH_ONLY_PATHS)) {
    return authenticated(request);
  }
  return paymentProtected(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
};
