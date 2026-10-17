import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-email": "Enter a valid email address to continue.",
  "invalid-name": "Enter your name (up to 80 characters).",
  "send-failed": "We couldn't send the email right now. Please try again.",
  "link-expired": "That sign-in link is invalid or has expired. Request a new one.",
};

type EmailAuthFormProps = {
  mode: "login" | "sign-up";
  action: (formData: FormData) => Promise<void>;
  sent: boolean;
  error?: string;
};

export function EmailAuthForm({ mode, action, sent, error }: EmailAuthFormProps) {
  const isLogin = mode === "login";
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-line bg-white p-8 shadow-soft">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">
            {isLogin ? "Welcome back" : "Create account"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            {isLogin ? "Sign in with your email" : "Sign up with your email"}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            No password needed. We&apos;ll email you a one-time link that signs you in.
          </p>

          {sent ? (
            <div className="mt-8 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-4 text-sm leading-6 text-ink">
              {isLogin
                ? "If an account exists for that email, a sign-in link is on its way. It expires in 15 minutes."
                : "Check your inbox for a link to finish creating your account. It expires in 15 minutes."}
            </div>
          ) : (
            <form action={action} className="mt-8 space-y-4">
              {isLogin ? null : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink" htmlFor="name">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Jane Doe"
                    className="w-full rounded-[1.25rem] border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-ink" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-[1.25rem] border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Email me a link
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-muted">
            {isLogin ? "New here? " : "Already have an account? "}
            <Link
              href={isLogin ? "/sign-up" : "/login"}
              className="font-medium text-brand hover:underline"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-line bg-gradient-to-br from-ink to-brand p-8 text-white shadow-soft">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">Included</p>
          <div className="mt-4 space-y-4 text-sm leading-6 text-white/85">
            <div className="rounded-2xl bg-white/10 p-4">
              Scoring, grammar review, keyword insights, and ATS checks
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              A full AI-improved resume draft with every analysis
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              One simple subscription, cancel any time
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
