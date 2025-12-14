import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

export async function SiteHeader() {
  const user = await currentUser();

  return (
    <header className="flex items-center justify-between py-6 md:py-8">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 font-serif text-xl font-normal tracking-tight md:text-2xl"
        id="urvueLogoLink"
      >
        <span className="inline-flex h-[38px] w-[38px] items-center justify-center md:h-[44px] md:w-[44px]">
          <svg
            viewBox="0 0 56 32"
            className="h-full w-full"
            role="img"
            aria-label="Urvue logo"
          >
            <circle cx="20" cy="16" r="14" fill="#F3E9D8" />
            <circle cx="36" cy="16" r="14" fill="#D3613A">
              <animate
                attributeName="cx"
                dur="700ms"
                repeatCount="1"
                begin="urvueLogoLink.mouseover"
                values="36;20;19.25;20.75;19.6;20.4;36"
                keyTimes="0;0.45;0.55;0.65;0.75;0.82;1"
                fill="remove"
              />
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                dur="700ms"
                repeatCount="1"
                begin="urvueLogoLink.mouseover"
                values="0 36 16;0 20 16;-8 20 16;8 20 16;-6 20 16;6 20 16;0 36 16"
                keyTimes="0;0.45;0.55;0.65;0.75;0.82;1"
                fill="remove"
              />
            </circle>
          </svg>
        </span>
        UrVue
      </Link>

      {/* Center Navigation */}
      <nav className="hidden items-center gap-10 text-base text-muted md:flex">
        <Link href="/#features" className="transition hover:text-foreground">
          Features
        </Link>
        <Link href="/#clients" className="transition hover:text-foreground">
          Clients
        </Link>
        <Link href="/#feedback" className="transition hover:text-foreground">
          Feedback
        </Link>
        <Link href="/pricing" className="transition hover:text-foreground">
          Pricing
        </Link>
      </nav>

      {/* Right CTA */}
      <Link
        href={user ? "/dashboard" : "/sign-up"}
        className="rounded-full border border-foreground/30 px-6 py-2.5 text-sm font-medium text-foreground transition hover:border-foreground hover:bg-foreground/5 md:text-base"
      >
        {user ? "Dashboard" : "Get started"}
      </Link>
    </header>
  );
}
