import type { ReactNode } from "react";
import Link from "next/link";

function UrvueLogo({ size }: { size: "default" | "xl" }) {
  const isXL = size === "xl";
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-4 font-serif font-normal tracking-tight ${
        isXL ? "text-3xl md:text-4xl" : "text-xl"
      }`}
      id="urvueAuthLogoLink"
    >
      <span
        className={`inline-flex items-center justify-center ${
          isXL ? "h-[76px] w-[76px]" : "h-[38px] w-[38px]"
        }`}
      >
        <svg viewBox="0 0 56 32" className="h-full w-full" role="img" aria-label="UrVue logo">
          <circle cx="20" cy="16" r="14" fill="#F3E9D8" />
          <circle cx="36" cy="16" r="14" fill="#D3613A">
            <animate
              attributeName="cx"
              dur="700ms"
              repeatCount="1"
              begin="urvueAuthLogoLink.mouseover"
              values="36;20;19.25;20.75;19.6;20.4;36"
              keyTimes="0;0.45;0.55;0.65;0.75;0.82;1"
              fill="remove"
            />
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              dur="700ms"
              repeatCount="1"
              begin="urvueAuthLogoLink.mouseover"
              values="0 36 16;0 20 16;-8 20 16;8 20 16;-6 20 16;6 20 16;0 36 16"
              keyTimes="0;0.45;0.55;0.65;0.75;0.82;1"
              fill="remove"
            />
          </circle>
        </svg>
      </span>
      UrVue
    </Link>
  );
}

function AuthArt({ variant }: { variant: "sign-in" | "sign-up" }) {
  const badge = variant === "sign-up" ? "Start free" : "Welcome back";

  return (
    <div className="relative h-full w-full overflow-hidden bg-light text-background">
      <div className="relative mx-auto flex h-full max-w-xl items-center justify-center px-10 py-14">
        <div className="relative w-full">
          <div className="absolute left-10 top-6 hidden w-[78%] -rotate-3 rounded-[28px] border border-light-muted/25 bg-white/70 p-6 shadow-xl md:block">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-light-muted">
                Feedback
              </div>
              <div className="rounded-full bg-background/10 px-3 py-1 text-xs font-medium text-background">
                {badge}
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-3 w-5/6 rounded bg-background/10" />
              <div className="h-3 w-2/3 rounded bg-background/10" />
              <div className="h-3 w-1/2 rounded bg-background/10" />
            </div>
          </div>

          <div className="relative mx-auto w-full rounded-[32px] border border-light-muted/25 bg-white p-6 shadow-2xl md:p-7">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-light-muted">
                  urvue.app
                </div>
                <div className="mt-3 font-serif text-3xl font-normal leading-[1.05]">
                  Feedback that feels human
                </div>
                <p className="mt-3 text-sm leading-relaxed text-light-muted">
                  Conversations to summaries to decisions.
                </p>
              </div>
              <div className="hidden h-12 w-12 rounded-2xl bg-primary/20 md:block" />
            </div>

            <div className="mt-7 grid gap-3">
              <div className="rounded-2xl bg-background/5 px-4 py-3">
                <div className="text-xs font-medium text-light-muted">Today</div>
                <div className="mt-1 flex items-end justify-between">
                  <div className="text-3xl font-semibold">12</div>
                  <div className="text-xs text-light-muted">new insights</div>
                </div>
              </div>

              <div className="rounded-2xl bg-background/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Top theme</div>
                  <div className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-background">
                    onboarding
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background/10">
                  <div className="h-full w-2/3 rounded-full bg-primary/60" />
                </div>
              </div>

              <div className="rounded-2xl bg-background/5 px-4 py-3">
                <div className="text-sm font-medium">Last quote</div>
                <div className="mt-2 text-sm text-light-muted">
                  &quot;Loved the flow. Checkout felt effortless.&quot;
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-6 -top-8 hidden rounded-full border border-light-muted/25 bg-white/80 px-4 py-2 text-sm font-medium shadow-lg md:block">
            <span className="text-primary">*</span> ship faster
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthSplitLayout({
  title,
  description,
  variant,
  children,
}: {
  title: ReactNode;
  description: string;
  variant: "sign-in" | "sign-up";
  children: ReactNode;
}) {
  const otherHref = variant === "sign-in" ? "/sign-up" : "/sign-in";
  const otherText = variant === "sign-in" ? "Create an account" : "Sign in";
  const otherPrefix = variant === "sign-in" ? "New here?" : "Already have an account?";

  return (
    <main className="min-h-[100svh] bg-background text-foreground md:grid md:grid-cols-2">
      <div className="fixed left-0 top-0 z-20 p-6 md:p-8">
        <UrvueLogo size="xl" />
      </div>

      <section className="bg-background">
        <div className="mx-auto flex min-h-[100svh] max-w-xl flex-col px-6 md:px-10">
          <div className="flex flex-1 flex-col justify-center pb-12 pt-28 md:pt-36">
            <h1 className="font-serif text-5xl font-normal leading-[0.95] tracking-tight md:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted md:text-base">
              {description}
            </p>

            <div className="mt-10 w-full max-w-[420px]">{children}</div>

            <div className="mt-6 text-sm text-muted">
              {otherPrefix}{" "}
              <Link href={otherHref} className="text-foreground underline">
                {otherText}
              </Link>
            </div>

            <p className="mt-8 text-xs text-muted">
              By continuing, you agree to our terms and privacy policy.
            </p>
          </div>
        </div>
      </section>

      <section className="relative hidden min-h-[100svh] md:block">
        <AuthArt variant={variant} />
      </section>

      <section className="md:hidden">
        <div className="h-[380px]">
          <AuthArt variant={variant} />
        </div>
      </section>
    </main>
  );
}
