"use client";
import React, { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { isOptimizableRemoteUrl } from "@/lib/optimized-image";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

type ImageWithFallbackProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "width" | "height" | "loading"
> & {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  quality?: number;
};

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);
  const handleError = () => {
    setDidError(true);
  };

  const {
    src,
    alt,
    style,
    className,
    width,
    height,
    sizes,
    priority,
    quality,
    ...rest
  } = props;

  const isRemoteSrc = typeof src === "string" && /^https?:\/\//i.test(src);
  // Remote images from allowlisted hosts (member uploads on utfs.io etc.) go
  // through the Next.js optimizer so the browser gets a scaled AVIF/WebP
  // rendition instead of the original multi-MB upload.
  const isOptimizableRemote = isRemoteSrc && isOptimizableRemoteUrl(src!);

  const imageProps: Partial<ImageProps> =
    width && height
      ? { width, height }
      : {
          width: 1600,
          height: 1200,
        };

  if (!src || didError) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`}
        style={style}
      >
        <div className="flex h-full w-full items-center justify-center">
          <Image
            src={ERROR_IMG_SRC}
            alt="Error loading image"
            width={88}
            height={88}
            unoptimized
          />
        </div>
      </div>
    );
  }

  if (isRemoteSrc && !isOptimizableRemote) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={handleError}
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      sizes={sizes ?? "100vw"}
      priority={priority}
      quality={quality}
      {...imageProps}
      {...(rest as Omit<ImageProps, "src" | "alt" | "width" | "height">)}
    />
  );
}
