"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/outfits/create", label: "Create Outfit" },
  { href: "/outfits", label: "My Outfits" },
  { href: "/pack", label: "Pack a Trip" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-display text-xl tracking-tight">
          ClosetAI
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm transition-colors",
                  isActive ? "bg-paper-alt text-ink font-medium" : "text-stone hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/style-profile"
            className="hidden sm:inline-flex rounded-full px-3.5 py-2 text-sm text-stone hover:text-ink transition-colors"
          >
            Style Profile
          </Link>
          <Link
            href="/settings"
            className="hidden sm:inline-flex rounded-full px-3.5 py-2 text-sm text-stone hover:text-ink transition-colors"
          >
            Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border border-line px-3.5 py-2 text-sm text-ink-soft hover:border-ink transition-colors cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>

      <nav className="flex md:hidden items-center gap-1 overflow-x-auto px-6 pb-3 -mt-1">
        {LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                isActive ? "bg-paper-alt text-ink font-medium" : "text-stone"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
