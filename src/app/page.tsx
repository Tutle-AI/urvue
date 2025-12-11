import Link from "next/link";

const features = [
  {
    title: "Conversational capture",
    description:
      "QR-first flows that let customers talk naturally. Smart follow-ups keep the conversation on track.",
  },
  {
    title: "AI summaries & sentiment",
    description:
      "Summaries, scores, and highlights in under a minute. Pro tier unlocks richer analysis.",
  },
  {
    title: "Clean dashboard",
    description:
      "Every session, transcript, and summary in one place. Built for busy owners and managers.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-16 md:px-10">
      <header className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-card/60 px-4 py-2 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            AI feedback without the friction
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              URVUE turns real conversations into clear, actionable feedback.
            </h1>
            <p className="max-w-2xl text-lg text-muted">
              Customers talk to a friendly AI assistant. URVUE asks smart
              follow-ups, summarizes sentiment, and gives you the signal you
              need to improve faster.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"
            >
              Go to dashboard
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              Get started
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            <span className="rounded-full border border-border px-3 py-1">
              QR-friendly capture
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              Neon + Stripe + Clerk
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              Mobile-first
            </span>
          </div>
        </div>
        <div className="glass w-full max-w-xl rounded-3xl p-6">
          <div className="space-y-4 rounded-2xl bg-card p-4">
            <div className="text-sm text-muted">Live conversation</div>
            <div className="space-y-3">
              <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
                <div className="text-xs text-muted">Customer</div>
                <p className="text-sm text-foreground">
                  “I loved the food but waited a bit too long for the check.”
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl bg-surface/80 p-4">
                <div className="text-xs text-emerald-300">URVUE</div>
                <p className="text-sm text-foreground">
                  Got it. About how long was the wait? Anything else we could
                  improve next time?
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="text-xs uppercase tracking-wide text-muted">
                Summary
              </div>
              <p className="text-sm text-foreground">
                Guest loved the food. Checkout wait felt slow (~10 minutes).
                Suggest faster handoff to servers.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="glass flex h-full flex-col gap-3 rounded-2xl p-5"
          >
            <h3 className="text-lg font-semibold text-foreground">
              {feature.title}
            </h3>
            <p className="text-sm text-muted">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="glass flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted">
            For owners & operators
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Launch URVUE in minutes.
          </h2>
          <p className="text-sm text-muted">
            Create a location, print the QR, and let customers talk. URVUE
            handles the rest—summaries, sentiment, and weekly digests.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/sign-up"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
          >
            Start free trial
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
