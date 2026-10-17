import { z } from "zod";

// Validated per feature, so a missing Stripe key can't break sign-in (and vice
// versa). Each group is parsed lazily on first use, so `next build` doesn't need
// runtime secrets, and fails loudly naming exactly what is missing.
// No `server-only` here: proxy.ts reads the core group too. These are runtime
// secrets from process.env, never inlined into client bundles.

const isProduction = process.env.NODE_ENV === "production";
const PLACEHOLDER_SECRET = "replace_with_a_long_random_string";

const coreSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: isProduction
    ? z.string().url()
    : z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z
    .string()
    .min(32, "must be at least 32 characters")
    .refine(
      (value) => !isProduction || value !== PLACEHOLDER_SECRET,
      "still the .env.example placeholder; anyone could forge sessions",
    ),
});

const emailSchema = z.object({
  // Optional in development (links are logged instead); required in production.
  SMTP_HOST: isProduction ? z.string().min(1) : z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).default("AI Resume Checker <no-reply@localhost>"),
});

const aiSchema = z.object({
  AI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().min(1).default("openai/gpt-oss-120b"),
});

const stripeSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
});

function lazyEnv<T extends z.ZodTypeAny>(group: string, schema: T) {
  let cached: z.infer<T> | null = null;
  return (): z.infer<T> => {
    if (!cached) {
      const parsed = schema.safeParse(process.env);
      if (!parsed.success) {
        const problems = parsed.error.issues
          .map((issue) => `${issue.path.join(".")} (${issue.message})`)
          .join(", ");
        throw new Error(`Invalid ${group} environment configuration: ${problems}`);
      }
      cached = parsed.data;
    }
    return cached;
  };
}

const coreEnv = lazyEnv("core", coreSchema);
let warnedPlaceholder = false;

/** Database, public URL, and session signing. */
export function env() {
  const core = coreEnv();
  if (core.SESSION_SECRET === PLACEHOLDER_SECRET && !warnedPlaceholder) {
    warnedPlaceholder = true;
    console.warn(
      "[env] SESSION_SECRET is the .env.example placeholder. Fine for local dev; production refuses to start with it.",
    );
  }
  return core;
}
export const emailEnv = lazyEnv("email", emailSchema);
export const aiEnv = lazyEnv("AI", aiSchema);
export const stripeEnv = lazyEnv("Stripe", stripeSchema);
