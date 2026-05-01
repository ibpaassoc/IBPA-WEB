"use client";

import React from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
  package: "@uploadthing/react",
});

type UploadEndpoint = keyof OurFileRouter;

type AdminUploadZoneProps = {
  endpoint: UploadEndpoint;
  accept?: string;
  label: string;
  helperText: string;
  buttonText: string;
  prepareFile?: (file: File) => Promise<{ file: File; aspect?: number | null } | null>;
  onUploaded: (url: string, metadata?: { aspect?: number | null }) => void;
  onError?: (message: string) => void;
  onFileSelected?: (file: File) => void;
};

export function AdminUploadZone({
  endpoint,
  accept,
  label,
  helperText,
  buttonText,
  prepareFile,
  onUploaded,
  onError,
  onFileSelected,
}: AdminUploadZoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFile = React.useCallback(
    async (file?: File | null) => {
      if (!file) return;
      setIsUploading(true);
      try {
        const prepared = prepareFile ? await prepareFile(file) : { file };
        if (!prepared) {
          return;
        }

        const result = await uploadFiles(endpoint, { files: [prepared.file] });
        const uploaded = result?.[0] as
          | { ufsUrl?: string; url?: string; serverData?: { url?: string } }
          | undefined;
        const url = uploaded?.serverData?.url || uploaded?.ufsUrl || uploaded?.url;

        if (!url) {
          throw new Error("Upload completed, but no file URL was returned.");
        }

        onUploaded(url, { aspect: prepared.aspect });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        onError?.(message);
      } finally {
        setIsUploading(false);
      }
    },
    [endpoint, onError, onUploaded, prepareFile],
  );

    const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (onFileSelected) {
            onFileSelected(file);
        } else {
            await handleFile(file);
        }

        event.target.value = "";
    };

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files?.[0];
        if (!file) return;

        if (onFileSelected) {
            onFileSelected(file);
        } else {
            await handleFile(file);
        }
    };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`rounded-[20px] border-2 border-dashed bg-white/80 p-6 text-center transition-colors ${
        isDragging ? "border-[#72A0C1] bg-[#F0F8FF]" : "border-slate-300"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col items-center gap-4">
        <div className="text-slate-400">
          {isUploading ? <Loader2 className="h-12 w-12 animate-spin" /> : <UploadCloud className="h-12 w-12" />}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="text-xs text-slate-400">{helperText}</p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : buttonText}
        </button>
      </div>
    </div>
  );
}
