import Link from "next/link";
import { revalidatePath } from "next/cache";
import { BillingButtons } from "@/components/billing-buttons";
import { requireOnboardedSpace } from "@/lib/business";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const { account, space } = await requireOnboardedSpace();

  async function save(formData: FormData) {
    "use server";
    const { space, membership } = await requireOnboardedSpace();
    if (membership.role === "MEMBER") return;
    const description = formData.get("description")?.toString().trim().slice(0, 1_000) || "";
    await prisma.space.update({ where: { id: space.id }, data: { description: description || null } });
    revalidatePath("/dashboard/settings");
  }

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-primary">Space settings</p><h1 className="mt-1 font-serif text-4xl text-foreground">{space.name}</h1><p className="mt-1 text-sm text-muted">Account plan: {account.plan === "STARTER" ? "Basic" : "Pro"}</p></div><BillingButtons plan={account.plan} /></div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form action={save} className="space-y-5 rounded-3xl border border-border bg-card p-6">
          <div><h2 className="text-xl font-semibold text-foreground">Your workspace context</h2><p className="mt-1 text-sm text-muted">Help Kiri understand your organization and the bigger picture.</p></div>
          <label className="block text-sm text-muted">Business context<textarea name="description" defaultValue={space.description || ""} className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground" /></label>
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5"><h3 className="text-sm font-medium text-foreground">Looking for your agents?</h3><p className="mt-2 text-sm leading-relaxed text-muted">Each feedback point now has its own context, conversation goals, and personality. Open a point to shape how its agent listens.</p><Link href="/dashboard/feedback-points" className="mt-4 inline-block text-sm font-medium text-primary">Manage Feedback Points →</Link></div>
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
