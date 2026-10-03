"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Shirt,
  Layers,
  ShoppingBag,
  Luggage,
  UserCircle,
  Settings,
  LogOut,
  Crown,
  BarChart3,
  Boxes,
  Trophy,
  CalendarDays,
  MessageSquareHeart,
  MessageCircle,
  Shuffle,
  Heart,
  Bell,
  BookmarkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Brand, Spark } from "@/components/Brand";
import type { LucideIcon } from "lucide-react";

// A small number of clear destinations, grouped by intent rather than by
// listing every route flat — Create Outfit is pulled out as its own
// primary action rather than living in this list, since it's the single
// most important thing to do in the product (see the lime CTA rendered
// above this list).
const GROUPS: { label: string; links: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    label: "Main",
    links: [
      { href: "/dashboard", label: "Home", icon: Home },
      { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
    ],
  },
  {
    label: "Style",
    links: [
      { href: "/chat", label: "Chat Now", icon: MessageCircle },
      { href: "/outfits", label: "Outfits", icon: Layers },
      { href: "/outfits/playground", label: "Outfit Playground", icon: Shuffle },
      { href: "/style-profile", label: "Style DNA", icon: UserCircle },
    ],
  },
  {
    label: "Discover",
    links: [
      { href: "/wishlist", label: "Wishlist", icon: BookmarkIcon },
      { href: "/gallery", label: "Gallery", icon: ImageIcon },
    ],
  },
  {
    label: "Plan",
    links: [
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/trips", label: "Trips", icon: Luggage },
    ],
  },
  {
    label: "Shop",
    links: [{ href: "/buy", label: "Buy", icon: ShoppingBag }],
  },
  {
    label: "More",
    links: [
      { href: "/outfits/challenges", label: "Challenges", icon: Trophy },
      { href: "/wardrobe/stats", label: "Wardrobe Stats", icon: BarChart3 },
      { href: "/wardrobe/capsule", label: "Capsule Wardrobe", icon: Boxes },
      { href: "/ask-a-friend", label: "Ask a Friend", icon: MessageSquareHeart },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/connect", label: "Connect With Us", icon: Heart },
    ],
  },
];

// "/outfits" also has its own distinct nav entries for sub-routes
// (Outfit Playground, Challenges), so — like "/dashboard" — it needs an
// exact match rather than a prefix match, or both "Outfits" and whichever
// sub-route is open would light up at once.
const EXACT_ONLY = new Set(["/dashboard", "/outfits"]);

function isActivePath(pathname: string, href: string) {
  return pathname === href || (!EXACT_ONLY.has(href) && pathname.startsWith(href));
}

export function Sidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const createActive = isActivePath(pathname, "/outfits/create");
  const [unreadCount, setUnreadCount] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/notifications?filter=unread")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => {});
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setCredits(typeof d.balance === "number" ? d.balance : null))
      .catch(() => {});
  }, [pathname]);

  return (
    <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:shrink-0 w-64 flex-col bg-graphite text-white">
      <div className="px-6 pt-7 pb-6 flex items-center justify-between">
        <Brand href="/dashboard" size="sm" className="text-white" />
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative shrink-0 rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-lime text-lime-ink text-[9px] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>

      <div className="px-3.5 mb-3">
        <Link
          href="/outfits/create"
          className={cn(
            "group flex items-center justify-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-semibold transition-all",
            "bg-lime text-lime-ink hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <Spark className={cn("h-3.5 w-3.5 transition-transform", createActive ? "" : "group-hover:rotate-45")} />
          match something
        </Link>
      </div>

      {credits !== null && (
        <div className="px-3.5 mb-5">
          <Link
            href="/settings"
            className="flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2 text-xs text-white/60 hover:bg-white/10 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Spark className="h-3 w-3 text-lime" /> Credits
            </span>
            <span className="font-medium text-white">{credits}</span>
          </Link>
        </div>
      )}

      <nav className="flex-1 flex flex-col gap-1 px-3.5 overflow-y-auto">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="px-3.5 pt-3 pb-1 text-[10px] uppercase tracking-[0.14em] text-white/35">{group.label}</p>
            {group.links.map((link) => {
              const Icon = link.icon;
              const active = isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                    active ? "bg-white/10 text-white font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-lime -ml-3.5" />}
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.75} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-3.5 pb-5 pt-3 border-t border-white/10">
        <Link
          href="/premium"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors mb-3",
            isActivePath(pathname, "/premium") ? "bg-white/10 text-white font-medium" : "text-white/50 hover:bg-white/5 hover:text-white"
          )}
        >
          <Crown className="h-[18px] w-[18px]" strokeWidth={1.75} />
          Premium
        </Link>

        <div className="flex items-center gap-2.5 px-3.5 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-white">{userName}</p>
            <p className="text-xs text-white/40 truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Log out"
            aria-label="Log out"
            className="shrink-0 rounded-full p-2 text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
