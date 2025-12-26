"use client";

import { useMemo, useState } from "react";

type Action = (formData: FormData) => void | Promise<void>;

type InitialValues = {
  businessName?: string | null;
  businessType?: string | null;
  description?: string | null;
  focusTopic1?: string | null;
  focusTopic2?: string | null;
  focusTopic3?: string | null;
  locationName?: string | null;
};

const BUSINESS_TYPES = [
  "Website",
  "Restaurant",
  "Retail",
  "Barbershop",
  "Salon/Spa",
  "Event",
  "Other",
] as const;

export function OnboardingWizard({
  action,
  initialValues,
}: {
  action: Action;
  initialValues: InitialValues;
}) {
  const [step, setStep] = useState(1);

  const [businessName, setBusinessName] = useState(
    initialValues.businessName ?? "",
  );
  const [businessType, setBusinessType] = useState(
    initialValues.businessType ?? "Website",
  );
  const [locationName, setLocationName] = useState(
    initialValues.locationName ?? "Main location",
  );
  const [description, setDescription] = useState(
    initialValues.description ?? "",
  );
  const [focusTopic1, setFocusTopic1] = useState(
    initialValues.focusTopic1 ?? "",
  );
  const [focusTopic2, setFocusTopic2] = useState(
    initialValues.focusTopic2 ?? "",
  );
  const [focusTopic3, setFocusTopic3] = useState(
    initialValues.focusTopic3 ?? "",
  );

  const canContinueStep1 = businessName.trim().length > 1;
  const canContinueStep2 =
    description.trim().length > 0 && description.trim().length <= 500;
  const canFinish = useMemo(() => {
    const topics = [focusTopic1, focusTopic2, focusTopic3]
      .map((t) => t.trim())
      .filter(Boolean);
    return topics.length >= 1;
  }, [focusTopic1, focusTopic2, focusTopic3]);

  return (
    <form action={action} className="mx-auto w-full max-w-2xl">
      {/* Keep wizard state in the form across steps (inputs unmount per step) */}
      <input type="hidden" name="businessName" value={businessName} />
      <input type="hidden" name="businessType" value={businessType} />
      <input type="hidden" name="locationName" value={locationName} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="focusTopic1" value={focusTopic1} />
      <input type="hidden" name="focusTopic2" value={focusTopic2} />
      <input type="hidden" name="focusTopic3" value={focusTopic3} />

      <div className="rounded-3xl border border-border bg-card p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Setup</p>
            <h1 className="text-2xl font-semibold text-foreground">
              Let’s personalize URVUE
            </h1>
          </div>
          <div className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted">
            Step {step} of 3
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted">Business name</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Northside Coffee"
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-muted">Business type</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
                  >
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted">Location name</label>
                  <input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Main location"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <label className="text-sm text-muted">
                    Short description (shown only to your AI)
                  </label>
                  <p className="mt-1 text-xs text-muted">
                    Example: “We’re a fast-casual lunch spot. Ask about speed,
                    friendliness, and order accuracy.”
                  </p>
                </div>
                <div className="text-xs text-muted">
                  {description.length}/500
                </div>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="Tell URVUE what you do and what a great experience looks like…"
                className="min-h-[140px] w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
                required
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted">
                  What should URVUE ask about?
                </label>
                <p className="mt-1 text-xs text-muted">
                  Add up to 3 focus areas. One is enough to start.
                </p>
              </div>

              <div className="grid gap-3">
                <input
                  value={focusTopic1}
                  onChange={(e) => setFocusTopic1(e.target.value)}
                  placeholder="1) e.g., Speed of service"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
                />
                <input
                  value={focusTopic2}
                  onChange={(e) => setFocusTopic2(e.target.value)}
                  placeholder="2) e.g., Product quality"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
                />
                <input
                  value={focusTopic3}
                  onChange={(e) => setFocusTopic3(e.target.value)}
                  placeholder="3) e.g., Cleanliness"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
                />
              </div>

              <div className="rounded-2xl border border-border bg-surface/60 p-4 text-sm text-muted">
                You can edit these later in <span className="text-foreground">Settings</span>.
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={
                (step === 1 && !canContinueStep1) ||
                (step === 2 && !canContinueStep2)
              }
              className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canFinish}
              className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
            >
              Finish setup
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

