"use client";

import { AreaChart } from "@tremor/react";

type TrendData = {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
};

export function TrendChart({ data }: { data: TrendData[] }) {
  const hasData = data.some((d) => d.positive > 0 || d.neutral > 0 || d.negative > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        No data yet
      </div>
    );
  }

  // Format dates for display
  const formattedData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <AreaChart
      data={formattedData}
      index="date"
      categories={["positive", "neutral", "negative"]}
      colors={["emerald", "yellow", "rose"]}
      className="h-64"
      showAnimation
      showLegend
      showGridLines={false}
      curveType="monotone"
      valueFormatter={(value) => `${value}`}
    />
  );
}
