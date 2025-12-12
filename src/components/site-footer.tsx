import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-light-muted/25 pt-16 text-background">
      <div className="grid gap-12 md:grid-cols-[1.2fr_2fr]">
        {/* Left - Branding */}
        <div>
          <h3 className="font-serif text-4xl font-normal">URVUE</h3>
          <p className="mt-4 max-w-xs text-sm text-light-muted">
            Beautifully designed, privacy-focused, and packed with features. We
            care about your experience not your data.
          </p>
          <Link
            href="/sign-up"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-background/20 px-6 py-2.5 text-sm font-medium text-background transition hover:border-background/30 hover:bg-background/5 md:text-base"
          >
            Get started
            <span className="text-xs">→</span>
          </Link>
        </div>

        {/* Right - Links */}
        <div className="grid gap-8 text-sm sm:grid-cols-3">
          <div>
            <div className="mb-4 font-medium text-background">Follow Us</div>
            <ul className="space-y-3 text-light-muted">
              <li>
                <Link href="#" className="transition hover:text-background">
                  ○ ✕ ◇ ♡ ◎
                </Link>
              </li>
            </ul>
            <div className="mb-4 mt-6 font-medium text-background">About Us</div>
            <ul className="space-y-3 text-light-muted">
              <li>
                <Link href="#" className="transition hover:text-background">
                  Team & Contributors
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-background">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-4 font-medium text-background">Get Started</div>
            <ul className="space-y-3 text-light-muted">
              <li>
                <Link href="#" className="transition hover:text-background">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-background">
                  API Guide
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-background">
                  Release Notes
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-background">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-4 font-medium text-background">Get Help</div>
            <ul className="space-y-3 text-light-muted">
              <li>
                <Link href="#" className="transition hover:text-background">
                  Discord
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-background">
                  Uptime Status
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-background">
                  Report an Issue
                </Link>
              </li>
              <li>
                <Link href="#" className="transition hover:text-background">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="mt-14 border-t border-light-muted/25 pt-7 text-sm text-light-muted">
        Made with <span className="text-primary">♥</span> by the{" "}
        <Link href="#" className="text-primary underline">
          URVUE Team
        </Link>
      </div>
    </footer>
  );
}
