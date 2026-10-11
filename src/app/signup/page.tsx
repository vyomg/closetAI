import { GOOGLE_AUTH_ENABLED } from "@/lib/auth";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return <SignupForm googleEnabled={GOOGLE_AUTH_ENABLED} />;
}
