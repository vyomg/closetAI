import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus, Sparkles, Luggage, Wand2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardStats } from "@/components/DashboardStats";
import { LinkButton } from "@/components/ui/Button";
import { parseList } from "@/lib/json";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const [itemCount, recentItems, recentOutfits] = await Promise.all([
    db.clothingItem.count({ where: { userId: user.id } }),
    db.clothingItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.outfit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 2,
      include: { items: { include: { clothingItem: true } } },
    }),
  ]);

  const styleTags = parseList(user.preferredStyles).slice(0, 3);

  return (
    <div>
      <p className="text-stone mb-1">{greeting()}, {user.name.split(" ")[0]}.</p>
      <h1 className="font-display text-4xl sm:text-5xl mb-8">What should I wear today?</h1>

      <div className="rounded-2xl border border-line bg-white p-7 sm:p-8 mb-10">
        <p className="text-ink-soft mb-6 max-w-lg">
          One tap — ClosetAI checks today's weather, your recent outfits, and your style to put
          something together right now.
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/outfits/create?quick=today" size="lg">
            <Sparkles className="h-4 w-4 mr-1.5" /> What should I wear today?
          </LinkButton>
          <LinkButton href="/outfits/create?quick=surprise" variant="outline" size="lg">
            <Wand2 className="h-4 w-4 mr-1.5" /> Surprise Me
          </LinkButton>
        </div>
      </div>

      <div className="mb-10">
        <DashboardStats itemCount={itemCount} styleTags={styleTags} />
      </div>

      {recentItems.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">Recently Added</h2>
            <Link href="/wardrobe" className="text-sm text-stone hover:text-ink">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                href={`/wardrobe/${item.id}`}
                className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt block"
              >
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="200px" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentOutfits.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">Recent Outfits</h2>
            <Link href="/outfits" className="text-sm text-stone hover:text-ink">
              View all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {recentOutfits.map((outfit) => (
              <Link
                key={outfit.id}
                href="/outfits"
                className="rounded-2xl border border-line bg-white p-5 flex gap-3 hover:border-ink/30 transition-colors"
              >
                {outfit.items.slice(0, 4).map((oi) => (
                  <div key={oi.id} className="relative aspect-[4/5] w-16 rounded-lg overflow-hidden bg-paper-alt shrink-0">
                    <Image src={oi.clothingItem.imageUrl} alt="" fill className="object-cover" />
                  </div>
                ))}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{outfit.occasion}</p>
                  <p className="text-xs text-stone mt-1">Score {outfit.overallScore}%</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickAction href="/wardrobe/add" icon={<Plus className="h-5 w-5" />} label="Add Clothing" />
          <QuickAction href="/outfits/create" icon={<Sparkles className="h-5 w-5" />} label="Create Outfit" />
          <QuickAction href="/pack" icon={<Luggage className="h-5 w-5" />} label="Pack for Trip" />
          <QuickAction href="/outfits/create?quick=surprise" icon={<Wand2 className="h-5 w-5" />} label="Surprise Me" />
        </div>
      </section>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-line bg-white p-5 flex flex-col items-center justify-center gap-2.5 text-center hover:border-ink/30 transition-colors"
    >
      <span className="text-ink-soft">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
