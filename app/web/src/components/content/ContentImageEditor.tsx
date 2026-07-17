"use client";

import { ImagePlus, Loader2, Minus, RotateCcw, Trash2, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";

import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadAdminContentImage } from "@/lib/admin-content-upload";
import {
  contentImageAspects,
  getContentImageAspect,
  getContentImageAspectValue,
  resolveContentImage,
  type ContentImageAspect,
  type ContentImageMetadata,
  type NormalizedImageCrop,
} from "@/lib/content-image";
import { cn } from "@/lib/utils";
import { InteractiveContentImage } from "./InteractiveContentImage";

const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ContentImageEditorLabels = {
  uploadImage: string;
  changeImage: string;
  removeImage: string;
  crop: string;
  zoom: string;
  aspectRatio: string;
  original: string;
  reset: string;
  apply: string;
  cancel: string;
  preview: string;
  cardPreview: string;
  viewerPreview: string;
  openFullImage: string;
  closeViewer: string;
  imageUploadFailed: string;
  unsupportedFormat: string;
  fileTooLarge: string;
  processing: string;
  uploadComplete: string;
  unsavedChanges: string;
  loadingImage: string;
  imageLoadFailed: string;
  helperText: string;
};

export const defaultContentImageEditorLabels: ContentImageEditorLabels = {
  uploadImage: "Upload image",
  changeImage: "Change image",
  removeImage: "Remove image",
  crop: "Crop",
  zoom: "Zoom",
  aspectRatio: "Aspect ratio",
  original: "Original",
  reset: "Reset",
  apply: "Apply",
  cancel: "Cancel",
  preview: "Preview",
  cardPreview: "Card preview",
  viewerPreview: "Large image preview",
  openFullImage: "Open full image",
  closeViewer: "Close image viewer",
  imageUploadFailed: "Image upload failed.",
  unsupportedFormat: "Unsupported image format.",
  fileTooLarge: "The image is larger than 16 MB.",
  processing: "Uploading image…",
  uploadComplete: "Image ready to save.",
  unsavedChanges: "Apply or cancel the current image adjustments first.",
  loadingImage: "Loading image",
  imageLoadFailed: "Image could not be loaded",
  helperText: "JPG, PNG, or WEBP up to 16 MB. Adjust locally before uploading.",
};

type ContentImageEditorProps = {
  value?: ContentImageMetadata | null;
  legacyUrl?: string | null;
  legacyAspect?: number | null;
  alt: string;
  labels?: ContentImageEditorLabels;
  onChange: (value: ContentImageMetadata | null, legacyAspect: number | null) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onError?: (message: string) => void;
  className?: string;
};

function percentCropToNormalized(area: Area): NormalizedImageCrop {
  return {
    x: area.x / 100,
    y: area.y / 100,
    width: area.width / 100,
    height: area.height / 100,
  };
}

function normalizedCropToPercent(crop?: NormalizedImageCrop | null) {
  if (!crop) return undefined;
  return {
    x: crop.x * 100,
    y: crop.y * 100,
    width: crop.width * 100,
    height: crop.height * 100,
  };
}

async function getFileDimensions(file: File) {
  const bitmap = await createImageBitmap(file);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensions;
}

export function ContentImageEditor({
  value,
  legacyUrl,
  legacyAspect,
  alt,
  labels = defaultContentImageEditorLabels,
  onChange,
  onDirtyChange,
  onError,
  className,
}: ContentImageEditorProps) {
  const resolved = useMemo(
    () => resolveContentImage({ metadata: value, legacyUrl, legacyAspect, alt }),
    [alt, legacyAspect, legacyUrl, value],
  );
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: resolved?.originalWidth || 0,
    height: resolved?.originalHeight || 0,
  });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState<NormalizedImageCrop | null>(resolved?.crop || null);
  const [zoom, setZoom] = useState(value?.zoom || 1);
  const [aspect, setAspect] = useState<ContentImageAspect>(resolved?.aspect || "original");
  const [dirty, setDirty] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = localUrl || resolved?.url || null;
  const originalAspect =
    dimensions.width > 0 && dimensions.height > 0
      ? dimensions.width / dimensions.height
      : legacyAspect || 16 / 9;
  const cropperAspect = getContentImageAspectValue(aspect, originalAspect);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [localUrl]);

  const reportError = useCallback(
    (nextError: string) => {
      setError(nextError);
      setMessage(null);
      onError?.(nextError);
    },
    [onError],
  );

  const resetAdjustments = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect("original");
    setCropArea(null);
    setDirty(true);
    setError(null);
    setMessage(null);
  }, []);

  const cancelAdjustments = useCallback(() => {
    setFile(null);
    setLocalUrl(null);
    setDimensions({
      width: resolved?.originalWidth || 0,
      height: resolved?.originalHeight || 0,
    });
    setCrop({ x: 0, y: 0 });
    setCropArea(resolved?.crop || null);
    setZoom(value?.zoom || 1);
    setAspect(resolved?.aspect || "original");
    setDirty(false);
    setError(null);
    setMessage(null);
  }, [resolved, value?.zoom]);

  const handleFileSelected = useCallback(
    async (nextFile: File) => {
      if (dirty && !window.confirm(labels.unsavedChanges)) return;

      const extensionSupported = /\.(jpe?g|png|webp)$/i.test(nextFile.name);
      if (!SUPPORTED_IMAGE_TYPES.has(nextFile.type) && !extensionSupported) {
        reportError(labels.unsupportedFormat);
        return;
      }
      if (nextFile.size > MAX_IMAGE_BYTES) {
        reportError(labels.fileTooLarge);
        return;
      }

      try {
        const nextDimensions = await getFileDimensions(nextFile);
        const nextUrl = URL.createObjectURL(nextFile);
        setFile(nextFile);
        setLocalUrl(nextUrl);
        setDimensions(nextDimensions);
        setCrop({ x: 0, y: 0 });
        setCropArea(null);
        setZoom(1);
        setAspect("original");
        setDirty(true);
        setError(null);
        setMessage(null);
      } catch {
        reportError(labels.unsupportedFormat);
      }
    },
    [dirty, labels, reportError],
  );

  const draftMetadata = useMemo<ContentImageMetadata | null>(() => {
    if (!previewUrl) return null;
    const activeCrop = cropArea || resolved?.crop || null;
    return {
      ...value,
      url: previewUrl,
      originalWidth: dimensions.width || resolved?.originalWidth || null,
      originalHeight: dimensions.height || resolved?.originalHeight || null,
      aspect,
      crop: activeCrop,
      zoom,
      focalPoint: activeCrop
        ? {
            x: activeCrop.x + activeCrop.width / 2,
            y: activeCrop.y + activeCrop.height / 2,
          }
        : { x: 0.5, y: 0.5 },
      alt,
      version: value?.version || 1,
    };
  }, [alt, aspect, cropArea, dimensions, previewUrl, resolved, value, zoom]);

  const applyAdjustments = useCallback(async () => {
    if (!draftMetadata) return;
    setIsUploading(true);
    setError(null);
    setMessage(labels.processing);

    try {
      const uploaded = file ? await uploadAdminContentImage(file) : null;
      const nextMetadata: ContentImageMetadata = {
        ...draftMetadata,
        url: uploaded?.url || draftMetadata.url,
        key: uploaded?.key ?? draftMetadata.key ?? null,
      };
      const nextResolved = resolveContentImage({ metadata: nextMetadata, alt });
      onChange(
        nextMetadata,
        nextResolved ? getContentImageAspect(nextResolved) : legacyAspect || null,
      );
      setFile(null);
      setLocalUrl(null);
      setDirty(false);
      setMessage(labels.uploadComplete);
    } catch (uploadError) {
      reportError(
        uploadError instanceof Error && uploadError.message
          ? `${labels.imageUploadFailed} ${uploadError.message}`
          : labels.imageUploadFailed,
      );
    } finally {
      setIsUploading(false);
    }
  }, [alt, draftMetadata, file, labels, legacyAspect, onChange, reportError]);

  const removeImage = useCallback(() => {
    if (dirty && !window.confirm(labels.unsavedChanges)) return;
    setFile(null);
    setLocalUrl(null);
    setCropArea(null);
    setDirty(false);
    setError(null);
    setMessage(null);
    onChange(null, null);
  }, [dirty, labels.unsavedChanges, onChange]);

  const handleMediaLoaded = useCallback((media: MediaSize) => {
    setDimensions({ width: media.naturalWidth, height: media.naturalHeight });
  }, []);

  return (
    <section
      className={cn(
        "space-y-5 rounded-[24px] border border-[#D7E5F4] bg-[#F8FBFF] p-4 sm:p-5",
        className,
      )}
      aria-label={labels.crop}
    >
      <AdminUploadZone
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        buttonText={previewUrl ? labels.changeImage : labels.uploadImage}
        endpoint="contentImageUploader"
        helperText={labels.helperText}
        label={previewUrl ? labels.changeImage : labels.uploadImage}
        onError={reportError}
        onFileSelected={(nextFile) => void handleFileSelected(nextFile)}
        onUploaded={() => undefined}
      />

      {previewUrl ? (
        <>
          <div className="relative h-[min(48dvh,380px)] min-h-72 overflow-hidden rounded-[20px] bg-[#10203B]">
            <Cropper
              key={previewUrl}
              aspect={cropperAspect}
              crop={crop}
              image={previewUrl}
              initialCroppedAreaPercentages={
                file ? undefined : normalizedCropToPercent(resolved?.crop)
              }
              keyboardStep={4}
              maxZoom={4}
              minZoom={1}
              onCropChange={setCrop}
              onCropComplete={(area) => setCropArea(percentCropToNormalized(area))}
              onInteractionEnd={() => setDirty(true)}
              onMediaLoaded={handleMediaLoaded}
              onZoomChange={setZoom}
              showGrid
              zoom={zoom}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#55708D]" htmlFor="content-image-zoom">
                {labels.zoom}
              </label>
              <span className="text-xs tabular-nums text-[#6C7F95]">{zoom.toFixed(2)}×</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                aria-label={`${labels.zoom} -`}
                className="size-9 rounded-full"
                onClick={() => {
                  setZoom((current) => Math.max(1, Number((current - 0.1).toFixed(2))));
                  setDirty(true);
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <Minus className="size-4" />
              </Button>
              <Input
                id="content-image-zoom"
                aria-label={labels.zoom}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full border-0 bg-[#D7E5F4] p-0 accent-[#1F5D8F]"
                max={4}
                min={1}
                onChange={(event) => {
                  setZoom(Number(event.target.value));
                  setDirty(true);
                }}
                step={0.01}
                type="range"
                value={zoom}
              />
              <Button
                aria-label={`${labels.zoom} +`}
                className="size-9 rounded-full"
                onClick={() => {
                  setZoom((current) => Math.min(4, Number((current + 0.1).toFixed(2))));
                  setDirty(true);
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <ZoomIn className="size-4" />
              </Button>
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[#55708D]">
              {labels.aspectRatio}
            </legend>
            <div className="flex flex-wrap gap-2">
              {contentImageAspects.map((option) => (
                <button
                  key={option}
                  aria-pressed={aspect === option}
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#72A0C1]/35",
                    aspect === option
                      ? "border-[#1F5D8F] bg-[#1F5D8F] text-white"
                      : "border-[#D7E5F4] bg-white text-[#55708D] hover:border-[#72A0C1]",
                  )}
                  onClick={() => {
                    setAspect(option);
                    setDirty(true);
                  }}
                  type="button"
                >
                  {option === "original" ? labels.original : option}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <Button onClick={resetAdjustments} type="button" variant="outline">
              <RotateCcw data-icon="inline-start" />
              {labels.reset}
            </Button>
            <Button onClick={cancelAdjustments} type="button" variant="outline">
              {labels.cancel}
            </Button>
            <Button
              className="bg-[#1F5D8F] text-white hover:bg-[#17496F]"
              disabled={isUploading || !dirty}
              onClick={() => void applyAdjustments()}
              type="button"
            >
              {isUploading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ImagePlus data-icon="inline-start" />}
              {labels.apply}
            </Button>
            <Button
              className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              disabled={isUploading}
              onClick={removeImage}
              type="button"
              variant="ghost"
            >
              <Trash2 data-icon="inline-start" />
              {labels.removeImage}
            </Button>
          </div>

          <div aria-live="polite" className="min-h-5 text-sm">
            {error ? <p className="text-rose-700">{error}</p> : null}
            {!error && message ? <p className="text-[#1F5D8F]">{message}</p> : null}
          </div>

          {draftMetadata ? (
            <div className="space-y-3 border-t border-[#D7E5F4] pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#55708D]">
                {labels.preview}
              </p>
              <div className="grid items-start gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs text-[#6C7F95]">{labels.cardPreview}</p>
                  <InteractiveContentImage
                    alt={alt}
                    className="rounded-[18px]"
                    closeLabel={labels.closeViewer}
                    errorLabel={labels.imageLoadFailed}
                    loadingLabel={labels.loadingImage}
                    metadata={draftMetadata}
                    openLabel={labels.openFullImage}
                    sizes="(min-width: 768px) 340px, 100vw"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-[#6C7F95]">{labels.viewerPreview}</p>
                  <InteractiveContentImage
                    alt={alt}
                    className="rounded-[18px]"
                    closeLabel={labels.closeViewer}
                    errorLabel={labels.imageLoadFailed}
                    loadingLabel={labels.loadingImage}
                    metadata={draftMetadata}
                    openLabel={labels.openFullImage}
                    sizes="(min-width: 768px) 340px, 100vw"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
