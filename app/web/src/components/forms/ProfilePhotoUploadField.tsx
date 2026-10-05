"use client";

import React from "react";
import { Camera, Loader2, Trash2, User } from "lucide-react";
import { genUploader } from "uploadthing/client";
import { toast } from "sonner";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { isImageLikeFile, prepareUploadFiles, withHeicAccept } from "@/lib/heic-upload";

const { uploadFiles } = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
  package: "@uploadthing/react",
});
const MAX_IMAGE_BYTES = 16 * 1024 * 1024;

type ProfilePhotoUploadFieldProps = {
  label: string;
  description: string;
  value: string[];
  onChange: (urls: string[]) => void;
  error?: React.ReactNode;
  chooseLabel?: string;
  replaceLabel?: string;
  removeLabel?: string;
  uploadingLabel?: string;
  formatHint?: string;
};

export function ProfilePhotoUploadField({
  label,
  description,
  value,
  onChange,
  error,
  chooseLabel = "Choose photo",
  replaceLabel = "Replace photo",
  removeLabel = "Remove",
  uploadingLabel = "Uploading...",
  formatHint = "JPG, PNG, WEBP, or HEIC. One photo, max 16MB.",
}: ProfilePhotoUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const photoUrl = value[0];

  const handleFiles = React.useCallback(
    async (fileList?: FileList | File[] | null) => {
      const file = Array.from(fileList ?? []).find((item) => isImageLikeFile(item));
      if (!file) return;

      setIsUploading(true);
      try {
        const preparedFiles = await prepareUploadFiles([file], { maxImageBytes: MAX_IMAGE_BYTES });
        const result = await uploadFiles("portfolioUploader", { files: preparedFiles });
        const uploadedUrl = result
          .map((item) => item.serverData?.url || item.ufsUrl || item.url)
          .find((item): item is string => Boolean(item));

        if (uploadedUrl) {
          onChange([uploadedUrl]);
        }
      } catch (uploadError) {
        console.error("Failed to upload profile photo", uploadError);
        toast.error(uploadError instanceof Error ? uploadError.message : "Failed to upload profile photo.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange],
  );

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
        className={`flex flex-col items-center gap-6 rounded-[28px] border-2 border-dashed bg-white p-6 text-center transition-all sm:flex-row sm:text-left ${
          isDragging ? "border-[#72A0C1] bg-[#F0F8FF]" : "border-slate-200"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={withHeicAccept("image/*")}
          className="hidden"
          onChange={async (event) => {
            await handleFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B9D9EB] bg-[#F0F8FF] shadow-sm">
          {photoUrl ? (
            <ImageWithFallback src={photoUrl} alt={label} className="h-full w-full object-cover" />
          ) : (
            <User className="h-10 w-10 text-[#72A0C1]" strokeWidth={1.5} />
          )}
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75">
              <Loader2 className="h-7 w-7 animate-spin text-[#72A0C1]" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <p className="text-xs text-slate-400">{formatHint}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              {isUploading ? uploadingLabel : photoUrl ? replaceLabel : chooseLabel}
            </button>
            {photoUrl && !isUploading ? (
              <button
                type="button"
                onClick={() => onChange([])}
                className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                {removeLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error}
    </div>
  );
}
