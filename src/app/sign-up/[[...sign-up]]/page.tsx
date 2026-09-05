import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth-split-layout";

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <AuthSplitLayout
      variant="sign-up"
      title={
        <>
          Join UrVue
        </>
      }
      description="Start collecting clear, privacy-friendly feedback through real conversations—then summarize it into insights your team can act on."
    >
      <SignUp />
    </AuthSplitLayout>
  );
}

