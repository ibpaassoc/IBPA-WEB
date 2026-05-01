"use client";

import React from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Loader2, RotateCcw, X } from "lucide-react";

type AspectOption = {
  label: string;
  value: number | null;
};

const ASPECT_OPTIONS: AspectOption[] = [
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
  { label: "Free", value: null },
];

type ImageCropperModalProps = {
  file: File;
  defaultAspect?: number | null;
  onApply: (file: File, aspect: number) => void;
  onCancel: () => void;
};

function createImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.setAttribute("crossOrigin", "anonymous");
    image.src = src;
  });
}

async function getCroppedImage(file: File, imageSrc: string, croppedAreaPixels: Area, rotation: number) {
  const image = await createImage(imageSrc);
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = image.naturalWidth * cos + image.naturalHeight * sin;
  const rotatedHeight = image.naturalWidth * sin + image.naturalHeight * cos;

  const rotatedCanvas = document.createElement("canvas");
  const rotatedContext = rotatedCanvas.getContext("2d");

  if (!rotatedContext) {
    throw new Error("Could not prepare image crop.");
  }

  rotatedCanvas.width = rotatedWidth;
  rotatedCanvas.height = rotatedHeight;
  rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotatedContext.rotate(radians);
  rotatedContext.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);
  rotatedContext.drawImage(image, 0, 0);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image crop.");
  }

  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  context.drawImage(
    rotatedCanvas,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not crop image."));
          return;
        }

        const extension = file.type === "image/png" ? "png" : "jpg";
        const name = file.name.replace(/\.[^.]+$/, "");
        resolve(new File([blob], `${name}-cover.${extension}`, { type: blob.type || file.type }));
      },
      file.type === "image/png" ? "image/png" : "image/jpeg",
      0.92,
    );
  });
}

export function ImageCropperModal({ file, defaultAspect = 16 / 9, onApply, onCancel }: ImageCropperModalProps) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const [selectedAspect, setSelectedAspect] = React.useState<number | null>(defaultAspect ?? 16 / 9);
  const [freeAspect, setFreeAspect] = React.useState(defaultAspect ?? 16 / 9);
  const [isApplying, setIsApplying] = React.useState(false);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setFreeAspect(image.naturalWidth / image.naturalHeight);
      }
    };
    image.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleCropComplete = React.useCallback((_croppedArea: Area, nextCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(nextCroppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return;
    }

    setIsApplying(true);
    try {
      const croppedFile = await getCroppedImage(file, imageSrc, croppedAreaPixels, rotation);
      const aspect = selectedAspect ?? croppedAreaPixels.width / croppedAreaPixels.height;
      onApply(croppedFile, aspect);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#72A0C1]">Cover Crop</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Choose framing and aspect ratio</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 p-3 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
            aria-label="Close cropper"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
          <div className="relative h-[420px] bg-slate-950">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={selectedAspect ?? freeAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={handleCropComplete}
                showGrid
              />
            )}
          </div>

          <div className="space-y-5 border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Aspect Ratio</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {ASPECT_OPTIONS.map((option) => {
                  const isSelected = option.value === selectedAspect;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setSelectedAspect(option.value)}
                      className={`rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
                        isSelected ? "border-black bg-black text-white" : "border-slate-200 bg-white text-slate-500 hover:border-[#72A0C1] hover:text-[#72A0C1]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {selectedAspect === null && (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Free Shape</label>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      {freeAspect.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.35}
                    max={3}
                    step={0.01}
                    value={freeAspect}
                    onChange={(event) => setFreeAspect(Number(event.target.value))}
                    className="mt-3 w-full accent-[#72A0C1]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="mt-3 w-full accent-[#72A0C1]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Rotate</label>
              <div className="mt-3 flex gap-2">
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(event) => setRotation(Number(event.target.value))}
                  className="w-full accent-[#72A0C1]"
                />
                <button
                  type="button"
                  onClick={() => setRotation(0)}
                  className="rounded-xl border border-slate-200 p-3 text-slate-500 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
                  aria-label="Reset rotation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying || !croppedAreaPixels}
                className="flex-1 rounded-xl bg-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#72A0C1] disabled:opacity-50"
              >
                {isApplying ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
