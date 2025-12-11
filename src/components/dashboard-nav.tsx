"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const links = [
  { href: "/dashboard", label: "Sessions" },
  { href: "/dashboard/locations", label: "Locations" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-20 border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold text-foreground">
            URVUE
          </Link>
          <nav className="flex gap-4 text-sm text-muted">
            {links.map((link) => {
              const active =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1 transition ${
                    active
                      ? "bg-primary/10 text-foreground"
                      : "hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
}

