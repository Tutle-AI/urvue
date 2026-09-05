import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-light-muted/25 pt-16 text-background">
      <div className="grid gap-12 md:grid-cols-[1.2fr_2fr]">
        <div>
          <h3 className="font-serif text-4xl font-normal">UrVue</h3>
          <p className="mt-4 max-w-xs text-sm text-light-muted">
            AI-led customer feedback for businesses that want real conversations and
            useful decisions, not another survey maze.
          </p>
          <Link
            href="/sign-up"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-background/20 px-6 py-2.5 text-sm font-medium text-background transition hover:border-background/30 hover:bg-background/5 md:text-base"
          >
            Get started
            <span className="text-xs">-&gt;</span>
          </Link>
        </div>

        <div className="grid gap-8 text-sm sm:grid-cols-3">
          <div>
            <div className="mb-4 font-medium text-background">Product</div>
            <ul className="space-y-3 text-light-muted">
              <li>
                <Link href="/#features" className="transition hover:text-background">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition hover:text-background">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#feedback" className="transition hover:text-background">
                  Try feedback
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-4 font-medium text-background">Use cases</div>
            <ul className="space-y-3 text-light-muted">
              <li>Websites and apps</li>
              <li>Restaurants and cafes</li>
              <li>Barbers and salons</li>
              <li>Retail and services</li>
            </ul>
          </div>

          <div>
            <div className="mb-4 font-medium text-background">Company</div>
            <ul className="space-y-3 text-light-muted">
              <li>
                <Link href="/sign-in" className="transition hover:text-background">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="transition hover:text-background">
                  Start free trial
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-14 border-t border-light-muted/25 pt-7 text-sm text-light-muted">
        Built for customer conversations that become better experiences.
      </div>
    </footer>
  );
}
