"use client";

import { Maximize2 } from "lucide-react";
import { useState, type MouseEvent } from "react";

import { cn } from "@/lib/utils";
import { ContentImage, type ContentImageProps } from "./ContentImage";
import { ImageLightbox } from "./ImageLightbox";

type InteractiveContentImageProps = ContentImageProps & {
  caption?: string | null;
  openLabel?: string;
  closeLabel?: string;
};

export function InteractiveContentImage({
  caption,
  openLabel = "Open full image",
  closeLabel,
  className,
  ...imageProps
}: InteractiveContentImageProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <button
        aria-label={openLabel}
        className={cn(
          "group/image relative block w-full cursor-zoom-in overflow-hidden text-left outline-none focus-visible:ring-4 focus-visible:ring-[#72A0C1]/45",
          className,
        )}
        onClick={handleOpen}
        type="button"
      >
        <ContentImage {...imageProps} />
        <span className="pointer-events-none absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#1F5D8F] shadow-sm transition-transform group-hover/image:scale-105">
          <Maximize2 aria-hidden="true" className="size-4" />
        </span>
      </button>

      <ImageLightbox
        alt={imageProps.alt}
        caption={caption}
        closeLabel={closeLabel}
        errorLabel={imageProps.errorLabel}
        legacyAspect={imageProps.legacyAspect}
        legacyUrl={imageProps.legacyUrl}
        loadingLabel={imageProps.loadingLabel}
        metadata={imageProps.metadata}
        onOpenChange={setOpen}
        open={open}
      />
    </>
  );
}
