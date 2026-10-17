// Runtime-agnostic (no `server-only`): imported by proxy.ts as well as the server.
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const ISSUER = "ai-resume-checker";

export type SessionClaims = {
  sub: string;
  email: string;
  name: string | null;
};

function getSecret() {
  return new TextEncoder().encode(env().SESSION_SECRET);
}

export async function signSessionJwt(claims: SessionClaims) {
  return new SignJWT({ email: claims.email, name: claims.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

/** Returns the claims of a valid, unexpired token signed with our secret, else null. */
export async function verifySessionJwt(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) {
    return null;
  }

  // Outside the try: a missing/invalid SESSION_SECRET is a config error and must
  // surface, not be swallowed as "logged out".
  const secret = getSecret();
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: ISSUER,
    });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}
