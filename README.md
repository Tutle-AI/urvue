# UrVue

UrVue is an AI-led customer-intelligence service for customer-facing businesses. An owner
sets up a workspace and independent Feedback Points, and receives evidence-backed patterns from short,
adaptive customer conversations. Kiri answers questions from normalized findings and links
material conclusions back to their supporting conversations.

## Stack

- Next.js App Router
- React and Tailwind CSS
- Clerk authentication
- Prisma with PostgreSQL
- OpenAI Responses API
- Stripe subscriptions

## Core Flow

1. An owner signs up and configures the first Feedback Point with its own experience description, conversation goals, and agent personality.
2. In `/dashboard/feedback-points`, the owner creates or edits points and shares their links or QR codes. Basic includes five points for $24.99/month. `/dashboard/locations` redirects to the new destination.
3. A customer opens the link and chats with the UrVue assistant.
4. Closing the conversation immediately shows a thank-you state and enqueues durable analysis.
5. The worker writes versioned analysis and normalized findings without changing the transcript.
6. The dashboard and Kiri surface conclusions with sample sizes, confidence, and evidence links.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run verify:data
npx prisma generate
```

## Environment

Copy `env.example` to `.env.local` and provide:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- Clerk keys
- `OPENAI_API_KEY`
- `OPENAI_FEEDBACK_MODEL` defaults to `gpt-5.6-luna` for visitor interviews, independently of Kiri's `OPENAI_CHAT_MODEL` and `OPENAI_SUMMARY_MODEL`. GPT-5.6 feedback requests use no reasoning for conversational latency. Set this to the previous model to roll back.
- Stripe secret, webhook secret, and price IDs
- `CRON_SECRET` in production, used to protect the scheduled intelligence worker
- `FEATURE_NEW_ONBOARDING`, `FEATURE_PUBLIC_CONVERSATIONS`, `FEATURE_ANALYSIS_V2`,
  `FEATURE_INTELLIGENCE_DASHBOARD`, and `FEATURE_KIRI` rollout switches (enabled unless set to `false`)

## Database

Run `node scripts/eval-feedback.mjs` to check the configured feedback model against four synthetic interview scenarios (uses the OpenAI API and incurs token charges; does not write conversations to the database). Review the printed replies for listening, scope boundaries, and closure as well as the automatic completion checks.

Visitor chats support Enter to send and Ctrl+Enter (also Cmd+Enter or Shift+Enter) for a new line. Finish closes even an empty conversation; empty conversations skip analysis. A draft must be sent or cleared before finishing. Both automatic and manual closure save a farewell in the transcript.

The Prisma schema uses Accounts, memberships, Spaces, Feedback Points, Conversations,
normalized analysis, evidence-backed Insights, Kiri history, and a PostgreSQL-backed job queue.
The renamed models map to the existing physical tables so historical IDs and `/feedback/[slug]`
links remain intact. Legacy summaries and insights remain available during the dual-read release.

The point-agent migration copies existing workspace briefs into each point once. Future edits
are independent. Conversations snapshot their point's brief at creation; both interviews and
analysis use that snapshot even after the owner edits the point. Settings holds workspace
context for Kiri, while customer-agent configuration lives in Feedback Points. Creation is
serialized per account to enforce the allowance across concurrent requests and onboarding.

The internal `STARTER` billing enum now displays as Basic. Set `STRIPE_PRICE_STARTER` to the
Stripe recurring monthly price for $24.99 before enabling paid Basic checkout; changing the
displayed plan does not change Stripe prices or existing subscriptions. Pro retains its
existing five-point entitlement pending a separate pricing decision.

Apply checked-in migrations in deployed environments:

```bash
npx prisma generate
npx prisma migrate deploy
```

`vercel.json` invokes `/api/internal/jobs/run` every minute. For local development, the worker
can be invoked directly; production requests require `Authorization: Bearer $CRON_SECRET`.

For an existing pre-migration database, run `node scripts/migrate-vision.mjs` once after the
migrations. The script is idempotent: it creates Accounts and memberships, links existing Spaces,
converts legacy analyses, skips empty historical conversations, and queues the remaining history.
Run `npm run verify:data -- --baseline` during this cutover to assert the preserved 2/2/2/2/9/89
historical baseline as well as legacy records, job health, Account assignment, and Insight evidence.
