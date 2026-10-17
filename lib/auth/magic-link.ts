import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendMagicLinkEmail } from "@/lib/auth/mailer";
import { generateToken, hashToken } from "@/lib/auth/tokens";

const TOKEN_TTL_MS = 1000 * 60 * 15;
const RESEND_COOLDOWN_MS = 1000 * 60;

export type MagicLinkIntent = "login" | "signup";

/**
 * Emails a single-use sign-in link. Callers always show the same "check your
 * email" message, so this never reveals whether an account exists.
 * The User row is only created when the link is consumed (email proven).
 */
export async function requestMagicLink(
  email: string,
  intent: MagicLinkIntent,
  name: string | null = null,
) {
  if (intent === "login") {
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!existing) {
      return;
    }
  }

  const recent = await db.magicLinkToken.findFirst({
    where: { email, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    select: { id: true },
  });
  if (recent) {
    return;
  }

  const token = generateToken();
  await db.magicLinkToken.create({
    data: {
      email,
      name: intent === "signup" ? name : null,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const link = new URL("/magic-link", env().APP_URL);
  link.searchParams.set("token", token);
  await sendMagicLinkEmail(email, link.toString());
}

/** Atomically burns the token and returns the (possibly new) user, or null. */
export async function consumeMagicLink(token: string) {
  const tokenHash = hashToken(token);

  return db.$transaction(async (tx) => {
    const record = await tx.magicLinkToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return null;
    }

    // Conditional update guards against two concurrent clicks both succeeding.
    const claimed = await tx.magicLinkToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) {
      return null;
    }

    return tx.user.upsert({
      where: { email: record.email },
      // A sign-up link carries the name; a login link leaves the profile untouched.
      update: record.name ? { name: record.name } : {},
      create: { email: record.email, name: record.name },
    });
  });
}
