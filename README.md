# AI Resume Checker

A subscription-only Next.js app for AI-powered resume analysis:

- Passwordless magic-link sign-in (sign up with name + email, log in with email), emails sent with nodemailer
- Stateless JWT session in an httpOnly cookie
- $5/month Stripe subscription; access is granted only after the Stripe webhook confirms payment
- Upload a PDF, DOCX, or TXT resume; only the extracted text is stored, never the file
- Structured AI analysis with LangChain + Groq, including a full improved resume draft
- Prisma ORM on SQLite (swappable for Postgres)

## Setup

```bash
bun install                 # also runs `prisma generate`
cp .env.example .env.local  # then fill in the values
bun run db:migrate          # create/upgrade the local SQLite database
bun dev
```

Open `http://localhost:3000`. In development, without `SMTP_HOST`, magic links are printed to the server console.

### Stripe

1. Enable the [Customer Portal](https://dashboard.stripe.com/test/settings/billing/portal) (used to cancel or fix payment).
2. Forward webhooks locally and copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Subscribe with test card `4242 4242 4242 4242`.

The plan ($5/month) is defined in `lib/billing/plan.ts` and sent to Checkout as inline `price_data`.

## Auth

- `/sign-up` takes `{ name, email }` and `/login` takes `{ email }`. Both email a single-use link that expires in 15 minutes. Login never reveals whether an account exists.
- `/magic-link?token=…` asks the user to confirm (so email scanners can't consume the link). The token is then burned, and a **stateless JWT** (HS256, 30 days) is set as an httpOnly cookie.
- The JWT carries identity only. Subscription status is read live from the DB on each request, because the webhook may grant or revoke it at any time.
- Trade-off: a stateless JWT can't be revoked server-side. Logout deletes the cookie, and tokens otherwise expire after 30 days. Rotate `SESSION_SECRET` to invalidate every session.

## Access control (`proxy.ts`)

| Route | Guard |
| --- | --- |
| `/login`, `/sign-up`, `/magic-link`, `/api/webhooks/stripe` | public |
| `/pricing`, `/billing/*`, `/api/payment/*` | `authenticated`: no JWT → `/login` (API: 401) |
| everything else: `/`, `/results/*`, `/api/analyze`, future AI routes | `paymentProtected`: no JWT → `/login`; no active subscription → `/pricing` (API: 402) |

- Access requires Stripe status `active` or `trialing` and a `currentPeriodEnd` in the future. Only the webhook writes these fields (`lib/billing/service.ts#syncStripeCustomer`).
- `/billing/success` grants nothing; it waits until the webhook has landed.
- Pages and routes re-check with `requireSubscriber` / `requireApiSubscriber`, and server actions check auth themselves.

## API

| Method | Route | Body | Returns |
| --- | --- | --- | --- |
| POST | `/api/payment/create` | none | `{ url }` Stripe Checkout for $5/month (or the portal if a subscription already exists) |
| POST | `/api/payment/portal` | none | `{ url }` Stripe billing portal (cancel / update card) |
| POST | `/api/analyze` | multipart `file` (PDF, DOCX, TXT, ≤ 5 MB) | `{ analysisId, analysis }` |
| POST | `/api/webhooks/stripe` | Stripe event | syncs subscription state |

`/api/analyze` returns a 400 with a user-friendly reason for:
- unsupported or legacy `.doc` files, and empty files;
- files over 5 MB;
- files whose extension doesn't match the content;
- password-protected or corrupt files;
- scanned/image-only PDFs, and text that's too short or too long.

## Layout

```
proxy.ts                   authenticated / paymentProtected guards
prisma/schema.prisma       User, MagicLinkToken, Resume, Analysis
app/                       pages, server actions, thin API routes
lib/
  env.ts                   validated env, grouped: core / email / AI / Stripe
  db.ts                    Prisma client (better-sqlite3 adapter)
  errors.ts                AppError + toResponse (no internal errors leak to clients)
  auth/                    JWT, magic links, session guards, nodemailer
  billing/                 $5/month plan, Stripe client, access rule, checkout/portal/webhook sync
  resume/                  upload rules (shared with the client) + PDF/DOCX/TXT parsing
  ai/                      LangChain Groq model, prompts, output schema, analyzer
  analysis/                analysis persistence and view types
```

Out of scope for now: chatting with your resume.

## Scripts

| Command              | What it does                    |
| -------------------- | ------------------------------- |
| `bun dev`            | Dev server                      |
| `bun run build`      | Generate Prisma client + build  |
| `bun run typecheck`  | `tsc --noEmit`                  |
| `bun run db:migrate` | `prisma migrate dev`            |
| `bun run db:studio`  | Browse the database             |

## Deploying

SQLite files don't persist on serverless hosts like Vercel. Before deploying, switch `prisma/schema.prisma` to Postgres, replace the driver adapter in `lib/db.ts`, and run `prisma migrate deploy`. Set `APP_URL`, `SESSION_SECRET`, the `SMTP_*` variables, and a production webhook endpoint.
