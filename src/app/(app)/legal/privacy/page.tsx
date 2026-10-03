export default function PrivacyPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-4xl mb-2">Privacy</h1>
      <p className="text-stone mb-8">A plain-language summary of what matchin&apos; stores and why.</p>

      <div className="space-y-6 text-sm text-ink-soft leading-relaxed">
        <Section title="What we store">
          Your wardrobe photos and the details matchin&apos; extracts from them (category, colour, style, etc.), the
          outfits you generate or build, your style preferences, and — only if you choose to set one — a
          city-level location for weather-aware styling. We never store your exact address.
        </Section>
        <Section title="Photos">
          Clothing photos are analyzed by Gemini to extract structured attributes. A full-body photo is optional
          and used only to suggest fits and proportions — never for identification, and never shared.
        </Section>
        <Section title="What we don't do">
          We don&apos;t sell your data, and we don&apos;t use your photos to train external models beyond the one
          request that analyzes them.
        </Section>
        <Section title="Your control">
          You can delete any wardrobe item, outfit, or your full-body photo at any time from within the app.
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
