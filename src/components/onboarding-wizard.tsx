"use client";

import type { AgentPersona } from "@prisma/client";
import { useMemo, useState } from "react";

type Action = (formData: FormData) => void | Promise<void>;
type Values = {
  businessName?: string | null;
  businessType?: string | null;
  description?: string | null;
  goals?: string | null;
  recentChanges?: string | null;
  people?: string | null;
  products?: string | null;
  services?: string | null;
  locationName?: string | null;
  agentPersona?: AgentPersona | null;
};

const BUSINESS_TYPES = ["Website", "App/SaaS", "Restaurant/Cafe", "Retail", "Barber/Salon", "Gym", "Hospitality", "Service business", "Other"];
const PERSONAS: Array<{ value: AgentPersona; name: string; detail: string }> = [
  { value: "AMANDA", name: "Amanda", detail: "Friendly, warm, and casual" },
  { value: "DEREK", name: "Derek", detail: "Informal, upbeat, and energetic" },
  { value: "PROFESSIONAL", name: "Professional", detail: "Polished, calm, and reserved" },
  { value: "DIRECT", name: "Direct", detail: "Concise, efficient, and plain-spoken" },
];

export function OnboardingWizard({ action, initialValues }: { action: Action; initialValues: Values }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    businessName: initialValues.businessName || "",
    businessType: initialValues.businessType || "Restaurant/Cafe",
    description: initialValues.description || "",
    goals: initialValues.goals || "",
    recentChanges: initialValues.recentChanges || "",
    people: initialValues.people || "",
    products: initialValues.products || "",
    services: initialValues.services || "",
    locationName: initialValues.locationName || "Main feedback",
    agentPersona: initialValues.agentPersona || "AMANDA" as AgentPersona,
  });
  const update = (field: keyof typeof values, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const steps = [
    { question: "Let’s start simply. What should we call your business or Space?", answer: values.businessName },
    { question: "Tell me about the business, your customers, and what a good experience should feel like.", answer: values.description },
    { question: "What are the most important things you want to learn from customers?", answer: values.goals },
    { question: "Has anything changed recently that I should watch? It’s fine to say nothing.", answer: values.recentChanges || "Nothing recent" },
    { question: "Who or what should UrVue recognize by name?", answer: [values.people, values.products, values.services].filter(Boolean).join(" · ") || "Nothing yet" },
    { question: "Finally, choose who should talk with your customers.", answer: PERSONAS.find((persona) => persona.value === values.agentPersona)?.name || "Amanda" },
  ];
  const canContinue = useMemo(() => {
    if (step === 0) return values.businessName.trim().length > 1;
    if (step === 1) return values.description.trim().length > 10;
    if (step === 2) return values.goals.trim().length > 2;
    return true;
  }, [step, values]);

  return (
    <form action={action} className="mx-auto w-full max-w-3xl">
      {Object.entries(values).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">A conversation with UrVue</p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">Teach UrVue what matters</h1>
        <p className="mt-2 text-sm text-muted">No survey builder. Just tell us about the experience you want to understand.</p>

        <div className="mt-7 max-h-[52svh] space-y-4 overflow-y-auto rounded-2xl bg-surface/60 p-4 sm:p-5">
          {steps.slice(0, step + 1).map((item, index) => (
            <div key={item.question} className="space-y-2">
              <div className="max-w-[88%] rounded-2xl bg-card px-4 py-3 text-sm text-foreground"><span className="mb-1 block text-xs uppercase tracking-wide text-primary">UrVue</span>{item.question}</div>
              {index < step && <div className="ml-auto max-w-[88%] rounded-2xl bg-primary/15 px-4 py-3 text-sm text-foreground">{item.answer}</div>}
            </div>
          ))}

          {step === 0 && <div className="ml-auto grid max-w-[88%] gap-2 sm:grid-cols-[1fr_180px]"><input value={values.businessName} onChange={(event) => update("businessName", event.target.value)} placeholder="e.g., Northside Cafe" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" /><select value={values.businessType} onChange={(event) => update("businessType", event.target.value)} className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground">{BUSINESS_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>}
          {step === 1 && <textarea value={values.description} onChange={(event) => update("description", event.target.value.slice(0, 1_000))} placeholder="We’re a three-chair barbershop…" className="ml-auto block min-h-32 w-[88%] resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />}
          {step === 2 && <textarea value={values.goals} onChange={(event) => update("goals", event.target.value)} placeholder="Wait times, friendliness, pricing, whether people would return…" className="ml-auto block min-h-28 w-[88%] resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />}
          {step === 3 && <textarea value={values.recentChanges} onChange={(event) => update("recentChanges", event.target.value)} placeholder="New menu, price increase, recent hire—or nothing recent" className="ml-auto block min-h-24 w-[88%] resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />}
          {step === 4 && <div className="ml-auto grid w-[88%] gap-2"><input value={values.people} onChange={(event) => update("people", event.target.value)} placeholder="People: Chloe, Max" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" /><input value={values.products} onChange={(event) => update("products", event.target.value)} placeholder="Products: Patio menu, Pro plan" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" /><input value={values.services} onChange={(event) => update("services", event.target.value)} placeholder="Services: Lunch, delivery, checkout" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" /></div>}
          {step === 5 && <div className="ml-auto grid w-[88%] gap-2 sm:grid-cols-2">{PERSONAS.map((persona) => <button key={persona.value} type="button" onClick={() => update("agentPersona", persona.value)} className={`rounded-2xl border p-3 text-left ${values.agentPersona === persona.value ? "border-primary bg-primary/10" : "border-border bg-background"}`}><span className="block text-sm font-medium text-foreground">{persona.name}</span><span className="text-xs text-muted">{persona.detail}</span></button>)}</div>}
        </div>

        {step === 5 && <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/10 p-4"><div className="text-sm font-medium text-foreground">Ready to create your first Feedback Point?</div><input value={values.locationName} onChange={(event) => update("locationName", event.target.value)} placeholder="Main feedback" className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground" /></div>}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="rounded-full border border-border px-5 py-2.5 text-sm text-foreground disabled:opacity-40">Back</button>
          {step < 5 ? <button type="button" onClick={() => setStep((current) => current + 1)} disabled={!canContinue} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">Continue</button> : <button type="submit" disabled={!values.locationName.trim()} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">Confirm and start listening</button>}
        </div>
      </div>
    </form>
  );
}
