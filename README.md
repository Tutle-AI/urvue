# UrVue

UrVue is an AI-led customer-intelligence service for customer-facing businesses. An owner
sets up a Space, shares a Feedback Point, and receives evidence-backed patterns from short,
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

1. A business signs up and describes its customer experience.
2. UrVue creates a feedback link such as `/feedback/main-feedback`.
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
- Stripe secret, webhook secret, and price IDs
- `CRON_SECRET` in production, used to protect the scheduled intelligence worker
- `FEATURE_NEW_ONBOARDING`, `FEATURE_PUBLIC_CONVERSATIONS`, `FEATURE_ANALYSIS_V2`,
  `FEATURE_INTELLIGENCE_DASHBOARD`, and `FEATURE_KIRI` rollout switches (enabled unless set to `false`)

## Database

The Prisma schema uses Accounts, memberships, Spaces, Feedback Points, Conversations,
normalized analysis, evidence-backed Insights, Kiri history, and a PostgreSQL-backed job queue.
The renamed models map to the existing physical tables so historical IDs and `/feedback/[slug]`
links remain intact. Legacy summaries and insights remain available during the dual-read release.

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
