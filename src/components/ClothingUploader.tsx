"use client";

import { useCallback, useState } from "react";
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

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/clothing", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const item = await res.json();
      setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, status: "done", item } : e)));
    } catch (err) {
      setEntries((prev) =>
        prev.map((e) => (e.key === key ? { ...e, status: "error", error: (err as Error).message } : e))
      );
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

function UploadCard({ entry }: { entry: UploadEntry }) {
  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden animate-fade-up">
      <div className="relative aspect-[4/5] bg-paper-alt">
        <Image src={entry.previewUrl} alt="" fill className="object-cover" unoptimized />
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
          <p className="text-xs text-stone">Reading colour, fit, style…</p>
        )}
      </div>
    </div>
  );
}
