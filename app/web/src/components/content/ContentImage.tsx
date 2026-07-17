"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useMemo, useState } from "react";

import {
  getContentImageAspect,
  getCroppedImageStyle,
  resolveContentImage,
  type ContentImageMetadata,
} from "@/lib/content-image";
import { isOptimizableRemoteUrl } from "@/lib/optimized-image";
import { cn } from "@/lib/utils";

export type ContentImageProps = {
  metadata?: ContentImageMetadata | null;
  legacyUrl?: string | null;
  legacyAspect?: number | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  loadingLabel?: string;
  errorLabel?: string;
};

export function ContentImage({
  metadata,
  legacyUrl,
  legacyAspect,
  alt,
  className,
  imageClassName,
  sizes = "100vw",
  priority = false,
  loadingLabel = "Loading image",
  errorLabel = "Image could not be loaded",
}: ContentImageProps) {
  const image = useMemo(
    () => resolveContentImage({ metadata, legacyUrl, legacyAspect, alt }),
    [alt, legacyAspect, legacyUrl, metadata],
  );
  if (!image) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center bg-[#EEF6FF] text-[#6C7F95]",
          className,
        )}
        role="img"
        aria-label={errorLabel}
      >
        <ImageOff aria-hidden="true" className="size-7" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <ContentImageAsset
      key={`${image.url}:${JSON.stringify(image.crop)}`}
      alt={alt}
      className={className}
      errorLabel={errorLabel}
      image={image}
      imageClassName={imageClassName}
      loadingLabel={loadingLabel}
      priority={priority}
      sizes={sizes}
    />
  );
}

function ContentImageAsset({
  image,
  alt,
  className,
  imageClassName,
  sizes,
  priority,
  loadingLabel,
  errorLabel,
}: Required<
  Pick<
    ContentImageProps,
    "alt" | "sizes" | "priority" | "loadingLabel" | "errorLabel"
  >
> &
  Pick<ContentImageProps, "className" | "imageClassName"> & {
    image: NonNullable<ReturnType<typeof resolveContentImage>>;
  }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  const aspect = getContentImageAspect(image);
  const cropStyle = getCroppedImageStyle(image);
  const isRemote = /^https?:\/\//i.test(image.url);
  const useNextImage = image.url.startsWith("/") || (isRemote && isOptimizableRemoteUrl(image.url));
  const baseImageClassName = cn(
    cropStyle ? "object-fill" : "h-full w-full object-cover",
    "transition-opacity duration-200",
    status === "loaded" ? "opacity-100" : "opacity-0",
    imageClassName,
  );
  const sharedProps = {
    className: baseImageClassName,
    onError: () => setStatus("error" as const),
    onLoad: () => setStatus("loaded" as const),
    style: cropStyle || undefined,
  };

  return (
    <div
      className={cn("relative w-full overflow-hidden bg-[#EEF6FF]", className)}
      style={{ aspectRatio: aspect }}
    >
      {status === "loading" ? (
        <div
          className="absolute inset-0 animate-pulse bg-[#E7F1FA]"
          role="status"
          aria-label={loadingLabel}
        />
      ) : null}

      {status === "error" ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#EEF6FF] px-4 text-center text-xs text-[#6C7F95]"
          role="img"
          aria-label={errorLabel}
        >
          <ImageOff aria-hidden="true" className="size-7" strokeWidth={1.5} />
          <span>{errorLabel}</span>
        </div>
      ) : null}

      {useNextImage ? (
        <Image
          {...sharedProps}
          alt={image.alt || alt}
          src={image.url}
          width={image.originalWidth || 1600}
          height={image.originalHeight || 1200}
          priority={priority}
          sizes={sizes}
        />
      ) : (
        // Unknown remote hosts intentionally bypass the Next.js optimizer;
        // this preserves the existing remote-domain security policy.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...sharedProps}
          alt={image.alt || alt}
          src={image.url}
          width={image.originalWidth || undefined}
          height={image.originalHeight || undefined}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
}
