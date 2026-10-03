"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Clock } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { BrandLoading, Spark } from "@/components/Brand";
import { FloatingWords } from "@/components/FloatingWords";

// Virtual Try-On is intentionally NOT implemented — it requires an
// image-generation model and this product deliberately stays on Gemini for
// reasoning only (see AGENTS.md / the product brief). This page is the real
// architecture for the feature: it reuses the EXISTING full-body photo
// upload (PersonalAppearanceProfile, already live on Style Profile) rather
// than building a second photo-upload system, and clearly states the
// feature is on the roadmap instead of faking a result.
export default function TryOnPage() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setStatus(d.appearanceProfileStatus ?? "PENDING"));
  }, []);

  if (status === null) return <BrandLoading />;

  const hasPhoto = status === "COMPLETE";

  return (
    <div className="max-w-lg">
      <div className="relative rounded-2xl bg-graphite text-white p-6 sm:p-8 mb-8">
        <FloatingWords words={["SOON", "SEE", "YOU", "✦"]} />
        <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-3 relative">virtual try-on</p>
        <h1 className="font-display text-3xl sm:text-4xl mb-2 relative">coming soon.</h1>
        <p className="text-sm text-white/50 relative max-w-md">
          Seeing an outfit on yourself before you commit — we&apos;re building this properly rather than faking it with a
          generic render.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-paper-alt p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-4 text-stone">
          <Clock className="h-4 w-4" />
          <p className="text-xs uppercase tracking-wide">On the roadmap</p>
        </div>

        {hasPhoto ? (
          <>
            <p className="text-sm text-ink-soft leading-relaxed mb-5">
              You&apos;ve already got a full-body photo on file — nothing else to do. The moment try-on ships, it&apos;ll use
              that same photo automatically.
            </p>
            <Link href="/style-profile" className="text-sm underline underline-offset-4 text-ink-soft hover:text-ink">
              Manage your photo in Style DNA
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-soft leading-relaxed mb-5">
              When it launches, try-on will use the full-body photo from your Style DNA profile — the same one matchin&apos;
              already uses to suggest fits and proportions. Add one now so you&apos;re ready the moment it&apos;s live.
            </p>
            <LinkButton href="/style-profile" variant="lime">
              <Camera className="h-4 w-4 mr-1.5" /> Add a full-body photo
            </LinkButton>
          </>
        )}
      </div>

      <p className="text-xs text-stone mt-6 flex items-center gap-1.5">
        <Spark className="h-3 w-3 text-lime" /> matchin&apos; stays reasoning-only for now — no synthetic images are
        generated anywhere in the product.
      </p>
    </div>
  );
}
