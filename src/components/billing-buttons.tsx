"use client";

import { useState } from "react";

export function BillingButtons({ plan }: { plan: string }) {
  const [loading, setLoading] = useState(false);

  const startCheckout = async (targetPlan: "starter" | "pro") => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => startCheckout(plan === "PRO" ? "pro" : "starter")}
        disabled={loading}
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {plan === "PRO" ? "Switch plan" : "Upgrade to Pro"}
      </button>
      <button
        onClick={openPortal}
        disabled={loading}
        className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
      >
        Manage billing
      </button>
    </div>
  );
}

