import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between py-6 md:py-8">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 text-xl font-medium tracking-tight md:text-2xl"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] text-background md:h-7 md:w-7 md:text-xs">
          ●
        </span>
        URVUE
      </Link>

      {/* Center Navigation */}
      <nav className="hidden items-center gap-10 text-sm text-muted md:flex">
        <Link href="/dashboard" className="transition hover:text-foreground">
          Dashboard
        </Link>
        <Link href="#features" className="transition hover:text-foreground">
          Features
        </Link>
        <Link href="#pricing" className="transition hover:text-foreground">
          Pricing
        </Link>
      </nav>

      {/* Right CTA */}
      <Link
        href="/sign-up"
        className="rounded-full border border-foreground/30 px-6 py-2.5 text-sm font-medium text-foreground transition hover:border-foreground hover:bg-foreground/5 md:text-base"
      >
        Get started
      </Link>
    </header>
  );
}
