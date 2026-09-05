import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HomeClients, HomeFeatures } from "@/components/home-features";
import { env } from "@/lib/env";

const featureList = [
  {
    title: "Conversational feedback",
    description:
      "Replace brittle surveys with a short AI-led conversation that asks one useful question at a time.",
  },
  {
    title: "Guided by your goals",
    description:
      "Tell UrVue what you care about: service, atmosphere, usability, wait times, pricing, design, or anything else.",
  },
  {
    title: "Actionable insights",
    description:
      "Every conversation becomes themes, pain points, praise, quotes, and suggested next actions.",
  },
  {
    title: "Simple sharing",
    description:
      "Share one feedback link on your website, receipt, account page, QR code, booking flow, or follow-up email.",
  },
];

const clientTypes = [
  {
    title: "Websites and apps",
    description:
      "Learn where users get stuck, what they expected, and what would make the experience better.",
  },
  {
    title: "Restaurants and cafes",
    description:
      "Capture honest feedback about food, service, atmosphere, ordering, and repeat visits.",
  },
  {
    title: "Barbers, salons, and groomers",
    description:
      "Understand what customers loved, what felt off, and what would make them come back.",
  },
  {
    title: "Retail, venues, and services",
    description:
      "Turn everyday customer experiences into clear themes, quotes, and decisions.",
  },
];

function DashboardPreview() {
  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <div className="grid min-h-[520px] md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-border bg-surface p-5 md:block">
          <div className="font-serif text-xl text-foreground">UrVue</div>
          <div className="mt-8 space-y-2 text-sm">
            {["Overview", "Sessions", "Feedback Points", "Settings"].map((item, index) => (
              <div
                key={item}
                className={`rounded-xl px-3 py-2 ${
                  index === 0
                    ? "bg-primary/15 text-primary"
                    : "text-muted"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-border bg-card/60 p-4">
            <div className="text-xs text-muted">This week</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">42</div>
            <div className="mt-1 text-xs text-muted">feedback conversations</div>
          </div>
        </aside>
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">
                Freakycast
              </div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                Feedback command center
              </div>
            </div>
            <div className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">
              6 high-priority insights
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["Top theme", "Dark mode polish"],
              ["Satisfaction", "4.2/5"],
              ["Next action", "Fix profile contrast"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-surface/70 p-4">
                <div className="text-xs text-muted">{label}</div>
                <div className="mt-2 text-lg font-semibold text-foreground">
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-border bg-surface/50 p-5">
              <div className="text-sm font-medium text-foreground">
                Recurring pain points
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["Movie cards feel cramped on mobile", "18"],
                  ["Users want clearer watchlist controls", "12"],
                  ["Profile colors are hard to read", "9"],
                ].map(([label, count]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl bg-card/70 px-4 py-3"
                  >
                    <span className="text-sm text-foreground">{label}</span>
                    <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
              <div className="text-xs uppercase tracking-wide text-muted">
                Customer quote
              </div>
              <p className="mt-3 text-lg leading-relaxed text-foreground">
                &quot;I love the horror lists, but the account page makes it hard to
                find my saved movies.&quot;
              </p>
              <div className="mt-4 text-sm text-muted">
                Turned into a theme, a pain point, and a suggested action.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  const feedbackSlug = "urvue";
  const feedbackPath = `/feedback/${feedbackSlug}`;
  const feedbackUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${feedbackPath}`;

  return (
    <main className="bg-background text-foreground">
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-6">
          <SiteHeader />

          <div className="flex min-h-[calc(100svh-23rem)] flex-col items-center justify-center pb-16 pt-12 text-center md:pb-20 md:pt-16">
            <div className="w-full">
              <h1 className="mx-auto max-w-6xl text-balance font-serif text-[clamp(2.75rem,14vw,3.5rem)] font-normal leading-[0.98] tracking-tight sm:text-[clamp(3.5rem,8.5vw,7.5rem)]">
                clear feedback<br className="hidden sm:block" /> from real conversations
              </h1>
              <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted">
                UrVue gives your customers one simple feedback link, then turns
                their conversation into themes, quotes, pain points, praise, and
                suggested actions for your team.
              </p>

              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <Link
                  href="/sign-up"
                  className="rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
                >
                  Start free trial
                </Link>
                <Link
                  href={feedbackPath}
                  className="rounded-full border border-foreground/30 px-7 py-3 text-sm font-medium text-foreground transition hover:border-foreground hover:bg-foreground/5"
                >
                  Try the feedback link
                </Link>
              </div>

              <div className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted">
                <div>Setup in minutes</div>
                <div>No survey builder</div>
                <div>Built on OpenAI</div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative px-6">
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-light" />
          <div className="relative mx-auto max-w-6xl">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="bg-light px-6 py-24 text-background"
      >
        <HomeFeatures features={featureList} />
      </section>

      <section id="clients" className="bg-background px-6 py-24">
        <HomeClients clients={clientTypes} />
      </section>

      <section
        id="feedback"
        className="bg-light px-6 py-24 text-background"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-start">
            <div>
              <h2 className="font-serif text-4xl font-normal md:text-5xl">
                UrVue runs on UrVue
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-light-muted md:text-base">
                Tell us what feels sharp, what feels off, and what would make
                this service more useful. Your conversation becomes the same
                kind of insight a UrVue customer sees in their dashboard.
              </p>

              <div className="mt-8">
                <div className="text-xs font-medium uppercase tracking-wide text-light-muted">
                  Feedback link
                </div>
                <div className="mt-3">
                  <Link
                    href={feedbackPath}
                    className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/0 px-5 py-2.5 text-sm font-medium text-background transition hover:bg-background/5 md:text-base"
                  >
                    {feedbackPath}
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                </div>
                <div className="mt-2 text-xs text-light-muted">
                  Share one link anywhere you want better customer feedback.
                </div>
              </div>
            </div>

            <div className="md:justify-self-end">
              <div className="text-xs font-medium uppercase tracking-wide text-light-muted">
                QR code
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl border border-light-muted/25 bg-white p-4 shadow-sm">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(feedbackUrl)}`}
                  alt={`QR code for ${feedbackUrl}`}
                  width={220}
                  height={220}
                />
              </div>
              <div className="mt-3 text-xs text-light-muted">
                Scan to open the feedback experience on mobile.
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-light px-6 pb-12 pt-10 text-background">
        <div className="mx-auto max-w-6xl">
          <SiteFooter />
        </div>
      </div>
    </main>
  );
}
