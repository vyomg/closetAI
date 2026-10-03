export default function TermsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-4xl mb-2">Terms</h1>
      <p className="text-stone mb-8">The short version of using matchin&apos;.</p>

      <div className="space-y-6 text-sm text-ink-soft leading-relaxed">
        <Section title="The product">
          matchin&apos; helps you catalogue your own wardrobe and generates outfit suggestions from it using AI. It
          is provided as-is, and still actively evolving.
        </Section>
        <Section title="Your content">
          You own the photos and items you upload. You&apos;re responsible for only uploading photos you have the
          right to use.
        </Section>
        <Section title="Credits">
          Some AI actions use credits, shown before you confirm them. Credits are part of the product experience,
          not a financial instrument.
        </Section>
        <Section title="Fair use">
          Don&apos;t use matchin&apos; to upload content that isn&apos;t yours, or to abuse the AI features in ways
          that affect other users.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium text-ink mb-1.5">{title}</p>
      <p>{children}</p>
    </div>
  );
}
