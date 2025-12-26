"use client";

import { DonutChart } from "@tremor/react";

type ChartData = {
  name: string;
  value: number;
};

const colorMap: Record<string, string> = {
  Positive: "emerald",
  Neutral: "yellow",
  Negative: "rose",
  Pending: "gray",
};

export function SentimentChart({ data }: { data: ChartData[] }) {
  const filteredData = data.filter((d) => d.value > 0);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        No data yet
      </div>
    );
  }

  return (
    <div className="relative">
      <DonutChart
        data={filteredData}
        category="value"
        index="name"
        colors={filteredData.map((d) => colorMap[d.name] || "gray")}
        className="h-48"
        showAnimation
        showTooltip
        valueFormatter={(value) => `${value} session${value !== 1 ? "s" : ""}`}
      />
      <div className="mt-4 flex flex-wrap gap-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                item.name === "Positive"
                  ? "bg-emerald-500"
                  : item.name === "Negative"
                  ? "bg-rose-500"
                  : item.name === "Neutral"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }`}
            />
            <span className="text-muted">
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
