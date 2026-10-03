"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Plus,
  X,
  Camera,
  Shirt,
  Send,
  Trash2,
  MessagesSquare,
  ChevronDown,
} from "lucide-react";
import { Spark } from "@/components/Brand";
import { Button } from "@/components/ui/Button";
import { OutfitCard } from "@/components/OutfitCard";
import { FloatingWords } from "@/components/FloatingWords";
import { cn } from "@/lib/cn";
import { OCCASIONS, DESIRED_STYLES } from "@/lib/constants";
import type { ClothingItemDTO, OutfitDTO } from "@/lib/clientTypes";

type ThreadSummary = { id: string; title: string; mode: ChatMode; pinned: boolean; updatedAt: string; lastMessage: string | null };
type ChatMode = "closet" | "hybrid" | "shopping";
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachmentImageUrl: string | null;
  attachmentLabel: string | null;
  createdAt: string;
  outfit?: OutfitDTO | null;
};

const MODE_LABEL: Record<ChatMode, string> = { closet: "Closet mode", hybrid: "Hybrid mode", shopping: "Shopping mode" };
const MODE_DESC: Record<ChatMode, string> = {
  closet: "Only your wardrobe",
  hybrid: "Your wardrobe + suggestions",
  shopping: "Shopping-focused",
};

const THINKING_STAGES = ["Understanding...", "Checking your wardrobe...", "Matching colours...", "Finalizing..."];

export default function ChatNowPage() {
  return (
    <Suspense>
      <ChatNowInner />
    </Suspense>
  );
}

function ChatNowInner() {
  const searchParams = useSearchParams();
  const prefillAsk = searchParams.get("ask");
  const aboutOutfitId = searchParams.get("aboutOutfit");

  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>("closet");
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadsOpen, setThreadsOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [text, setText] = useState("");
  const [occasion, setOccasion] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [chatOnly, setChatOnly] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachedItem, setAttachedItem] = useState<ClothingItemDTO | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [wardrobe, setWardrobe] = useState<ClothingItemDTO[] | null>(null);

  const [sending, setSending] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadThreads() {
    fetch("/api/chat/threads")
      .then((r) => r.json())
      .then(setThreads);
  }

  useEffect(() => {
    loadThreads();
    fetch("/api/clothing")
      .then((r) => r.json())
      .then(setWardrobe);
  }, []);

  useEffect(() => {
    if (prefillAsk) setText(prefillAsk);
  }, [prefillAsk]);

  useEffect(() => {
    if (!aboutOutfitId) return;
    fetch(`/api/outfits/${aboutOutfitId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((outfit: OutfitDTO | null) => {
        if (!outfit) return;
        const names = outfit.items.map((i) => i.name).join(", ");
        setText(`About my ${outfit.occasion.toLowerCase()} outfit (${names}): `);
      });
  }, [aboutOutfitId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function openThread(id: string) {
    setThreadId(id);
    setThreadsOpen(false);
    const res = await fetch(`/api/chat/threads/${id}`);
    const data = await res.json();
    setMessages(data.messages);
    setMode(data.mode);
  }

  async function startNewThread(initialMode: ChatMode = "closet") {
    const res = await fetch("/api/chat/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: initialMode }),
    });
    const thread = await res.json();
    setThreadId(thread.id);
    setMode(thread.mode);
    setMessages([]);
    loadThreads();
    return thread.id as string;
  }

  async function removeThread(id: string) {
    setThreads((prev) => prev?.filter((t) => t.id !== id) ?? null);
    if (threadId === id) {
      setThreadId(null);
      setMessages([]);
    }
    await fetch(`/api/chat/threads/${id}`, { method: "DELETE" });
  }

  async function changeMode(next: ChatMode) {
    setMode(next);
    setModeOpen(false);
    if (threadId) {
      await fetch(`/api/chat/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
    }
  }

  async function send() {
    const messageText =
      text.trim() ||
      (occasion || style ? `Something for ${occasion?.toLowerCase() ?? "everyday"}${style ? `, ${style.toLowerCase()} vibe` : ""}.` : "");
    if (!messageText && !attachedItem && !attachedFile) return;

    setError(null);
    setSending(true);
    setThinkingStage(0);
    const stageTimer = setInterval(() => setThinkingStage((s) => Math.min(THINKING_STAGES.length - 1, s + 1)), 1100);

    let activeThreadId = threadId;
    if (!activeThreadId) activeThreadId = await startNewThread(mode);

    const optimisticUser: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: messageText,
      attachmentImageUrl: attachedItem?.imageUrl ?? (attachedFile ? URL.createObjectURL(attachedFile) : null),
      attachmentLabel: attachedItem?.name ?? attachedFile?.name ?? null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    const formData = new FormData();
    formData.append("text", messageText || "Can I wear this with my wardrobe?");
    if (occasion) formData.append("occasion", occasion);
    if (style) formData.append("desiredStyle", style);
    formData.append("chatOnly", String(chatOnly));
    if (attachedItem) formData.append("attachedItemId", attachedItem.id);
    if (attachedFile) formData.append("image", attachedFile);

    const res = await fetch(`/api/chat/threads/${activeThreadId}/messages`, { method: "POST", body: formData });
    const data = await res.json();
    clearInterval(stageTimer);
    setSending(false);
    setText("");
    setOccasion(null);
    setStyle(null);
    setAttachedItem(null);
    setAttachedFile(null);
    setChatOnly(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      return;
    }

    setMessages((prev) => [...prev.filter((m) => m.id !== optimisticUser.id), data.userMessage, data.assistantMessage]);
    loadThreads();
  }

  function toggleOutfitSave(messageId: string, outfitId: string, next: boolean) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId && m.outfit ? { ...m, outfit: { ...m.outfit, isSaved: next } } : m))
    );
    fetch(`/api/outfits/${outfitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSaved: next }),
    });
  }

  const filteredThreads = (threads ?? []).filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-2xl relative">
      <div className="relative rounded-2xl bg-graphite text-white p-6 sm:p-8 mb-6">
        <FloatingWords words={["ASK", "MIX", "REMIX", "✦"]} />
        <div className="flex items-start justify-between gap-3 relative">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-3">your personal stylist</p>
            <h1 className="font-display text-3xl sm:text-4xl mb-2 lowercase flex items-center gap-2">
              chat now <Spark className="h-5 w-5 text-lime" />
            </h1>
            <p className="text-sm text-white/50 max-w-md">
              Tell matchin&apos; what you&apos;re dressing for — it&apos;ll build something real from your actual wardrobe.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setThreadsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <MessagesSquare className="h-3.5 w-3.5" /> Chats
            </button>
            <button
              onClick={() => startNewThread(mode)}
              className="inline-flex items-center gap-1.5 rounded-full bg-lime text-lime-ink px-3 py-1.5 text-xs font-medium hover:scale-[1.03] transition-transform cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> New chat
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          <button
            onClick={() => setModeOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:border-white/40 transition-colors cursor-pointer"
          >
            {MODE_LABEL[mode]} <ChevronDown className="h-3 w-3" />
          </button>
          {modeOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-20 w-64 rounded-xl border border-line bg-paper-alt shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)] py-1.5 text-ink">
              {(Object.keys(MODE_LABEL) as ChatMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => changeMode(m)}
                  className={cn("w-full text-left px-3.5 py-2.5 hover:bg-paper-alt cursor-pointer", mode === m && "bg-paper-alt")}
                >
                  <p className="text-sm font-medium">{MODE_LABEL[m]}</p>
                  <p className="text-xs text-stone">{MODE_DESC[m]}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!threadId && messages.length === 0 && (
        <div className="rounded-2xl border border-line bg-paper-alt p-6 sm:p-7 mb-6 animate-fade-up">
          <p className="font-display text-xl mb-1 lowercase">
            matchin&apos; <Spark className="inline h-3.5 w-3.5 text-lime -translate-y-0.5" />
          </p>
          <p className="text-sm text-stone">hey — what are we dressing for?</p>
        </div>
      )}

      <div className="space-y-5 mb-8">
        {messages.map((m) => (
          <div key={m.id} className="animate-fade-up">
            {m.role === "user" ? (
              <div className="flex justify-end mb-3">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-lime text-lime-ink px-4 py-2.5 text-sm">
                  {m.attachmentImageUrl && (
                    <div className="relative w-16 aspect-[4/5] rounded-lg overflow-hidden mb-2 bg-lime-ink/10">
                      <Image src={m.attachmentImageUrl} alt={m.attachmentLabel ?? ""} fill sizes="64px" className="object-cover" />
                    </div>
                  )}
                  {m.content}
                </div>
              </div>
            ) : m.outfit ? (
              <OutfitCard outfit={m.outfit} onSaveToggle={(next) => toggleOutfitSave(m.id, m.outfit!.id, next)} />
            ) : (
              <div className="rounded-2xl border border-line bg-paper-alt p-5 max-w-[85%]">
                <p className="text-sm text-ink-soft leading-relaxed">{m.content}</p>
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="rounded-2xl border border-line bg-paper-alt p-6 flex items-center gap-3">
            <Spark className="h-4 w-4 text-lime animate-spark-spin shrink-0" />
            <p className="text-sm text-stone lowercase">matchin&apos;s thinkin&apos; — {THINKING_STAGES[thinkingStage]}</p>
          </div>
        )}
        {error && <p className="text-sm text-warning">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="rounded-2xl border border-line bg-paper-alt p-5 sm:p-6 sticky bottom-24 lg:bottom-6">
        {(attachedItem || attachedFile) && (
          <div className="flex items-center gap-2 mb-3 rounded-xl bg-paper px-3 py-2">
            <div className="relative h-10 w-8 rounded overflow-hidden shrink-0 bg-paper-alt">
              <Image
                src={attachedItem?.imageUrl ?? (attachedFile ? URL.createObjectURL(attachedFile) : "")}
                alt=""
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
            <p className="text-xs text-ink-soft flex-1 truncate">{attachedItem?.name ?? attachedFile?.name}</p>
            <button
              onClick={() => {
                setAttachedItem(null);
                setAttachedFile(null);
              }}
              className="cursor-pointer p-1 text-stone hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {!chatOnly && (
          <>
            <p className="text-xs uppercase tracking-wide text-stone mb-2.5">what are we dressing for?</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {OCCASIONS.slice(0, 7).map((o) => (
                <button
                  key={o}
                  onClick={() => setOccasion((cur) => (cur === o ? null : o))}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition-colors cursor-pointer",
                    occasion === o ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40"
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
            <p className="text-xs uppercase tracking-wide text-stone mb-2.5">what&apos;s the vibe?</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {DESIRED_STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle((cur) => (cur === s ? null : s))}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition-colors cursor-pointer",
                    style === s ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              onClick={() => setAttachOpen((o) => !o)}
              className="h-10 w-10 shrink-0 rounded-full border border-line flex items-center justify-center text-ink-soft hover:text-ink hover:border-ink/40 transition-colors cursor-pointer"
              aria-label="Add attachment"
            >
              <Plus className="h-4 w-4" />
            </button>
            {attachOpen && (
              <div className="absolute left-0 bottom-full mb-2 z-20 w-56 rounded-xl border border-line bg-paper-alt shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] py-1.5">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setAttachOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 text-left px-3.5 py-2.5 text-sm hover:bg-paper-alt cursor-pointer"
                >
                  <Camera className="h-4 w-4 text-ink-soft" /> Upload a photo
                </button>
                <button
                  onClick={() => {
                    setAttachOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 text-left px-3.5 py-2.5 text-sm hover:bg-paper-alt cursor-pointer"
                >
                  <Shirt className="h-4 w-4 text-ink-soft" /> From your wardrobe
                </button>
                <label className="flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer">
                  <span className="text-ink-soft">Chat-only mode</span>
                  <input type="checkbox" checked={chatOnly} onChange={(e) => setChatOnly(e.target.checked)} className="cursor-pointer" />
                </label>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setAttachedFile(f);
                  setAttachedItem(null);
                }
              }}
            />
          </div>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={chatOnly ? "Just chat — no outfit this time…" : "or tell matchin' exactly what you need…"}
            className="flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink"
          />
          <Button onClick={send} disabled={sending} size="md">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!chatOnly && <p className="text-xs text-stone mt-2.5">Asking for an outfit uses 1 credit · chat-only mode is free</p>}
      </div>

      {attachOpen && wardrobe && (
        <WardrobeAttachPicker
          items={wardrobe}
          onClose={() => setAttachOpen(false)}
          onSelect={(item) => {
            setAttachedItem(item);
            setAttachedFile(null);
            setAttachOpen(false);
          }}
        />
      )}

      {threadsOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setThreadsOpen(false)}>
          <div
            className="bg-paper rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl">Chats</h3>
              <button onClick={() => setThreadsOpen(false)} className="cursor-pointer p-1 -m-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your chats…"
                className="w-full rounded-full border border-line bg-paper-alt pl-9 pr-4 py-2.5 text-sm outline-none focus:border-ink"
              />
            </div>
            {filteredThreads.length === 0 ? (
              <p className="text-sm text-stone text-center py-10">No chats yet.</p>
            ) : (
              <div className="space-y-1.5">
                {filteredThreads.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3.5 py-3 cursor-pointer transition-colors",
                      threadId === t.id ? "bg-paper-alt" : "hover:bg-paper-alt"
                    )}
                    onClick={() => openThread(t.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      {t.lastMessage && <p className="text-xs text-stone truncate">{t.lastMessage}</p>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeThread(t.id);
                      }}
                      className="shrink-0 p-1.5 text-stone hover:text-warning cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WardrobeAttachPicker({
  items,
  onClose,
  onSelect,
}: {
  items: ClothingItemDTO[];
  onClose: () => void;
  onSelect: (item: ClothingItemDTO) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div
        className="bg-paper rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[75vh] overflow-y-auto p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">Attach from wardrobe</h3>
          <button onClick={onClose} className="cursor-pointer p-1 -m-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <button key={item.id} onClick={() => onSelect(item)} className="text-left rounded-xl border border-line overflow-hidden hover:border-ink transition-colors cursor-pointer">
              <div className="relative aspect-[4/5] bg-paper-alt">
                <Image src={item.imageUrl} alt={item.name} fill sizes="120px" className="object-cover" />
              </div>
              <p className="text-xs p-1.5 truncate">{item.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
