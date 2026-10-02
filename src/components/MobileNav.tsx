"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, Shirt, ShoppingBag, Menu, X, Luggage, Layers, UserCircle, Settings, LogOut, Crown, BarChart3, Boxes, Trophy, CalendarDays, MessageSquareHeart } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spark } from "@/components/Brand";
import type { LucideIcon } from "lucide-react";

// matchin'-ing is the product's single most important action, so it gets
// its own raised lime center tab rather than blending in as just another
// icon+label pair like the rest of the bar.
const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/buy", label: "Shop", icon: ShoppingBag },
];

const MORE_LINKS: { href: string; label: string; icon: LucideIcon; group?: string }[] = [
  { href: "/outfits", label: "Outfits", icon: Layers, group: "Style" },
  { href: "/style-profile", label: "Style DNA", icon: UserCircle },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, group: "Plan" },
  { href: "/trips", label: "Trips", icon: Luggage },
  { href: "/ask-a-friend", label: "Ask a Friend", icon: MessageSquareHeart, group: "More" },
  { href: "/outfits/challenges", label: "Challenges", icon: Trophy },
  { href: "/wardrobe/stats", label: "Wardrobe Stats", icon: BarChart3 },
  { href: "/wardrobe/capsule", label: "Capsule Wardrobe", icon: Boxes },
  { href: "/premium", label: "Premium", icon: Crown },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = MORE_LINKS.some((l) => isActivePath(pathname, l.href));

  return (
    <>
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-graphite/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto max-w-6xl grid grid-cols-5 items-end px-1">
          {TABS.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const active = isActivePath(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-11"
              >
                <Icon className={cn("h-5 w-5", active ? "text-lime" : "text-white/50")} strokeWidth={active ? 2.25 : 1.75} />
                <span className={cn("text-[10px]", active ? "text-white font-medium" : "text-white/50")}>{tab.label}</span>
              </Link>
            );
          })}

          <Link
            href="/outfits/create"
            className="flex flex-col items-center justify-center gap-1 pb-2 -mt-4"
          >
            <span className="flex items-center justify-center h-12 w-12 rounded-full bg-lime text-lime-ink shadow-[0_6px_18px_-4px_rgba(215,255,63,0.6)]">
              <Spark className="h-5 w-5" />
            </span>
            <span className={cn("text-[10px]", isActivePath(pathname, "/outfits/create") ? "text-white font-medium" : "text-white/50")}>match</span>
          </Link>

          {TABS.slice(2).map((tab) => {
            const Icon = tab.icon;
            const active = isActivePath(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-11"
              >
                <Icon className={cn("h-5 w-5", active ? "text-lime" : "text-white/50")} strokeWidth={active ? 2.25 : 1.75} />
                <span className={cn("text-[10px]", active ? "text-white font-medium" : "text-white/50")}>{tab.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-11 cursor-pointer"
          >
            <Menu className={cn("h-5 w-5", moreActive ? "text-lime" : "text-white/50")} strokeWidth={moreActive ? 2.25 : 1.75} />
            <span className={cn("text-[10px]", moreActive ? "text-white font-medium" : "text-white/50")}>More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-ink/50" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-paper p-6 animate-fade-up max-h-[80vh] overflow-y-auto"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="font-display text-xl lowercase">more</p>
              <button onClick={() => setMoreOpen(false)} className="cursor-pointer p-1 -m-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              {MORE_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <div key={link.href}>
                    {link.group && (
                      <p className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-stone/80 first:pt-0">{link.group}</p>
                    )}
                    <Link
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm transition-colors",
                        isActivePath(pathname, link.href) ? "bg-paper-alt font-medium" : "hover:bg-paper-alt"
                      )}
                    >
                      <Icon className="h-5 w-5 text-ink-soft" strokeWidth={1.75} />
                      {link.label}
                    </Link>
                  </div>
                );
              })}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm text-warning hover:bg-paper-alt transition-colors cursor-pointer"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.75} />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
