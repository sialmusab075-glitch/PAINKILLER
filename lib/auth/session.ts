import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { paymentRequired, unauthorized } from "@/lib/errors";
import { SESSION_TTL_SECONDS, signSessionJwt, type SessionClaims } from "@/lib/auth/jwt";
import { SESSION_COOKIE, findSessionUser } from "@/lib/auth/session-store";

/** Issues the stateless session JWT as an httpOnly cookie (never readable by page scripts). */
export async function createSession(claims: SessionClaims) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await signSessionJwt(claims), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Resolves the signed-in user once per request (navbar + page share the lookup). */
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  return findSessionUser(cookieStore.get(SESSION_COOKIE)?.value);
});

/** For pages: redirect anonymous visitors to login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** For pages: anonymous -> /login, signed in without an active subscription -> /pricing. */
export async function requireSubscriber() {
  const user = await requireUser();
  if (!user.subscribed) {
    redirect("/pricing");
  }
  return user;
}

/** For API routes: throw a 401 that `toResponse` turns into JSON. */
export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw unauthorized();
  }
  return user;
}

/** For API routes: 401 when anonymous, 402 when not subscribed. */
export async function requireApiSubscriber() {
  const user = await requireApiUser();
  if (!user.subscribed) {
    throw paymentRequired("An active subscription is required.");
  }
  return user;
}

/**
 * Stateless JWTs can't be revoked server-side; logging out removes the cookie
 * from this browser, and the token otherwise expires after SESSION_TTL_SECONDS.
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
