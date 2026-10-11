"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Brand } from "@/components/Brand";
import { Mascot } from "@/components/Mascot";

// No useSearchParams() here on purpose — Next.js requires wrapping it in
// <Suspense>, and "?callbackUrl=" is only ever read inside the submit/click
// handlers below (never during render), so reading window.location
// directly right there is identical behavior without needing Suspense at
// all for this page.
export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("That email and password don't match an account.");
      return;
    }
    const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
    router.push(callbackUrl || "/dashboard");
    router.refresh();
  }

  return (
    <div className="theme-dark-app bg-paper atmosphere text-ink flex-1 flex items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="w-full max-w-sm animate-fade-up relative">
        <Brand href="/" size="sm" className="text-ink" />

        <div className="mt-10 mb-8">
          <Mascot expression="welcoming" size={44} className="mb-5" />
          <h1 className="font-display text-3xl mb-2 leading-tight">Welcome back.</h1>
          <p className="text-sm text-stone">Log in to your wardrobe.</p>
        </div>

        {googleEnabled && (
          <>
            <button
              onClick={async () => {
                setGoogleLoading(true);
                const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
                await signIn("google", { callbackUrl: callbackUrl || "/dashboard" });
              }}
              disabled={googleLoading}
              className="w-full inline-flex items-center justify-center gap-2.5 rounded-full border border-line bg-paper-alt px-5 py-2.5 text-sm font-medium hover:border-ink/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <GoogleGlyph className="h-4 w-4 shrink-0" />
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>
            <div className="flex items-center gap-3 my-6">
              <span className="h-px flex-1 bg-line" />
              <span className="text-xs text-stone uppercase tracking-wide">or</span>
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-warning">{error}</p>}
          <Button type="submit" variant="lime" className="w-full" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="text-sm text-stone mt-8">
          New to matchin&apos;?{" "}
          <Link href="/signup" className="text-ink underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

// The real, unmodified Google "G" mark — brand guidelines require the
// four-colour glyph to be used as-is, never recoloured or simplified.
function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}
