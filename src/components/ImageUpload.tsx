"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Upload, Link2, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  /** Current image URL (controlled by parent) */
  value: string;
  /** Called with the final public URL after upload or URL entry */
  onChange: (url: string) => void;
  /** Firebase Storage path prefix, e.g. "products" or "pendingProducts" */
  storagePath?: string;
}

type Mode = "upload" | "url";

export default function ImageUpload({
  value,
  onChange,
  storagePath = "products",
}: ImageUploadProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [urlInput, setUrlInput] = useState(value.startsWith("http") ? value : "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── File upload ─── */
  const handleFile = (file: File) => {
    setError("");
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP, etc.).");
      return;
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, `${storagePath}/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);
    setProgress(0);

    uploadTask.on(
      "state_changed",
      (snap) => {
        setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      (err) => {
        setUploading(false);
        setError("Upload failed: " + err.message);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        onChange(url);
        setUploading(false);
      }
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  /* ─── URL entry ─── */
  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed && !trimmed.startsWith("http")) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setError("");
    onChange(trimmed);
  };

  const clearImage = () => {
    onChange("");
    setUrlInput("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm text-gray-400 mb-1">Product Image</label>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setMode("upload"); setError(""); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            mode === "upload"
              ? "bg-green-600 text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/20"
          }`}
        >
          <Upload size={12} /> Upload File
        </button>
        <button
          type="button"
          onClick={() => { setMode("url"); setError(""); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            mode === "url"
              ? "bg-green-600 text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/20"
          }`}
        >
          <Link2 size={12} /> External URL
        </button>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer transition"
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="animate-spin text-green-400" />
              <span className="text-xs text-gray-400">Uploading… {progress}%</span>
              <div className="absolute bottom-2 left-4 right-4 h-1 rounded bg-white/10">
                <div
                  className="h-1 rounded bg-green-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400">
                Click or drag & drop an image (max 5 MB)
              </span>
              <span className="text-xs text-gray-600">JPG, PNG, WEBP, GIF</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {/* URL mode */}
      {mode === "url" && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={applyUrl}
            onKeyDown={(e) => e.key === "Enter" && applyUrl()}
            className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <button
            type="button"
            onClick={applyUrl}
            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition"
          >
            Apply
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Preview */}
      {value && (
        <div className="relative mt-1 h-36 w-full rounded-xl overflow-hidden border border-white/10 group">
          <Image
            src={value}
            alt="Preview"
            fill
            sizes="100vw"
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
            title="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}