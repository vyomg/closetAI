"use client";

import { useState } from "react";
import { MessageCircle, Mail, AtSign, ExternalLink } from "lucide-react";
import { Spark } from "@/components/Brand";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { FloatingWords } from "@/components/FloatingWords";
import { CONTACT } from "@/lib/contact";

const CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature request" },
  { value: "feedback", label: "Feedback" },
  { value: "other", label: "Other" },
] as const;

export default function ConnectPage() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("feedback");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, message }),
    });
    setSending(false);
    if (!res.ok) {
      setError("Couldn't send that — try again in a moment.");
      return;
    }
    setSent(true);
    setMessage("");
  }

  return (
    <div className="max-w-2xl">
      <div className="relative rounded-2xl bg-graphite text-white p-6 sm:p-8 mb-8">
        <FloatingWords words={["HEY", "✦", "TALK", "US"]} />
        <h1 className="font-display text-3xl sm:text-4xl mb-2 relative flex items-center gap-2">
          connect with us <Spark className="h-5 w-5 text-lime" />
        </h1>
        <p className="text-sm text-white/50 relative max-w-md">
          Have an idea? Found something broken? Just want to talk? We&apos;re right here.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-10">
        <ContactCard
          icon={<MessageCircle className="h-4 w-4" />}
          label="WhatsApp"
          sub="Chat with us"
          href={CONTACT.whatsappNumber ? `https://wa.me/${CONTACT.whatsappNumber}` : null}
        />
        <ContactCard
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          sub="Send us a message"
          href={CONTACT.email ? `mailto:${CONTACT.email}` : null}
        />
        <ContactCard
          icon={<AtSign className="h-4 w-4" />}
          label="Instagram"
          sub="Follow matchin'"
          href={CONTACT.instagramHandle ? `https://instagram.com/${CONTACT.instagramHandle}` : null}
        />
      </div>

      <div className="rounded-2xl border border-line bg-paper-alt p-6 sm:p-7">
        <p className="font-display text-xl mb-1">Feedback</p>
        <p className="text-sm text-stone mb-5">Tell us what you think.</p>

        <p className="text-xs uppercase tracking-wide text-stone mb-2.5">What&apos;s this about?</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map((c) => (
            <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>

        <p className="text-xs uppercase tracking-wide text-stone mb-2.5">How can we make matchin&apos; better?</p>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us everything…"
          rows={5}
          className="mb-4"
        />

        {error && <p className="text-sm text-warning mb-3">{error}</p>}
        {sent && <p className="text-sm text-success mb-3">Sent — thank you. We read every one of these.</p>}

        <Button onClick={send} disabled={!message.trim() || sending}>
          {sending ? "Sending…" : "Send Feedback"}
        </Button>
      </div>
    </div>
  );
}

function ContactCard({ icon, label, sub, href }: { icon: React.ReactNode; label: string; sub: string; href: string | null }) {
  const content = (
    <>
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon} {label}
        {href && <ExternalLink className="h-3 w-3 text-stone ml-auto" />}
      </span>
      <span className="text-xs text-stone mt-1">{href ? sub : "Not set up yet"}</span>
    </>
  );

  if (!href) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-paper-alt p-4 opacity-60 cursor-not-allowed">
        {content}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-2xl border border-line bg-paper-alt p-4 hover:border-ink/30 transition-colors block"
    >
      {content}
    </a>
  );
}
