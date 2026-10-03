"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { BrandLoading } from "@/components/Brand";
import { cn } from "@/lib/cn";

type NotificationDTO = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const TABS = ["all", "unread", "read"] as const;

export default function NotificationsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [notifications, setNotifications] = useState<NotificationDTO[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch(`/api/notifications?filter=${tab}`)
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      });
  }, [tab]);

  async function markRead(id: string) {
    setNotifications((prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? null);
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setNotifications((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  if (!notifications) return <BrandLoading />;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl mb-1">Notifications</h1>
          <p className="text-stone">{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-ink-soft hover:text-ink underline underline-offset-4 cursor-pointer">
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm capitalize transition-colors cursor-pointer",
              tab === t ? "bg-ink text-paper" : "border border-line text-ink-soft hover:border-ink/40"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20">
          <BellOff className="h-8 w-8 text-stone mb-4" strokeWidth={1.5} />
          <p className="font-display text-lg mb-1">No notifications</p>
          <p className="text-sm text-stone">You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const content = (
              <div
                className={cn(
                  "rounded-2xl border border-line p-4 flex items-start gap-3 transition-colors",
                  n.read ? "bg-paper-alt" : "bg-paper-alt border-lime/40"
                )}
              >
                <Bell className={cn("h-4 w-4 mt-0.5 shrink-0", n.read ? "text-stone" : "text-lime")} strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-ink-soft mt-0.5">{n.body}</p>
                  <p className="text-xs text-stone mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-lime shrink-0 mt-1.5" />}
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} onClick={() => !n.read && markRead(n.id)} className="block">
                {content}
              </Link>
            ) : (
              <button key={n.id} onClick={() => !n.read && markRead(n.id)} className="w-full text-left cursor-pointer">
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
