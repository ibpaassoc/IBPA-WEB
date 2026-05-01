"use client";

import React from "react";
import { FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { genUploader } from "uploadthing/client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
  package: "@uploadthing/react",
});

type ApplicationFileUploadFieldProps = {
  endpoint: keyof OurFileRouter;
  label: string;
  description: string;
  value: string[];
  onChange: (urls: string[]) => void;
  accept: string;
  chooseLabel: string;
  multiple?: boolean;
  minFiles?: number;
  maxFiles?: number;
  imageOnly?: boolean;
  error?: React.ReactNode;
};

export function ApplicationFileUploadField({
  endpoint,
  label,
  description,
  value,
  onChange,
  accept,
  chooseLabel,
  multiple = false,
  minFiles = 1,
  maxFiles = 1,
  imageOnly = false,
  error,
}: ApplicationFileUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFiles = React.useCallback(
    async (fileList?: FileList | File[] | null) => {
      if (!fileList?.length) return;

      const files = Array.from(fileList).filter((file) => !imageOnly || file.type.startsWith("image/"));
      if (!files.length) return;

      const availableSlots = maxFiles - value.length;
      const filesToUpload = files.slice(0, availableSlots);

      if (!filesToUpload.length) return;

      setIsUploading(true);
      try {
        const result = await uploadFiles(endpoint, { files: filesToUpload });
        const uploadedUrls = result
          .map((item) => item.serverData?.url || item.ufsUrl || item.url)
          .filter((item): item is string => Boolean(item));

        onChange([...value, ...uploadedUrls].slice(0, maxFiles));
      } catch (error) {
        console.error(`Failed to upload files for ${String(endpoint)}`, error);
      } finally {
        setIsUploading(false);
      }
    },
    [endpoint, imageOnly, maxFiles, onChange, value],
  );

  const removeFile = (url: string) => {
    onChange(value.filter((item) => item !== url));
  };

  const limitReached = value.length >= maxFiles;

  return (
    <div className="space-y-4 md:col-span-2">
      <div className="space-y-2">
        <label className="field-label">{label} *</label>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={async (event) => {
          event.preventDefault();
          setIsDragging(false);
          await handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-[28px] border-2 border-dashed bg-white p-6 transition-all ${
          isDragging ? "border-[#72A0C1] bg-[#F0F8FF]" : "border-slate-200"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={async (event) => {
            await handleFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-[#72A0C1]" />
          ) : (
            <UploadCloud className="h-10 w-10 text-slate-400" />
          )}

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700">Drag files here or choose files</p>
            <p className="text-xs text-slate-400">
              Uploaded: {value.length}/{maxFiles}. Minimum: {minFiles}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || limitReached}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            {limitReached ? "Limit reached" : chooseLabel}
          </button>
        </div>
      </div>

      {value.length > 0 && (
        <div className={imageOnly ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" : "grid gap-3"}>
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white">
              {imageOnly ? (
                <a href={url} target="_blank" rel="noreferrer">
                  <ImageWithFallback src={url} alt={`${label} ${index + 1}`} className="aspect-square h-full w-full object-cover" />
                </a>
              ) : (
                <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 text-sm font-semibold text-slate-700 hover:text-[#4C7D9D]">
                  <FileText className="h-5 w-5 text-[#72A0C1]" />
                  <span>{label} {index + 1}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => removeFile(url)}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition-all md:opacity-0 md:group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error}
    </div>
  );
}
