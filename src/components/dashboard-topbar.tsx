"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

type Location = {
  id: string;
  name: string;
  slug: string;
};

type DashboardTopBarProps = {
  businessName: string;
  locations: Location[];
  currentLocationId?: string;
};

export function DashboardTopBar({
  businessName,
  locations,
  currentLocationId,
}: DashboardTopBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocation = currentLocationId
    ? locations.find((l) => l.id === currentLocationId)
    : locations[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <header className="hidden border-b border-border bg-surface/40 lg:block">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side: Business name and location selector */}
        <div className="flex items-center gap-6">
          {/* Business name */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-foreground">{businessName}</span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* Location selector dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card/50 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-card hover:border-border/80"
            >
              <svg
                className="h-4 w-4 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="max-w-[180px] truncate">
                {currentLocation?.name || "Select location"}
              </span>
              <svg
                className={`h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                {/* Locations list */}
                <div className="max-h-64 overflow-y-auto p-1.5">
                  {locations.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted">
                      No locations yet
                    </div>
                  ) : (
                    locations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => {
                          setIsOpen(false);
                          // For now, just close. We can add location switching logic later
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          location.id === currentLocation?.id
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-surface"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            location.id === currentLocation?.id
                              ? "bg-primary/20 text-primary"
                              : "bg-surface text-muted"
                          }`}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1 truncate">{location.name}</span>
                        {location.id === currentLocation?.id && (
                          <svg
                            className="h-4 w-4 shrink-0 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Create new location */}
                <div className="p-1.5">
                  <Link
                    href="/dashboard/locations"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted transition hover:bg-surface hover:text-foreground"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-dashed border-border">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </span>
                    <span>Add new location</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side: User button */}
        <div className="flex items-center gap-4">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

