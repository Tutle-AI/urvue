import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HomeClients, HomeFeatures } from "@/components/home-features";
import { env } from "@/lib/env";

const featureList = [
  {
    title: "Workspaces",
    description:
      "Organize your locations into Workspaces to keep your projects separate and organized, and switch between them with ease.",
  },
  {
    title: "Compact Mode",
    description:
      "URVUE's Compact Mode gives you more screen real estate by hiding extra UI when you don't need it, and showing it when you do.",
  },
  {
    title: "Glance",
    description:
      "Glance allows you to quickly switch between your most-used tabs, without having to scroll through your history.",
  },
  {
    title: "Split View",
    description:
      "Split View allows you to view two tabs side by side, making it easier to compare and switch between them.",
  },
];

const clientTypes = [
  {
    title: "Website",
    description:
      "Understand where users get stuck and what they expected to happen—straight from their words.",
  },
  {
    title: "Restaurant",
    description:
      "Capture honest feedback about ordering, service, and atmosphere through real conversations.",
  },
  {
    title: "Event",
    description:
      "Collect reactions while the experience is fresh—from check-in to the closing moments.",
  },
  {
    title: "Barber",
    description:
      "Learn what customers loved (or didn’t) so you can refine the experience and build loyalty.",
  },
];

export default function Home() {
  const feedbackSlug = "urvue";
  const feedbackPath = `/feedback/${feedbackSlug}`;
  const feedbackUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${feedbackPath}`;
  return (
    <main className="bg-background text-foreground">
      {/* Landing (dark) */}
      <section className="bg-background">
        {/* Keep initial viewport fully dark */}
        <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col px-6">
          <SiteHeader />

          <div className="pt-24 text-center md:pt-28 lg:pt-32">
            <div className="mx-auto max-w-5xl">
              <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
                clear <span className="italic">feedback</span>
                <br />
                from conversations
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-sm text-muted md:text-base">
                Collect real feedback from your customers from their real
                conversations.
                <br />
                Get real insights based on the real data they give you.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/sign-up"
                  className="flex items-center gap-2 rounded-full border border-foreground/30 bg-transparent px-8 py-3.5 text-[15px] font-medium text-foreground transition hover:border-foreground hover:bg-foreground/5 md:text-base"
                >
                  Start free trial
                  <span className="text-xs">→</span>
                </Link>
                <Link
                  href="/sign-in"
                  className="flex items-center gap-2 rounded-full bg-foreground px-8 py-3.5 text-[15px] font-medium text-background transition hover:bg-foreground/90 md:text-base"
                >
                  <span className="text-[1.5em] leading-none text-primary">♥</span>
                  Sign in
                </Link>
              </div>

              {/* Social Icons */}
              <div className="mt-8 flex items-center justify-center gap-3 text-muted">
                <Link
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 transition hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 md:h-7 md:w-7"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M23.5 6.2s-.23-1.65-.94-2.38c-.9-.96-1.91-.97-2.37-1.03C16.9 2.5 12 2.5 12 2.5h-.01s-4.9 0-8.19.29c-.46.06-1.47.07-2.37 1.03C.72 4.55.5 6.2.5 6.2S0 8.14 0 10.07v1.86c0 1.93.5 3.87.5 3.87s.22 1.65.93 2.38c.9.96 2.08.93 2.6 1.03 1.89.18 8 .29 8 .29s4.91-.01 8.2-.3c.46-.05 1.47-.06 2.37-1.02.71-.73.94-2.38.94-2.38s.5-1.94.5-3.87v-1.86c0-1.93-.5-3.87-.5-3.87zM9.75 14.44V7.56l6.25 3.44-6.25 3.44z" />
                  </svg>
                </Link>

                <Link
                  href="https://bsky.app"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Bluesky"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 transition hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                >
                  <svg
                    viewBox="0 0 64 57"
                    className="h-6 w-6 md:h-7 md:w-7"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z" />
                  </svg>
                </Link>

                <Link
                  href="https://www.tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 transition hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 md:h-7 md:w-7"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </Link>
              </div>

              {/* Hero Visual (stand-in): directly under social, overlaps into light */}
              <div className="mt-10">
                <div className="mx-auto w-full max-w-7xl">
                  <div className="-mb-28 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:-mb-36 lg:-mb-44">
                    <div className="flex h-[420px] md:h-[520px] lg:h-[620px]">
                      {/* Left sidebar mockup */}
                      <div className="hidden w-64 border-r border-border bg-surface p-6 md:block">
                        <div className="mb-5 text-xs text-muted">app.urvue.app</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 rounded bg-primary/20 px-3 py-2 text-sm text-primary">
                            <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                            Dashboard
                          </div>
                          <div className="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted">
                            <span className="h-2.5 w-2.5 rounded-full bg-muted"></span>
                            Locations
                          </div>
                          <div className="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted">
                            <span className="h-2.5 w-2.5 rounded-full bg-muted"></span>
                            Sessions
                          </div>
                        </div>

                        <div className="mt-8 rounded-xl border border-border bg-card/50 p-4">
                          <div className="text-xs text-muted">This week</div>
                          <div className="mt-2 text-2xl font-semibold text-foreground">
                            128
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            new feedback items
                          </div>
                          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-border">
                            <div className="h-full w-2/3 rounded-full bg-primary/70"></div>
                          </div>
                        </div>
                      </div>

                      {/* Main content area */}
                      <div className="flex flex-1 flex-col">
                        {/* Top bar */}
                        <div className="flex items-center justify-between border-b border-border bg-surface/60 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-card"></div>
                            <div className="text-left">
                              <div className="text-sm font-medium">URVUE</div>
                              <div className="text-xs text-muted">
                                Dashboard preview
                              </div>
                            </div>
                          </div>
                          <div className="hidden items-center gap-2 md:flex">
                            <div className="h-9 w-28 rounded-full bg-card"></div>
                            <div className="h-9 w-9 rounded-full bg-card"></div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="grid flex-1 gap-6 p-6 md:grid-cols-2">
                          <div className="rounded-2xl border border-border bg-surface/40 p-6">
                            <div className="text-xs text-muted">
                              Feedback sentiment
                            </div>
                            <div className="mt-4 h-28 w-full rounded-xl bg-gradient-to-br from-primary/30 to-accent/15"></div>
                            <div className="mt-5 space-y-3">
                              <div className="h-3 w-5/6 rounded bg-border"></div>
                              <div className="h-3 w-2/3 rounded bg-border"></div>
                              <div className="h-3 w-1/2 rounded bg-border"></div>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-border bg-surface/40 p-6">
                            <div className="text-xs text-muted">
                              Latest sessions
                            </div>
                            <div className="mt-5 space-y-4">
                              <div className="flex items-center justify-between rounded-xl bg-card/60 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-border"></div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      Checkout flow
                                    </div>
                                    <div className="text-xs text-muted">
                                      2m ago
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted">+12</div>
                              </div>
                              <div className="flex items-center justify-between rounded-xl bg-card/60 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-border"></div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      Pricing page
                                    </div>
                                    <div className="text-xs text-muted">
                                      18m ago
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted">+7</div>
                              </div>
                              <div className="flex items-center justify-between rounded-xl bg-card/60 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-border"></div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      Onboarding
                                    </div>
                                    <div className="text-xs text-muted">
                                      1h ago
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted">+4</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Features Section - Light */}
      <section
        id="features"
        className="bg-light px-6 pb-24 pt-44 text-background md:pt-56 lg:pt-64"
      >
        <HomeFeatures features={featureList} />
      </section>

      {/* Clients Section - Dark */}
      <section className="bg-background px-6 pb-24 pt-44 md:pt-56 lg:pt-64">
        <HomeClients clients={clientTypes} />
      </section>

      {/* Give us your feedback - Light */}
      <section className="bg-light px-6 pb-20 pt-44 text-background md:pb-24 md:pt-56 lg:pt-64">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-start">
            <div>
              <h2 className="font-serif text-4xl font-normal md:text-5xl">
                Now give us your feedback
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-light-muted md:text-base">
                We’re using URVUE on URVUE. Tell us what feels great, what feels
                off, and what you’d change. Your feedback helps us ship a better
                product—fast.
              </p>

              <div className="mt-8">
                <div className="text-xs font-medium uppercase tracking-wide text-light-muted">
                  Text link
                </div>
                <div className="mt-3">
                  <Link
                    href={feedbackPath}
                    className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/0 px-5 py-2.5 text-sm font-medium text-background transition hover:bg-background/5 md:text-base"
                  >
                    {feedbackPath}
                    <span className="text-xs">→</span>
                  </Link>
                </div>
                <div className="mt-2 text-xs text-light-muted">
                  Share this link with anyone to collect feedback through a real
                  conversation.
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

      {/* Footer */}
      <div className="bg-light px-6 pb-12 pt-10 text-background">
        <div className="mx-auto max-w-6xl">
          <SiteFooter />
        </div>
      </div>
    </main>
  );
}
