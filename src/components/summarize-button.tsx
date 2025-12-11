"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SummarizeButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      await fetch("/api/feedback/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={run}
      disabled={loading}
      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
    >
      {loading ? "Summarizing..." : "Summarize"}
    </button>
  );
}

