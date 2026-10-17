"use server";

import { redirect } from "next/navigation";
import { consumeMagicLink, requestMagicLink, type MagicLinkIntent } from "@/lib/auth/magic-link";
import { createSession, destroySession } from "@/lib/auth/session";
import { isValidEmail, normalizeEmail } from "@/lib/auth/tokens";

async function sendLink(intent: MagicLinkIntent, formData: FormData) {
  const page = intent === "login" ? "/login" : "/sign-up";
  const email = normalizeEmail(String(formData.get("email") || ""));
  const name = String(formData.get("name") || "").trim().replace(/\s+/g, " ");

  if (!isValidEmail(email)) {
    redirect(`${page}?error=invalid-email`);
  }
  if (intent === "signup" && (name.length < 1 || name.length > 80)) {
    redirect(`${page}?error=invalid-name`);
  }

  try {
    await requestMagicLink(email, intent, intent === "signup" ? name : null);
  } catch (error) {
    console.error(error);
    redirect(`${page}?error=send-failed`);
  }

  redirect(`${page}?sent=1`);
}

export async function loginAction(formData: FormData) {
  await sendLink("login", formData);
}

export async function signUpAction(formData: FormData) {
  await sendLink("signup", formData);
}

export async function verifyMagicLinkAction(formData: FormData) {
  const token = String(formData.get("token") || "");
  const user = token ? await consumeMagicLink(token) : null;

  if (!user) {
    redirect("/login?error=link-expired");
  }

  await createSession({ sub: user.id, email: user.email, name: user.name });
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
