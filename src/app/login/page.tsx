import { GOOGLE_AUTH_ENABLED } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

// Server component wrapper: GOOGLE_AUTH_ENABLED only ever reads whether the
// env vars exist (never the secret values themselves) and passes a plain
// boolean down to the client form — see GOOGLE_AUTH_ENABLED in
// src/lib/auth.ts and .env.example for exact setup steps.
export default function LoginPage() {
  return <LoginForm googleEnabled={GOOGLE_AUTH_ENABLED} />;
}
