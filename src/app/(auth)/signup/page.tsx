import { SignupForm } from "@/features/auth/components/signup-form";
import { requireUnAuth } from "@/lib/auth-utils";

const SignupPage = async () => {
  await requireUnAuth();

  return (
    <div>
      <SignupForm />
    </div>
  );
};

export default SignupPage;
