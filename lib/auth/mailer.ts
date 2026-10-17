import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { emailEnv } from "@/lib/env";

let transporter: Transporter | null = null;

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = emailEnv();
  if (!SMTP_HOST) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export async function sendMagicLinkEmail(to: string, link: string) {
  // Always echo the link in development so you can sign in from the terminal.
  // Never in production: a logged link is a working login for that account.
  if (process.env.NODE_ENV !== "production") {
    console.info(`\n[magic-link] Sign-in link for ${to}:\n${link}\n`);
  }

  const smtp = getTransporter();
  if (!smtp) {
    // No SMTP configured (dev only; emailEnv() requires SMTP_HOST in production).
    return;
  }

  await smtp.sendMail({
    from: emailEnv().EMAIL_FROM,
    to,
    subject: "Your AI Resume Checker sign-in link",
    text: `Sign in to AI Resume Checker:\n\n${link}\n\nThis link expires in 15 minutes and can be used once. If you did not request it, ignore this email.`,
    html: `<p>Sign in to AI Resume Checker:</p><p><a href="${link}">Sign in</a></p><p>This link expires in 15 minutes and can be used once. If you did not request it, ignore this email.</p>`,
  });
}
