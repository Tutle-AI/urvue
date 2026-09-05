import Link from "next/link";

const plans = [
  {
    name: "Basic",
    price: "$24.99",
    description: "For one business getting started with customer conversations.",
    features: [
      "5 feedback points",
      "AI-led feedback conversations",
      "Structured summaries and themes",
      "Session history",
    ],
    cta: "Start free trial",
    href: "/sign-up",
  },
  {
    name: "Pro",
    price: "$49",
    description: "For teams collecting feedback across more locations, services, or moments.",
    features: [
      "5 feedback points",
      "Actionable insight dashboard",
      "Theme, pain point, and quote tracking",
      "Priority support",
    ],
    cta: "Start Pro",
    href: "/sign-up",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-20 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Pricing
          </p>
          <h1 className="mt-4 font-serif text-5xl font-normal leading-tight">
            Simple pricing for simple feedback loops
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
            UrVue is built for businesses that want useful customer feedback without a
            research platform, survey maze, or heavyweight setup.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-3xl border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {plan.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold text-foreground">
                    {plan.price}
                  </div>
                  <div className="text-xs text-muted">per month</div>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-muted">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-primary">*</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:brightness-110"
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted">
          Need more feedback points, higher volume, or custom reporting? UrVue can grow
          into an Enterprise plan without changing the core experience.
        </div>
      </div>
    </main>
  );
}
