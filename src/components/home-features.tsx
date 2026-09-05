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
}: {
  title: string;
  description: string;
  leftLabel: string;
  rightLabel: string;
  items: Feature[];
  previews: Preview[];
  theme: Theme;
}) {
  const [active, setActive] = React.useState(0);
  const activeIdx = Math.max(0, Math.min(previews.length - 1, active));
  const preview = previews[activeIdx] ?? previews[0];
  const isLight = theme === "light";

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h2
          className={`font-serif text-4xl font-normal md:text-5xl ${
            isLight ? "text-background" : "text-foreground"
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-4 max-w-3xl text-sm leading-relaxed md:text-base ${
            isLight ? "text-light-muted" : "text-muted"
          }`}
        >
          {description}
        </p>
      </div>

      <div className="mt-12 grid gap-10 md:grid-cols-2 md:items-start">
        <div>
          <div
            className={`mb-4 text-xs font-medium uppercase tracking-wide ${
              isLight ? "text-light-muted" : "text-muted"
            }`}
          >
            {leftLabel}
          </div>
          <div className="space-y-2" role="tablist" aria-label={leftLabel}>
            {items.slice(0, previews.length).map((feature, index) => {
              const selected = index === activeIdx;
              return (
                <button
                  key={feature.title}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(index)}
                  className={`w-full cursor-pointer rounded-xl px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
                    selected
                      ? isLight
                        ? "border border-background/20 bg-background/5"
                        : "border border-foreground/20 bg-foreground/5"
                      : isLight
                        ? "hover:bg-background/5"
                        : "hover:bg-foreground/5"
                  }`}
                >
                  <div
                    className={`text-lg font-medium ${
                      isLight ? "text-background" : "text-foreground"
                    }`}
                  >
                    {feature.title}
                  </div>
                  <div
                    className={`mt-1 text-sm ${
                      isLight ? "text-light-muted" : "text-muted"
                    }`}
                  >
                    {feature.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div
            className={`mb-4 text-xs font-medium uppercase tracking-wide ${
              isLight ? "text-light-muted" : "text-muted"
            }`}
          >
            {rightLabel}
          </div>
          <div
            role="tabpanel"
            className={`overflow-hidden rounded-2xl border p-5 shadow-xl ${
              isLight
                ? "border-border/60 bg-background"
                : "border-border bg-card"
            }`}
          >
            <div className="rounded-2xl border border-border bg-surface/60 p-5">
              <div className="text-xs uppercase tracking-wide text-primary">
                {preview.kicker}
              </div>
              <div className="mt-2 text-2xl font-semibold text-foreground">
                {preview.title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {preview.detail}
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface/70 p-4">
                <div className="text-xs text-muted">Customer words</div>
                <div className="mt-3 space-y-2">
                  <div className="h-2.5 w-5/6 rounded bg-border" />
                  <div className="h-2.5 w-2/3 rounded bg-border" />
                  <div className="h-2.5 w-3/4 rounded bg-border" />
                </div>
              </div>
              <div className="rounded-xl bg-surface/70 p-4">
                <div className="text-xs text-muted">Actionable output</div>
                <div className="mt-3 space-y-2">
                  <div className="h-2.5 w-1/2 rounded bg-primary/70" />
                  <div className="h-2.5 w-4/5 rounded bg-border" />
                  <div className="h-2.5 w-3/5 rounded bg-border" />
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
    kicker: "Conversation",
    title: "Ask better follow-ups",
    detail: "UrVue listens for details instead of collecting form answers.",
  },
  {
    kicker: "Focus topics",
    title: "Guide the AI",
    detail: "Aim each conversation at the decisions your business needs to make.",
  },
  {
    kicker: "Insights",
    title: "Turn words into actions",
    detail: "Themes, quotes, pain points, praise, and suggested next steps.",
  },
  {
    kicker: "Share",
    title: "One link anywhere",
    detail: "Add feedback to a site, QR code, receipt, front desk sign, or email.",
  },
];

const clientPreviews: Preview[] = [
  {
    kicker: "Websites and apps",
    title: "Experience clarity",
    detail: "Hear what users actually say about flows, features, and friction.",
  },
  {
    kicker: "Restaurants",
    title: "Service signal",
    detail: "Learn what people loved, what slowed them down, and what brings them back.",
  },
  {
    kicker: "Barbers and salons",
    title: "Repeat-customer insight",
    detail: "Understand the details behind loyalty, trust, comfort, and service quality.",
  },
  {
    kicker: "Local services",
    title: "Better decisions",
    detail: "Organize customer conversations into themes, quotes, and next actions.",
  },
];

export function HomeFeatures({ features }: { features: Feature[] }) {
  return (
    <InteractiveSplitSection
      title="Feedback at its best"
      description="UrVue keeps the feedback loop intentionally small: one customer conversation, one clear summary, and a dashboard that points to what your business should improve next."
      leftLabel="Features"
      rightLabel="Preview"
      items={features}
      previews={featurePreviews}
      theme="light"
    />
  );
}

export function HomeClients({ clients }: { clients: Feature[] }) {
  return (
    <InteractiveSplitSection
      title="Built for customer-facing businesses"
      description="UrVue is for people who want real feedback without building a research operation. Start with one link, learn from every conversation, and let patterns emerge over time."
      leftLabel="Use cases"
      rightLabel="Feedback preview"
      items={clients}
      previews={clientPreviews}
      theme="dark"
    />
  );
}
