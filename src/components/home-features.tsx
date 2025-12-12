"use client";

import * as React from "react";

type Feature = {
  title: string;
  description: string;
};

type Preview = {
  kicker: string;
  title: string;
  detail: string;
  gradient: string;
};

type Theme = "light" | "dark";

function InteractiveSplitSection({
  title,
  description,
  leftLabel,
  rightLabel,
  items,
  previews,
  theme,
  overlapPreview,
}: {
  title: string;
  description: string;
  leftLabel: string;
  rightLabel: string;
  items: Feature[];
  previews: Preview[];
  theme: Theme;
  overlapPreview?: boolean;
}) {
  const safeItems = React.useMemo(
    () => items.slice(0, previews.length),
    [items, previews.length],
  );
  const [active, setActive] = React.useState(0);
  const activeIdx = Math.max(0, Math.min(previews.length - 1, active));
  const preview = previews[activeIdx] ?? previews[0];

  const titleText = theme === "light" ? "text-background" : "text-foreground";
  const descText = theme === "light" ? "text-light-muted" : "text-muted";
  const labelText = theme === "light" ? "text-light-muted" : "text-muted";
  const itemTitleText = theme === "light" ? "text-background" : "text-foreground";
  const itemDescText = theme === "light" ? "text-light-muted" : "text-muted";
  const activeItem = theme === "light"
    ? "border border-foreground/20 bg-background/5"
    : "border border-foreground/20 bg-foreground/5";
  const inactiveItem = theme === "light"
    ? "hover:bg-background/4"
    : "hover:bg-foreground/5";
  const previewShell =
    theme === "light"
      ? "border border-border/60 bg-background shadow-xl"
      : "border border-border bg-card shadow-xl";
  const previewTopbar =
    theme === "light"
      ? "border-b border-border/70 bg-surface/40"
      : "border-b border-border bg-surface/60";
  const previewOverlap = overlapPreview
    ? "relative z-10 -mb-24 md:-mb-32 lg:-mb-40"
    : "";
  const previewSize = overlapPreview ? "min-h-[520px] md:min-h-[560px] lg:min-h-[620px]" : "";

  return (
    <div className="mx-auto max-w-6xl">
      {/* Title + full-width description */}
      <div>
        <h2 className={`font-serif text-4xl font-normal md:text-5xl ${titleText}`}>
          {title}
        </h2>
        <p className={`mt-4 text-sm leading-relaxed md:text-base ${descText}`}>
          {description}
        </p>
      </div>

      {/* Features | Image */}
      <div className="mt-12">
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`text-xs font-medium uppercase tracking-wide ${labelText}`}>
            {leftLabel}
          </div>
          <div className={`text-xs font-medium uppercase tracking-wide ${labelText}`}>
            {rightLabel}
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {/* Left: Feature list */}
          <div className="space-y-2" role="tablist" aria-label="Features">
            {safeItems.map((feature, index) => {
              const isActive = index === activeIdx;
              return (
                <button
                  key={feature.title}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(index)}
                  className={[
                    "w-full cursor-pointer rounded-xl px-5 py-4 text-left transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    isActive ? activeItem : inactiveItem,
                  ].join(" ")}
                >
                  <div
                    className={[
                      "text-lg font-medium",
                      isActive
                        ? `${itemTitleText} underline decoration-primary decoration-2 underline-offset-4`
                        : itemTitleText,
                    ].join(" ")}
                  >
                    {feature.title}
                  </div>
                  <div className={`mt-1 text-sm ${itemDescText}`}>
                    {feature.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Preview (stand-in) */}
          <div
            role="tabpanel"
            aria-label="Feature preview"
            className={`overflow-hidden rounded-2xl ${previewShell} ${previewSize} ${previewOverlap}`}
          >
            <div className={`${previewTopbar} px-5 py-4`}>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-xs text-muted">URVUE</div>
                  <div className="text-sm font-medium text-foreground">
                    {preview.kicker}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-20 rounded-full bg-card/70"></div>
                  <div className="h-8 w-8 rounded-full bg-card/70"></div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div
                className={[
                  "rounded-2xl border border-border/60 bg-gradient-to-br p-6",
                  preview.gradient,
                ].join(" ")}
              >
                <div className="text-xs text-muted">Highlight</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">
                  {preview.title}
                </div>
                <div className="mt-2 text-sm text-muted">{preview.detail}</div>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-card/60 p-4">
                    <div className="h-3 w-2/3 rounded bg-border"></div>
                    <div className="mt-3 h-3 w-5/6 rounded bg-border"></div>
                    <div className="mt-3 h-3 w-1/2 rounded bg-border"></div>
                  </div>
                  <div className="rounded-xl bg-card/60 p-4">
                    <div className="h-3 w-1/2 rounded bg-border"></div>
                    <div className="mt-3 h-3 w-3/4 rounded bg-border"></div>
                    <div className="mt-3 h-3 w-2/3 rounded bg-border"></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-card/50 p-5">
                  <div className="text-xs text-muted">Recent</div>
                  <div className="mt-3 space-y-3">
                    <div className="h-3 w-5/6 rounded bg-border"></div>
                    <div className="h-3 w-2/3 rounded bg-border"></div>
                    <div className="h-3 w-3/4 rounded bg-border"></div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/50 p-5">
                  <div className="text-xs text-muted">Insights</div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-border">
                    <div className="h-full w-2/3 rounded-full bg-primary/70"></div>
                  </div>
                  <div className="mt-4 text-sm text-muted">
                    Faster iteration, clearer signals.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const featurePreviews: Preview[] = [
  {
    kicker: "Workspaces",
    title: "Organize projects by location",
    detail: "Separate teams and locations cleanly.",
    gradient: "from-primary/25 to-accent/10",
  },
  {
    kicker: "Compact Mode",
    title: "More signal, less UI",
    detail: "Hide the extras until you need them.",
    gradient: "from-accent/18 to-primary/10",
  },
  {
    kicker: "Glance",
    title: "Jump between important tabs",
    detail: "Your most-used views, always one click away.",
    gradient: "from-primary/20 to-transparent",
  },
  {
    kicker: "Split View",
    title: "Compare feedback side-by-side",
    detail: "Two streams, one screen.",
    gradient: "from-accent/14 to-transparent",
  },
];

const clientPreviews: Preview[] = [
  {
    kicker: "Website",
    title: "Conversion clarity",
    detail: "See what users *actually* say while navigating your site.",
    gradient: "from-primary/22 to-accent/10",
  },
  {
    kicker: "Restaurant",
    title: "Experience feedback",
    detail: "From ordering to ambiance—get the human story behind ratings.",
    gradient: "from-accent/16 to-primary/10",
  },
  {
    kicker: "Event",
    title: "Moments that matter",
    detail: "Capture reactions in real-time, while it’s still fresh.",
    gradient: "from-primary/18 to-transparent",
  },
  {
    kicker: "Barber",
    title: "Local loyalty",
    detail: "Understand what keeps customers coming back—beyond stars.",
    gradient: "from-accent/14 to-transparent",
  },
];

export function HomeFeatures({ features }: { features: Feature[] }) {
  return (
    <InteractiveSplitSection
      title="Feedback at its best"
      description="URVUE is packed with features that help you stay productive and focused. Feedback should be tools that help you get things done, not distractions that keep you from your work."
      leftLabel="Features"
      rightLabel="Preview"
      items={features}
      previews={featurePreviews}
      theme="light"
      overlapPreview
    />
  );
}

export function HomeClients({ clients }: { clients: Feature[] }) {
  return (
    <InteractiveSplitSection
      title="Clients"
      description="URVUE is everywhere our clients want genuine feedback from users, captured through real conversations. From restaurants and websites to events and your local barber, URVUE helps you understand customers in a human way."
      leftLabel="Clients"
      rightLabel="Demo websites"
      items={clients}
      previews={clientPreviews}
      theme="dark"
      overlapPreview
    />
  );
}

