"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

type Props = {
  open: boolean;
  imageSrc: string | null;
  aspect?: number;
  onClose: () => void;
  onApply: (file: File) => void | Promise<void>;
};

export function ImageCropperModal({
  open,
  imageSrc,
  aspect = 16 / 9,
  onClose,
  onApply,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  if (!open || !imageSrc) return null;

  async function handleApply() {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsSaving(true);

    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels, rotation);

      const file = new File([blob], `cropped-cover-${Date.now()}.webp`, {
        type: "image/webp",
      });

      await onApply(file);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-3 shadow-2xl">
        <div className="relative h-[300px] overflow-hidden rounded-xl bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">Rotate</label>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isSaving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? "Uploading..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
): Promise<Blob> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context.");
  }

  const rotRad = (rotation * Math.PI) / 180;

  const safeArea = Math.max(image.width, image.height) * 2;

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    safeArea / 2 - image.width / 2 + pixelCrop.x,
    safeArea / 2 - image.height / 2 + pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(data, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      0.92,
    );
  });
}
