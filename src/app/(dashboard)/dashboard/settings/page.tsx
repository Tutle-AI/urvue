import { AgentPersona } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { BillingButtons } from "@/components/billing-buttons";
import { requireOnboardedSpace } from "@/lib/business";
import { prisma } from "@/lib/db";

const personas: Array<[AgentPersona, string]> = [["AMANDA", "Amanda — warm and friendly"], ["DEREK", "Derek — upbeat and informal"], ["PROFESSIONAL", "Professional — polished and calm"], ["DIRECT", "Direct — concise and efficient"]];

export default async function SettingsPage() {
  const { account, space } = await requireOnboardedSpace();

  async function save(formData: FormData) {
    "use server";
    const { space } = await requireOnboardedSpace();
    const description = formData.get("description")?.toString().trim().slice(0, 1_000) || "";
    const personaRaw = formData.get("agentPersona")?.toString() || "AMANDA";
    const agentPersona = personas.some(([value]) => value === personaRaw) ? personaRaw as AgentPersona : "AMANDA";
    const goals = (formData.get("goals")?.toString() || "").split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean).slice(0, 12);
    await prisma.$transaction(async (tx) => {
      await tx.space.update({ where: { id: space.id }, data: { description: description || null, agentPersona, focusTopic1: goals[0] || null, focusTopic2: goals[1] || null, focusTopic3: goals[2] || null } });
      await tx.spaceGoal.deleteMany({ where: { spaceId: space.id } });
      if (goals.length) await tx.spaceGoal.createMany({ data: goals.map((label, priority) => ({ spaceId: space.id, label, priority })) });
    });
    revalidatePath("/dashboard/settings");
  }

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-primary">Space settings</p><h1 className="mt-1 font-serif text-4xl text-foreground">{space.name}</h1><p className="mt-1 text-sm text-muted">Account plan: {account.plan}</p></div><BillingButtons plan={account.plan} /></div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form action={save} className="space-y-5 rounded-3xl border border-border bg-card p-6">
          <div><h2 className="text-xl font-semibold text-foreground">What UrVue knows</h2><p className="mt-1 text-sm text-muted">This context shapes customer interviews and Kiri’s analysis.</p></div>
          <label className="block text-sm text-muted">Business context<textarea name="description" defaultValue={space.description || ""} className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground" /></label>
          <label className="block text-sm text-muted">What you want to learn<textarea name="goals" defaultValue={space.goals.map((goal) => goal.label).join("\n")} className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground" /></label>
          <label className="block text-sm text-muted">Customer-facing agent<select name="agentPersona" defaultValue={space.agentPersona} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground">{personas.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white">Save context</button>
        </form>
        <div className="space-y-5">
          <section className="rounded-3xl border border-border bg-card p-6"><h2 className="text-lg font-semibold text-foreground">Tracked changes</h2><div className="mt-3 space-y-2">{space.businessChanges.length ? space.businessChanges.map((change) => <div key={change.id} className="rounded-xl bg-surface/60 p-3 text-sm text-foreground">{change.title}<span className="mt-1 block text-xs capitalize text-muted">{change.status.toLowerCase()}</span></div>) : <p className="text-sm text-muted">Tell Kiri about a launch, hire, or price change and it will appear here.</p>}</div></section>
          <section className="rounded-3xl border border-border bg-card p-6"><h2 className="text-lg font-semibold text-foreground">Tracked entities</h2><div className="mt-3 flex flex-wrap gap-2">{space.trackedEntities.length ? space.trackedEntities.map((entity) => <span key={entity.id} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary">{entity.name} · {entity.type.toLowerCase()}</span>) : <p className="text-sm text-muted">People, products, and services will be learned from onboarding and conversations.</p>}</div></section>
        </div>
      </div>
    </div>
  );
}
