import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth-split-layout";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <AuthSplitLayout
      variant="sign-in"
      title={
        <>
          Welcome back
        </>
      }
      description="Pick up where you left off. Review conversations, summarize sessions, and turn feedback into clear decisions."
    >
      <SignIn />
    </AuthSplitLayout>
  );
}

