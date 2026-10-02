"use client";

import { useEffect, useState } from "react";
import { Share2, Copy, Check, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";

// Real platform support only — no fake "Post to Instagram" button, since
// Instagram has no web API for that. The Web Share API (where supported)
// lets the OS-level share sheet offer whatever the device actually supports,
// including Instagram; everywhere else falls back to a labeled copy-link
// action plus real deep links for platforms that do support them.
//
// `url` must be a path or absolute URL known at render time (e.g. "/s/abc123")
// — never resolved from window.location, so server and client render
// identically and there's no hydration mismatch.
export function ShareActions({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [absoluteUrl, setAbsoluteUrl] = useState(url);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
    setAbsoluteUrl(url.startsWith("http") ? url : `${window.location.origin}${url}`);
  }, [url]);

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: absoluteUrl });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy as a backup
      }
    }
    copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — nothing more we can do silently
    }
  }

  const encodedUrl = encodeURIComponent(absoluteUrl);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {canNativeShare && (
        <button
          onClick={nativeShare}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs hover:border-ink/40 transition-colors cursor-pointer"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      )}
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs hover:border-ink/40 transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
      </a>
      <a
        href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodedTitle}&body=${encodeURIComponent(`${title}\n\n${absoluteUrl}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs hover:border-ink/40 transition-colors"
      >
        <Mail className="h-3.5 w-3.5" /> Gmail
      </a>
      <button
        onClick={copyLink}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors cursor-pointer",
          copied ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40"
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
