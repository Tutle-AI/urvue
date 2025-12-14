import { SignUp } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth-split-layout";

export default async function SignUpPage() {
  const user = await currentUser();
  if (user) {
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

