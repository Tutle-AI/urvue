"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="glass rounded-2xl p-6">
        <SignIn />
      </div>
    </div>
  );
}

