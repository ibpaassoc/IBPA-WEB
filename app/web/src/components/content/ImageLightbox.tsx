"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  getContentImageAspect,
  resolveContentImage,
  isLightboxCloseKey,
  type ContentImageMetadata,
} from "@/lib/content-image";
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

export { isLightboxCloseKey };

/**
 * Image-only glassmorphic viewer: a frosted frame floating over a blurred
 * navy backdrop. Sized to roughly half the viewport on desktop and capped by
 * height, so the popup never scrolls.
 */
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
        className="w-auto max-w-none gap-0 overflow-hidden rounded-[28px] border border-white/45 bg-white/20 p-2 shadow-[0_40px_120px_rgba(15,46,83,0.45)] ring-1 ring-white/25 backdrop-blur-2xl sm:rounded-[32px] sm:p-2.5 md:p-3"
        closeClassName="right-5 top-5 z-10 rounded-full border-white/60 bg-white/30 p-2.5 text-white shadow-lg backdrop-blur-xl hover:bg-white/50 hover:text-[#10203B]"
        overlayClassName="bg-[#10203B]/45 backdrop-blur-md"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">{caption || alt}</DialogDescription>
        <div
          className="overflow-hidden rounded-[20px] bg-[#EEF6FF]/60 sm:rounded-[24px]"
          style={{ width: `min(92vw, ${aspect * 62}dvh, max(50vw, 30rem))` }}
        >
          <ContentImage
            alt={alt}
            errorLabel={errorLabel}
            legacyAspect={legacyAspect}
            legacyUrl={legacyUrl}
            loadingLabel={loadingLabel}
            metadata={metadata}
            priority
            sizes="(min-width: 1024px) 50vw, 92vw"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
