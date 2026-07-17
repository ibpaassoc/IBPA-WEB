"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  getContentImageAspect,
  resolveContentImage,
  type ContentImageMetadata,
} from "@/lib/content-image";
import { PreservedText } from "./PreservedText";
import { ContentImage } from "./ContentImage";
import { useI18n } from "@/lib/i18n";

type ImageLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metadata?: ContentImageMetadata | null;
  legacyUrl?: string | null;
  legacyAspect?: number | null;
  alt: string;
  caption?: string | null;
  closeLabel?: string;
  loadingLabel?: string;
  errorLabel?: string;
};

export function isLightboxCloseKey(key: string) {
  return key === "Escape";
}

export function ImageLightbox({
  open,
  onOpenChange,
  metadata,
  legacyUrl,
  legacyAspect,
  alt,
  caption,
  closeLabel,
  loadingLabel,
  errorLabel,
}: ImageLightboxProps) {
  const { t } = useI18n();
  const image = resolveContentImage({ metadata, legacyUrl, legacyAspect, alt });
  const aspect = image ? getContentImageAspect(image) : 16 / 9;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={closeLabel || t.contentImages.closeViewer}
        className="max-h-[96dvh] max-w-[96vw] overflow-y-auto rounded-[28px] border border-white/80 bg-white p-3 shadow-[0_30px_90px_rgba(15,46,83,0.28)] sm:p-4"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">{caption || alt}</DialogDescription>
        <div
          className="mx-auto w-full overflow-hidden rounded-[20px] bg-[#EEF6FF]"
          style={{ width: `min(92vw, ${aspect * 84}dvh)` }}
        >
          <ContentImage
            alt={alt}
            errorLabel={errorLabel}
            imageClassName="max-h-[84dvh]"
            legacyAspect={legacyAspect}
            legacyUrl={legacyUrl}
            loadingLabel={loadingLabel}
            metadata={metadata}
            priority
            sizes="92vw"
          />
        </div>
        {caption ? (
          <PreservedText className="px-2 pb-1 text-sm leading-6 text-[#55708D]">
            {caption}
          </PreservedText>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
