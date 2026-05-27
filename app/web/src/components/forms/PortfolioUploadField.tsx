"use client";

import React from "react";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { genUploader } from "uploadthing/client";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { isImageLikeFile, prepareUploadFiles } from "@/lib/heic-upload";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
  package: "@uploadthing/react",
});

type PortfolioUploadFieldProps = {
  isRu: boolean;
  isUk: boolean;
  value: string[];
  onChange: (urls: string[]) => void;
  error?: React.ReactNode;
};

const MIN_FILES = 5;
const MAX_FILES = 10;
const MAX_IMAGE_BYTES = 16 * 1024 * 1024;

export function PortfolioUploadField({
  isRu,
  isUk,
  value,
  onChange,
  error,
}: PortfolioUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const t = React.useCallback(
    (en: string, _ru: string, _uk: string) => en,
    [],
  );

  const handleFiles = React.useCallback(
    async (fileList?: FileList | File[] | null) => {
      if (!fileList?.length) return;

      const files = Array.from(fileList).filter((file) => isImageLikeFile(file));
      if (!files.length) return;

      const availableSlots = MAX_FILES - value.length;
      const filesToUpload = files.slice(0, availableSlots);

      if (!filesToUpload.length) return;

      setIsUploading(true);
      try {
        const preparedFiles = await prepareUploadFiles(filesToUpload, { maxImageBytes: MAX_IMAGE_BYTES });
        const result = await uploadFiles("portfolioUploader", { files: preparedFiles });
        const uploadedUrls = result
          .map((item) => item.serverData?.url || item.ufsUrl || item.url)
          .filter((item): item is string => Boolean(item));

        onChange([...value, ...uploadedUrls].slice(0, MAX_FILES));
      } catch (error) {
        console.error("Failed to upload portfolio images", error);
        toast.error(error instanceof Error ? error.message : "Failed to upload portfolio images.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, value],
  );

  const removeImage = (url: string) => {
    onChange(value.filter((item) => item !== url));
  };

  return (
    <div className="space-y-4 md:col-span-2">
      <div className="space-y-2">
        <label className="field-label">
          {t(
            "Portfolio / example work images",
            "Фото примеров и работ",
            "Фото прикладів і робіт",
          )}{" "}
          *
        </label>
        <p className="text-sm text-slate-500">
          {t(
            "Upload at least 5 and up to 10 images that show the quality and style of your work.",
            "Загрузите минимум 5 и максимум 10 изображений, которые показывают качество и стиль вашей работы.",
            "Завантажте щонайменше 5 і максимум 10 зображень, які показують якість і стиль вашої роботи.",
          )}
        </p>
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
          multiple
          accept="image/*,.heic,.heif,image/heic,image/heif"
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
            <p className="text-sm font-semibold text-slate-700">
              {t(
                "Drag images here or choose files",
                "Перетащите изображения сюда или выберите файлы",
                "Перетягніть зображення сюди або виберіть файли",
              )}
            </p>
            <p className="text-xs text-slate-400">
              {t(
                "JPG, PNG, WEBP. Up to 10 files, max 16MB each.",
                "JPG, PNG, WEBP. Всего до 10 файлов.",
                "JPG, PNG, WEBP. Усього до 10 файлів.",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || value.length >= MAX_FILES}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            {value.length >= MAX_FILES
              ? t("Limit reached", "Лимит достигнут", "Ліміт досягнуто")
              : t("Choose images", "Выбрать изображения", "Обрати зображення")}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[20px] bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span>
          {t("Uploaded", "Загружено", "Завантажено")}: {value.length}/{MAX_FILES}
        </span>
        <span>
          {t("Minimum", "Минимум", "Мінімум")}: {MIN_FILES}
        </span>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white">
              <ImageWithFallback src={url} alt={`Portfolio image ${index + 1}`} className="aspect-square h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
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
