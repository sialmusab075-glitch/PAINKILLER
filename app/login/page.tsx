import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { EmailAuthForm } from "@/components/email-auth-form";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  if (await getCurrentUser()) {
    redirect("/");
  }

  const params = await searchParams;
  return (
    <EmailAuthForm mode="login" action={loginAction} sent={params.sent === "1"} error={params.error} />
  );
}
