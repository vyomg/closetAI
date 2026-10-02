"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Camera, Loader2, Upload, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PersonalAppearanceProfileDTO } from "@/lib/clientTypes";

const GUIDANCE = [
  "Stand upright with your full body visible",
  "Good, even lighting",
  "Face visible, avoid heavy filters",
  "A simple background works best",
  "Wear your normal clothing",
  "Make sure shoes/feet are visible",
];

export function PersonalAppearanceUpload({
  onAnalyzed,
}: {
  onAnalyzed: (profile: PersonalAppearanceProfileDTO) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("File type unsupported. Use JPEG, PNG or WebP.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("This image is too large. Please choose a smaller photo (under 10MB).");
        return;
      }

      setPreviewUrl(URL.createObjectURL(file));
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch("/api/profile/appearance-photo", { method: "POST", body: formData });
        const data = await res.json();
        setUploading(false);
        if (!res.ok) {
          setError(data.error || "We couldn't analyze that photo. You can try again or skip this step.");
          return;
        }
        onAnalyzed(data);
      } catch {
        setUploading(false);
        setError("Connection problem — check your network and try again.");
      }
    },
    [onAnalyzed]
  );

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors overflow-hidden",
          isDragActive ? "border-ink bg-paper-alt" : "border-line hover:border-ink/40"
        )}
        style={{ minHeight: 280 }}
      >
        <input {...getInputProps()} />
        {previewUrl ? (
          <div className="relative mx-auto aspect-[3/4] w-40 rounded-xl overflow-hidden">
            <Image src={previewUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-10">
            <Upload className="h-7 w-7 text-stone mb-3" strokeWidth={1.5} />
            <p className="font-medium">Upload a full-body photo</p>
            <p className="text-sm text-stone mt-1">or drag one in — you can replace it anytime</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-ink-soft" />
            <p className="text-sm text-ink-soft">Analyzing your photo…</p>
          </div>
        )}
      </div>

      {previewUrl && !uploading && (
        <label className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink cursor-pointer">
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
          Replace photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
              e.target.value = "";
            }}
          />
        </label>
      )}

      <label className="mt-3 sm:hidden inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink cursor-pointer ml-4">
        <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
        Take a photo
        <input
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = "";
          }}
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-warning flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}

      <div className="mt-6 rounded-xl bg-paper-alt p-4">
        <p className="text-xs uppercase tracking-wide text-stone mb-2.5">For best results</p>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-ink-soft">
          {GUIDANCE.map((g) => (
            <li key={g}>• {g}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
