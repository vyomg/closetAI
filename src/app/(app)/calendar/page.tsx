"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";
import type { OutfitDTO } from "@/lib/clientTypes";

type CalendarEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  notes: string | null;
  outfit: { id: string; occasion: string; overallScore: number; items: { id: string; imageUrl: string }[] };
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [savedOutfits, setSavedOutfits] = useState<OutfitDTO[] | null>(null);

  const monthStart = useMemo(() => new Date(Date.UTC(monthCursor.getFullYear(), monthCursor.getMonth(), 1)), [monthCursor]);
  const monthEnd = useMemo(() => new Date(Date.UTC(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0)), [monthCursor]);

  useEffect(() => {
    fetch(`/api/calendar?start=${toISODate(monthStart)}&end=${toISODate(monthEnd)}`)
      .then((r) => r.json())
      .then(setEntries);
  }, [monthStart, monthEnd]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [entries]);

  const days: Date[] = [];
  for (let d = 1; d <= monthEnd.getUTCDate(); d++) {
    days.push(new Date(Date.UTC(monthCursor.getFullYear(), monthCursor.getMonth(), d)));
  }
  const leadingBlanks = monthStart.getUTCDay();

  function openPicker(dateStr: string) {
    setPickerDate(dateStr);
    if (!savedOutfits) {
      fetch("/api/outfits?saved=true")
        .then((r) => r.json())
        .then(setSavedOutfits);
    }
  }

  async function assign(outfitId: string) {
    if (!pickerDate) return;
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId, date: pickerDate }),
    });
    if (res.ok) {
      const created = await res.json();
      const outfit = savedOutfits?.find((o) => o.id === outfitId);
      if (outfit) {
        setEntries((prev) => [
          ...prev,
          {
            id: created.id,
            date: pickerDate,
            notes: null,
            outfit: { id: outfit.id, occasion: outfit.occasion, overallScore: outfit.overallScore, items: outfit.items.map((i) => ({ id: i.id, imageUrl: i.imageUrl })) },
          },
        ]);
      }
    }
    setPickerDate(null);
  }

  async function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
  }

  const monthLabel = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl">Outfit Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonthCursor((d) => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}
            className="p-2 rounded-full hover:bg-paper-alt cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-medium w-36 text-center">{monthLabel}</p>
          <button
            onClick={() => setMonthCursor((d) => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}
            className="p-2 rounded-full hover:bg-paper-alt cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop: month grid */}
      <div className="hidden lg:grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <p key={d} className="text-xs text-stone text-center pb-2">{d}</p>
        ))}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = toISODate(day);
          const dayEntries = entriesByDate.get(dateStr) ?? [];
          return (
            <div key={dateStr} className="min-h-28 rounded-xl border border-line bg-white p-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-stone">{day.getUTCDate()}</span>
                <button onClick={() => openPicker(dateStr)} className="text-stone hover:text-ink cursor-pointer">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              {dayEntries.map((e) => (
                <div key={e.id} className="group relative mb-1">
                  <div className="flex gap-1">
                    {e.outfit.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="relative aspect-[4/5] w-6 rounded overflow-hidden bg-paper-alt">
                        <Image src={item.imageUrl} alt="" fill sizes="24px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-stone truncate">{e.outfit.occasion}</p>
                  <button
                    onClick={() => removeEntry(e.id)}
                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-white rounded-full p-0.5 border border-line cursor-pointer"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact agenda list */}
      <div className="lg:hidden space-y-2">
        {days.map((day) => {
          const dateStr = toISODate(day);
          const dayEntries = entriesByDate.get(dateStr) ?? [];
          return (
            <div key={dateStr} className="rounded-xl border border-line bg-white p-3 flex items-center gap-3">
              <div className="w-10 shrink-0 text-center">
                <p className="text-xs text-stone">{day.toLocaleDateString("en-US", { weekday: "short" })}</p>
                <p className="font-display text-lg">{day.getUTCDate()}</p>
              </div>
              <div className="flex-1 min-w-0">
                {dayEntries.length > 0 ? (
                  dayEntries.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 mb-1 last:mb-0">
                      <div className="flex gap-1 shrink-0">
                        {e.outfit.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="relative aspect-[4/5] w-8 rounded overflow-hidden bg-paper-alt">
                            <Image src={item.imageUrl} alt="" fill sizes="32px" className="object-cover" />
                          </div>
                        ))}
                      </div>
                      <p className="text-sm truncate flex-1">{e.outfit.occasion}</p>
                      <button onClick={() => removeEntry(e.id)} className="text-stone p-1 cursor-pointer shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <button onClick={() => openPicker(dateStr)} className="text-sm text-stone cursor-pointer">
                    + Assign an outfit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pickerDate && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setPickerDate(null)}>
          <div
            className="bg-paper rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[75vh] overflow-y-auto p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl">Assign an outfit — {pickerDate}</h3>
              <button onClick={() => setPickerDate(null)} className="cursor-pointer p-1 -m-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            {!savedOutfits ? (
              <p className="text-sm text-stone">Loading…</p>
            ) : savedOutfits.length === 0 ? (
              <p className="text-sm text-stone">Save an outfit first, then assign it to a date here.</p>
            ) : (
              <div className="space-y-2">
                {savedOutfits.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => assign(o.id)}
                    className="w-full flex items-center gap-3 rounded-xl border border-line p-3 hover:border-ink/40 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex gap-1.5">
                      {o.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="relative aspect-[4/5] w-10 rounded overflow-hidden bg-paper-alt">
                          <Image src={item.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{o.occasion}</p>
                      <p className="text-xs text-stone">Score {o.overallScore}%</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
