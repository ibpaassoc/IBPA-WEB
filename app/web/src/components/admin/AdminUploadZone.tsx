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
  multiple?: boolean;
  label: string;
  helperText: string;
  buttonText: string;
  prepareFile?: (file: File) => Promise<{ file: File; aspect?: number | null } | null>;
  onUploaded: (url: string, metadata?: { aspect?: number | null; fileName?: string; fileKey?: string | null; fileType?: string }) => void;
  onError?: (message: string) => void;
  onFileSelected?: (file: File) => void;
};

export function AdminUploadZone({
  endpoint,
  accept,
  multiple = false,
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

  const handleFiles = React.useCallback(
    async (selectedFiles?: FileList | File[] | null) => {
      const files = Array.from(selectedFiles || []);
      if (!files.length) return;

      const filesToHandle = multiple ? files : files.slice(0, 1);
      setIsUploading(true);
      try {
        const preparedFiles: Array<{ file: File; aspect?: number | null }> = [];

        for (const file of filesToHandle) {
          const prepared = prepareFile ? await prepareFile(file) : { file };
          if (prepared) {
            preparedFiles.push(prepared);
          }
        }

        if (!preparedFiles.length) {
          return;
        }

        const result = await uploadFiles(endpoint, { files: preparedFiles.map((item) => item.file) });

        for (const [index, uploadedResult] of (result || []).entries()) {
          const uploaded = uploadedResult as
            | {
                ufsUrl?: string;
                url?: string;
                key?: string;
                name?: string;
                type?: string;
                serverData?: { url?: string };
              }
            | undefined;
          const prepared = preparedFiles[index];
          const url = uploaded?.serverData?.url || uploaded?.ufsUrl || uploaded?.url;

          if (!url) {
            throw new Error("Upload completed, but no file URL was returned.");
          }

          onUploaded(url, {
            aspect: prepared.aspect,
            fileName: uploaded?.name || prepared.file.name,
            fileKey: uploaded?.key || null,
            fileType: uploaded?.type || prepared.file.type,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        onError?.(message);
      } finally {
        setIsUploading(false);
      }
    },
    [endpoint, multiple, onError, onUploaded, prepareFile],
  );

    const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        const file = files?.[0];
        if (!file) return;

        if (onFileSelected) {
            onFileSelected(file);
        } else {
            await handleFiles(files);
        }

        event.target.value = "";
    };

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);

        const files = event.dataTransfer.files;
        const file = files?.[0];
        if (!file) return;

        if (onFileSelected) {
            onFileSelected(file);
        } else {
            await handleFiles(files);
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
      className={`rounded-[20px] border-2 border-dashed bg-white p-5 text-center transition-colors ${
        isDragging ? "border-[#1F5D8F] bg-[#EEF6FF]" : "border-[#CFE0F3]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EEF6FF] text-[#1F5D8F]">
          {isUploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#10203B]">{label}</p>
          <p className="text-xs text-[#6C7F95]">{helperText}</p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#D7E5F4] bg-white px-4 text-xs font-semibold text-[#1F5D8F] transition-colors hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : buttonText}
        </button>
      </div>
    </div>
  );
}
