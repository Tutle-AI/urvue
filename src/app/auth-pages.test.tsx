import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@clerk/nextjs/server", () => ({ auth }));
vi.mock("@clerk/nextjs", () => ({
  SignIn: () => <div>Clerk sign-in flow</div>,
  SignUp: () => <div>Clerk sign-up flow</div>,
}));
vi.mock("@/components/auth-split-layout", () => ({
  AuthSplitLayout: ({ children }: { children: ReactNode }) => children,
}));

import SignInPage from "./sign-in/[[...sign-in]]/page";
import SignUpPage from "./sign-up/[[...sign-up]]/page";

describe("authentication callback pages", () => {
  it.each([
    ["sign-in", SignInPage, "Clerk sign-in flow"],
    ["sign-up", SignUpPage, "Clerk sign-up flow"],
  ] as const)("keeps the %s flow mounted when the server sees the new session", async (_name, Page, text) => {
    // Clerk refreshes server components while completing session activation.
    // A server redirect here tears down the callback before Clerk finishes.
    auth.mockResolvedValue({ userId: "user_new_session" });
    expect(renderToStaticMarkup(await Page())).toContain(text);
  });
});
