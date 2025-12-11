"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="glass rounded-2xl p-6">
        <SignUp />
      </div>
    </div>
  );
}

