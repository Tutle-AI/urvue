import { SignUp } from "@clerk/nextjs";
import { AuthSplitLayout } from "@/components/auth-split-layout";

export default function SignUpPage() {
  // Keep Clerk mounted through session activation and OAuth callback subroutes;
  // let it navigate once the authentication flow is complete.
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

