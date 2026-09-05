"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { feedbackPointSchema, POINT_PERSONALITIES, POINT_TYPES, type PointActionState, type PointBrief } from "@/lib/feedback-point";
import { openingMessage, PERSONAS } from "@/lib/interview";

const steps = ["The experience", "Conversation goals", "Your agent"];
const suggestions: Record<string, string[]> = {
  Website: ["How easily visitors find what they need", "What feels confusing or gets in the way", "What would bring visitors back"],
  "Video game": ["What makes players want to keep playing", "Where players feel stuck or frustrated", "How the controls and pacing feel"],
  "Restaurant / Café": ["How the food compared with expectations", "How welcomed guests felt", "What would make the next visit better"],
  "Barber / Salon": ["How well the result matched what they wanted", "How comfortable the appointment felt", "Whether booking was easy"],
  Retail: ["How easy it was to find the right product", "How confident customers felt about their purchase", "What could improve checkout"],
};
const defaultSuggestions = ["What people enjoyed most", "What could have been easier", "What would make them come back"];
const fieldClass = "mt-2 w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/15 aria-invalid:border-red-400";

export function PointEditor({ action, initial, remaining, readOnly = false }: {
  action: (state: PointActionState, data: FormData) => Promise<PointActionState>;
  initial?: PointBrief;
  remaining?: number;
  readOnly?: boolean;
}) {
  const [values, setValues] = useState<PointBrief>(initial || { name: "", businessType: "Website", description: "", goals: [""], agentPersona: "AMANDA" });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, formAction, pending] = useActionState(action, {});
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial || { name: "", businessType: "Website", description: "", goals: [""], agentPersona: "AMANDA" });
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (previousStep.current !== step) { heading.current?.focus(); previousStep.current = step; }
  }, [step]);

  const update = <K extends keyof PointBrief>(key: K, value: PointBrief[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  const validate = (all = false) => {
    const result = feedbackPointSchema.safeParse(values);
    const currentFields = all ? ["name", "businessType", "description", "goals", "agentPersona"] : step === 0 ? ["name", "businessType", "description"] : step === 1 ? ["goals"] : ["agentPersona"];
    const nextErrors: Record<string, string> = {};
    if (!result.success) for (const issue of result.error.issues) {
      const field = String(issue.path[0]);
      if (currentFields.includes(field)) nextErrors[field] ||= issue.message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (all) setStep(nextErrors.name || nextErrors.businessType || nextErrors.description ? 0 : 1);
      return false;
    }
    return true;
  };
  const errorFor = (field: string) => errors[field] || state.fields?.[field];
  const personality = POINT_PERSONALITIES.find((item) => item.value === values.agentPersona)!;
  const greeting = openingMessage({ persona: values.agentPersona, spaceName: values.name, feedbackPointName: values.name.trim() || "this feedback point" });
  const addGoal = (goal: string) => {
    if (values.goals.includes(goal)) return;
    const empty = values.goals.findIndex((item) => !item.trim());
    if (empty !== -1) update("goals", values.goals.map((item, index) => index === empty ? goal : item));
    else if (values.goals.length < 12) update("goals", [...values.goals, goal]);
  };

  return (
    <div className="pb-14">
      <Link href="/dashboard/feedback-points" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground">← Feedback Points</Link>
      <div className="mb-8 mt-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">A little context. Better conversations.</p><h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">{initial ? "Shape the conversation." : "Every experience has a story."}</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{initial ? `Fine-tune how your agent listens at ${initial.name}.` : "Give this feedback point an agent that knows what matters here."}</p></div>
        {remaining !== undefined && <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted">{remaining} point{remaining === 1 ? "" : "s"} available</span>}
      </div>

      <form action={formAction} onReset={(event) => event.preventDefault()} onSubmit={(event) => {
        if (step < 2) { event.preventDefault(); if (validate()) setStep(step + 1); }
        else if (!validate(true)) event.preventDefault();
      }}>
        <input type="hidden" name="name" value={values.name} />
        <input type="hidden" name="businessType" value={values.businessType} />
        <input type="hidden" name="description" value={values.description} />
        <input type="hidden" name="agentPersona" value={values.agentPersona} />
        {values.goals.map((goal, index) => <input key={index} type="hidden" name="goal" value={goal} />)}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_270px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <nav aria-label="Feedback point setup" className="grid grid-cols-3 border-b border-border bg-surface/40 px-3 sm:px-5">
              {steps.map((label, index) => <button key={label} type="button" disabled={pending} aria-current={step === index ? "step" : undefined} onClick={() => { if (index < step || validate()) setStep(index); }} className={`flex flex-col items-center gap-2 border-b-2 px-1 py-5 text-xs transition sm:flex-row sm:gap-2.5 ${index === step ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${index === step ? "bg-primary text-white" : "bg-background text-muted"}`}>{index < step ? "✓" : `0${index + 1}`}</span>{label}</button>)}
            </nav>

            <fieldset disabled={pending || readOnly} className="min-w-0 p-5 sm:p-8">
              <p className="text-xs text-primary">Step {step + 1} of 3</p>
              <h2 ref={heading} tabIndex={-1} className="mt-2 font-serif text-3xl outline-none">{["What are we listening to?", "What would you love to learn?", "Make it sound like you."][step]}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{["A website, a neighborhood spot, a game—give your agent a feel for the experience.", "Think of these as things to explore. Your agent will weave them into a natural conversation.", "Choose the presence that fits this experience. Every personality listens carefully and asks thoughtful follow-ups."][step]}</p>

              {step === 0 && <div className="mt-7 space-y-5">
                <div><label htmlFor="point-name" className="text-sm font-medium">Feedback point name</label><input id="point-name" autoComplete="off" value={values.name} maxLength={120} onChange={(event) => update("name", event.target.value)} placeholder="e.g., Courtside — sports website" aria-invalid={!!errorFor("name")} aria-describedby={errorFor("name") ? "name-error" : undefined} className={fieldClass} />{errorFor("name") && <p id="name-error" className="mt-2 text-xs text-red-300">{errorFor("name")}</p>}</div>
                <div><label htmlFor="point-type" className="text-sm font-medium">Kind of experience</label><select id="point-type" value={values.businessType} onChange={(event) => update("businessType", event.target.value)} className={fieldClass}>{!POINT_TYPES.includes(values.businessType) && <option>{values.businessType}</option>}{POINT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
                <div><label htmlFor="point-description" className="text-sm font-medium">Tell your agent about it</label><p id="description-help" className="mt-1 text-xs leading-relaxed text-muted">Who is it for? What do people come here to do? What should a great experience feel like?</p><textarea id="point-description" rows={5} maxLength={2000} value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Courtside helps basketball fans follow their teams. Visitors come for live scores, thoughtful game recaps, and a place to talk with other fans…" aria-invalid={!!errorFor("description")} aria-describedby="description-help description-error" className={`${fieldClass} resize-y`} /><div className="mt-1 flex justify-between gap-3"><p id="description-error" className="text-xs text-red-300">{errorFor("description")}</p><span className="text-[11px] text-muted">{values.description.length}/2,000</span></div></div>
              </div>}

              {step === 1 && <div className="mt-7 space-y-5">
                <div className="space-y-3">{values.goals.map((goal, index) => <div key={index} className="flex items-start gap-3 rounded-2xl border border-border bg-background/40 p-3"><span className="mt-3 text-xs tabular-nums text-primary">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><label htmlFor={`goal-${index}`} className="sr-only">Conversation goal {index + 1}</label><textarea id={`goal-${index}`} rows={2} maxLength={300} value={goal} onChange={(event) => update("goals", values.goals.map((item, i) => i === index ? event.target.value : item))} placeholder="e.g., Can fans find the scores and stories they care about?" className="w-full resize-y rounded-lg bg-transparent px-1 py-2 text-sm leading-relaxed outline-none placeholder:text-muted/60 focus:ring-2 focus:ring-primary/30" aria-invalid={!!errorFor("goals")} aria-describedby="goals-error" /></div><button type="button" disabled={values.goals.length === 1} onClick={() => update("goals", values.goals.filter((_, i) => i !== index))} aria-label={`Remove goal ${index + 1}`} className="rounded-lg px-2 py-2 text-muted hover:bg-surface hover:text-foreground disabled:opacity-25">×</button></div>)}</div>
                <p id="goals-error" role="alert" className="text-xs text-red-300">{errorFor("goals")}</p>
                <button type="button" disabled={values.goals.length >= 12} onClick={() => update("goals", [...values.goals, ""])} className="text-sm font-medium text-primary disabled:opacity-40">+ Add a conversation goal <span className="ml-2 text-xs font-normal text-muted">{values.goals.length}/12</span></button>
                <div className="border-t border-border pt-5"><p className="text-xs font-medium text-muted">A little inspiration <span className="font-normal">· click to add</span></p><div className="mt-3 flex flex-wrap gap-2">{(suggestions[values.businessType] || defaultSuggestions).map((goal) => <button key={goal} type="button" disabled={values.goals.includes(goal) || (values.goals.length >= 12 && values.goals.every((item) => item.trim()))} onClick={() => addGoal(goal)} className="rounded-xl border border-border px-3 py-2 text-left text-xs leading-relaxed text-muted transition hover:border-primary/50 hover:text-foreground disabled:opacity-40">+ {goal}</button>)}</div></div>
              </div>}

              {step === 2 && <div className="mt-7">
                <fieldset><legend className="sr-only">Agent personality</legend><div className="grid gap-3 sm:grid-cols-2">{POINT_PERSONALITIES.map((item) => <label key={item.value} className={`relative cursor-pointer rounded-2xl border p-5 transition focus-within:ring-2 focus-within:ring-primary ${values.agentPersona === item.value ? "border-primary bg-primary/5" : "border-border bg-background/30 hover:border-muted/50"}`}><input type="radio" ref={(input) => { if (input) input.defaultChecked = values.agentPersona === item.value; }} name="personality-choice" value={item.value} checked={values.agentPersona === item.value} onChange={() => update("agentPersona", item.value)} className="sr-only" /><span className={`flex h-10 w-10 items-center justify-center rounded-full font-serif text-xl ${item.color}`}>{item.label[0]}</span><span className="mt-4 block text-sm font-medium">{item.label}</span><span className="mt-1 block text-xs text-muted">{item.detail}</span><span aria-hidden="true" className={`absolute right-4 top-4 flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${values.agentPersona === item.value ? "border-primary bg-primary text-white" : "border-muted/50"}`}>{values.agentPersona === item.value ? "✓" : ""}</span></label>)}</div></fieldset>
                <div className="mt-6 rounded-2xl bg-background/50 p-4"><p className="text-sm font-medium">A good listener, by design.</p><p className="mt-2 text-xs leading-relaxed text-muted">One question at a time. Room for unexpected answers. Your agent follows the customer’s story and explores your goals when they fit.</p></div>
              </div>}
            </fieldset>

            {(state.error || readOnly) && <p role="alert" className="mx-5 mb-5 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm sm:mx-8">{readOnly ? "Only account owners and admins can save changes." : state.error}</p>}
            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-5 sm:px-8">
              {step === 0 ? <Link href="/dashboard/feedback-points" className="text-sm text-muted hover:text-foreground">Cancel</Link> : <button type="button" disabled={pending} onClick={() => setStep(step - 1)} className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-surface">← Back</button>}
              {step < 2 ? <button key="continue" type="button" disabled={pending} onClick={(event) => { event.preventDefault(); if (validate()) setStep(step + 1); }} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition hover:brightness-110">Continue →</button> : <button key="save" type="submit" disabled={pending || readOnly} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50">{pending ? "Saving your point…" : initial ? "Save changes" : "Create feedback point"}</button>}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-3xl border border-border bg-[#242723]">
              <div className="border-b border-white/5 px-6 py-5"><p className="text-[10px] uppercase tracking-[0.18em] text-[#b8c8ab]">The other side of the conversation</p><p className="mt-2 text-xs text-muted">Opening message preview</p></div>
              <div className="p-6"><div className="flex items-center gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-serif text-xl ${personality.color}`}>{PERSONAS[values.agentPersona].name[0]}</span><div><p className="text-sm font-medium">{PERSONAS[values.agentPersona].name}</p><p className="mt-0.5 text-[11px] text-muted">Here to listen</p></div></div><div className="mt-5 rounded-2xl rounded-tl-sm bg-[#343930] p-4 text-sm leading-7 text-[#e0e3d9]">{greeting}</div><p className="mt-5 text-center text-[11px] text-muted">A conversation, at their pace.</p></div>
            </div>
            <div className="rounded-2xl border border-border p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted">Your agent’s brief</p><p className="mt-3 break-words font-serif text-xl">{values.name || "Your new feedback point"}</p><p className="mt-1 text-xs text-muted">{values.businessType} · {personality.detail}</p><div className="mt-4 space-y-2">{values.goals.filter((goal) => goal.trim()).length ? values.goals.filter((goal) => goal.trim()).map((goal, index) => <p key={index} className="flex gap-2 text-xs leading-relaxed text-muted"><span className="text-primary">↳</span><span className="min-w-0 break-words">{goal}</span></p>) : <p className="text-xs leading-relaxed text-muted">Your conversation goals will appear here as you add them.</p>}</div></div>
            <p className="px-2 text-xs leading-relaxed text-muted">{initial ? "Changes apply to new conversations. Your existing link, QR code, and conversation history stay with this point." : "Once saved, your point gets its own link and QR code. You can come back and fine-tune it anytime."}</p>
          </aside>
        </div>
      </form>
    </div>
  );
}
