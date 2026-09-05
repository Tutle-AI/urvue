import { SignIn } from "@clerk/nextjs";
import { AuthSplitLayout } from "@/components/auth-split-layout";

export default function SignInPage() {
  // Clerk owns navigation here, including callback subroutes. A server redirect
  // during its session refresh can interrupt sign-in before activation finishes.
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

