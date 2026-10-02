"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import Link from "next/link";
import { Camera, Check, Loader2, Upload, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ClothingItemDTO } from "@/lib/clientTypes";

type UploadEntry = {
  key: string;
  previewUrl: string;
  status: "analyzing" | "done" | "error";
  item?: ClothingItemDTO & { aiUnavailable?: boolean };
  error?: string;
};

export function ClothingUploader() {
  const [entries, setEntries] = useState<UploadEntry[]>([]);

  const uploadFile = useCallback(async (file: File) => {
    const key = `${file.name}-${Date.now()}-${Math.random()}`;
    const previewUrl = URL.createObjectURL(file);
    setEntries((prev) => [{ key, previewUrl, status: "analyzing" }, ...prev]);

    // Client-side pre-validation — fail fast with a specific message instead
    // of round-tripping to the server for something we can already tell.
    if (!file.type.startsWith("image/")) {
      setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, status: "error", error: "File type unsupported. Use JPEG, PNG or WebP." } : e)));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, status: "error", error: "This image is too large. Please choose a smaller image (under 10MB)." } : e)));
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/clothing", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        // If the server didn't return parseable JSON (e.g. a framework-level
        // 500 for an error we failed to catch), say so honestly rather than
        // guessing — this is a server error, not a validation message.
        const message = data?.error ?? `Server error (${res.status}). Please try again.`;
        throw new Error(message);
      }
      const item = await res.json();
      setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, status: "done", item } : e)));
    } catch (err) {
      // A thrown TypeError from fetch itself (not an HTTP error response)
      // means the request never reached the server — a real network problem.
      const isNetworkError = err instanceof TypeError;
      const message = isNetworkError ? "Connection problem — check your network and try again." : (err as Error).message;
      setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, status: "error", error: message } : e)));
    }
  }, []);

  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach(uploadFile);
    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  function onCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) Array.from(files).forEach(uploadFile);
    e.target.value = "";
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors",
          isDragActive ? "border-ink bg-paper-alt" : "border-line hover:border-ink/40"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 h-7 w-7 text-stone" strokeWidth={1.5} />
        <p className="font-medium">Drag & drop clothing photos here</p>
        <p className="text-sm text-stone mt-1">or click to browse — you can select multiple at once</p>
      </div>

      <div className="mt-4 flex justify-center">
        <label className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink cursor-pointer transition-colors">
          <Camera className="h-4 w-4" strokeWidth={1.5} />
          Take a photo
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onCameraCapture} />
        </label>
      </div>

      {entries.length > 0 && (
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {entries.map((entry) => (
            <UploadCard key={entry.key} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

// Purely a perceived-progress readout for the single in-flight request — it
// never claims a step is done before the real response comes back, it just
// gives the honest wait something readable to look at.
const ANALYZING_STEPS = ["Analyzing…", "Reading colour, fit, style…", "Cleaning image…", "Creating your wardrobe item…"];

function AnalyzingStatus() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, ANALYZING_STEPS.length - 1)), 1400);
    return () => clearInterval(id);
  }, []);
  return <p className="text-xs text-stone">{ANALYZING_STEPS[step]}</p>;
}

function UploadCard({ entry }: { entry: UploadEntry }) {
  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden animate-fade-up">
      <div className="relative aspect-[4/5] bg-paper-alt">
        <Image src={entry.previewUrl} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" unoptimized />
        <div className="absolute inset-0 flex items-end p-3">
          {entry.status === "analyzing" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…
            </span>
          )}
          {entry.status === "done" && !entry.item?.aiUnavailable && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-success">
              <Check className="h-3.5 w-3.5" /> Added
            </span>
          )}
          {entry.status === "done" && entry.item?.aiUnavailable && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-warning">
              <AlertTriangle className="h-3.5 w-3.5" /> Added — needs review
            </span>
          )}
          {entry.status === "error" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-warning">
              <AlertTriangle className="h-3.5 w-3.5" /> Failed
            </span>
          )}
        </div>
      </div>
      <div className="p-3.5">
        {entry.status === "done" && entry.item ? (
          <>
            <p className="text-sm font-medium truncate">{entry.item.name}</p>
            <p className="text-xs text-stone mt-0.5 mb-2">
              {entry.item.primaryColor} · {entry.item.subcategory}
            </p>
            <Link href={`/wardrobe/${entry.item.id}`} className="text-xs underline underline-offset-4">
              Review details
            </Link>
          </>
        ) : entry.status === "error" ? (
          <p className="text-xs text-warning">{entry.error}</p>
        ) : (
          <AnalyzingStatus />
        )}
      </div>
    </div>
  );
}
