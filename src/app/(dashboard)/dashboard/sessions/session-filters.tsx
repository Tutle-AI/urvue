"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

type LocationStat = {
  id: string;
  name: string;
};

const sentiments = [
  { value: "", label: "All sentiments" },
  { value: "POSITIVE", label: "Positive" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "NEGATIVE", label: "Negative" },
  { value: "PENDING", label: "Pending" },
];

export function SessionFilters({
  locations,
  currentLocation,
  currentSentiment,
  currentSearch,
}: {
  locations: LocationStat[];
  currentLocation?: string;
  currentSentiment?: string;
  currentSearch?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch || "");

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filters change
      params.delete("page");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateParams("search", search.trim());
    },
    [search, updateParams]
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    startTransition(() => {
      router.push(pathname);
    });
  }, [pathname, router]);

  const hasFilters = currentLocation || currentSentiment || currentSearch;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </form>

        {/* Location filter */}
        <select
          value={currentLocation || ""}
          onChange={(e) => updateParams("location", e.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
        >
          <option value="">All locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>

        {/* Sentiment filter */}
        <select
          value={currentSentiment || ""}
          onChange={(e) => updateParams("sentiment", e.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-2 ring-transparent transition focus:ring-primary/50"
        >
          {sentiments.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active filters & clear */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Active filters:</span>
          {currentLocation && (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
              {locations.find((l) => l.id === currentLocation)?.name || "Location"}
            </span>
          )}
          {currentSentiment && (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
              {currentSentiment}
            </span>
          )}
          {currentSearch && (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
              &quot;{currentSearch}&quot;
            </span>
          )}
          <button
            onClick={clearFilters}
            className="ml-2 text-xs font-medium text-muted transition hover:text-foreground"
          >
            Clear all
          </button>
          {isPending && (
            <span className="ml-2 text-xs text-muted">Loading...</span>
          )}
        </div>
      )}
    </div>
  );
}
