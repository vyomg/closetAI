import { redirect } from "next/navigation";
import {
  Crown,
  Sparkles,
  Shirt,
  Layers,
  Thermometer,
  ShoppingBag,
  Luggage,
  Brain,
  TrendingUp,
  Check,
  Clock,
} from "lucide-react";
import { auth } from "@/lib/auth";

const AVAILABLE_NOW = [
  { icon: Shirt, title: "AI wardrobe analysis", description: "Photograph anything you own and matchin' reads colour, fit, fabric and style automatically." },
  { icon: Layers, title: "Personalized outfit generation", description: "Complete outfits built only from clothes you actually own, validated for a coherent, wearable result." },
  { icon: Thermometer, title: "Weather-aware styling", description: "Recommendations that account for today's real temperature, humidity and forecast — not guesswork." },
  { icon: ShoppingBag, title: "Shopping recommendations", description: "Suggestions based on genuine gaps in your wardrobe, not a generic catalogue." },
  { icon: Sparkles, title: "“Should I Buy This?”", description: "Check any item against your existing wardrobe and style before you buy it." },
  { icon: Luggage, title: "Intelligent trip packing", description: "Full packing plans built around your destination, weather and the outfits you'll actually wear." },
];

const COMING_TO_PREMIUM = [
  { icon: Brain, title: "Deeper style learning", description: "matchin' refines its understanding of your taste the more you wear, save and rate outfits." },
  { icon: TrendingUp, title: "Richer wardrobe insights", description: "Track cost-per-wear, underused pieces and how your style changes over time." },
];

export default async function PremiumPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-paper-alt px-3.5 py-1.5 text-xs font-medium text-ink-soft mb-5">
        <Crown className="h-3.5 w-3.5" strokeWidth={1.75} />
        matchin' Premium
      </div>

      <h1 className="font-display text-4xl sm:text-5xl mb-4">Your AI stylist, without limits.</h1>
      <p className="text-ink-soft text-lg max-w-xl mb-12">
        Everything matchin' already does — plus a deeper, more personal styling relationship as it learns your
        wardrobe and taste over time.
      </p>

      <h2 className="font-display text-2xl mb-5">Available now</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {AVAILABLE_NOW.map((item) => (
          <div key={item.title} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <item.icon className="h-4 w-4 text-ink-soft shrink-0" strokeWidth={1.75} />
              <p className="font-medium text-sm">{item.title}</p>
              <Check className="h-3.5 w-3.5 text-success ml-auto shrink-0" strokeWidth={2} />
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display text-2xl mb-5">Coming to Premium</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {COMING_TO_PREMIUM.map((item) => (
          <div key={item.title} className="rounded-2xl border border-dashed border-line bg-paper-alt/40 p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <item.icon className="h-4 w-4 text-stone shrink-0" strokeWidth={1.75} />
              <p className="font-medium text-sm text-ink-soft">{item.title}</p>
              <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[11px] text-stone">
                <Clock className="h-3 w-3" strokeWidth={1.75} /> Coming soon
              </span>
            </div>
            <p className="text-sm text-stone leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-white p-7 sm:p-8 text-center">
        <p className="font-display text-2xl mb-2">Premium is on its way.</p>
        <p className="text-sm text-stone max-w-md mx-auto mb-6">
          We&apos;re still finishing the details, including pricing. Nothing to set up yet — we&apos;ll let you know the
          moment it&apos;s ready.
        </p>
        <button
          disabled
          className="inline-flex items-center justify-center rounded-full bg-ink text-paper px-7 py-3.5 text-base font-medium opacity-40 cursor-not-allowed"
        >
          Coming soon
        </button>
      </div>
    </div>
  );
}
