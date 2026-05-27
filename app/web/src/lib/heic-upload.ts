const HEIC_EXTENSION_RE = /\.(heic|heif)$/i;
const DEFAULT_MAX_IMAGE_BYTES = 16 * 1024 * 1024; // 16MB

export function isHeicFile(file: File) {
  const type = file.type.toLowerCase();
  return type === "image/heic" || type === "image/heif" || HEIC_EXTENSION_RE.test(file.name);
}

export function isImageLikeFile(file: File) {
  return file.type.startsWith("image/") || isHeicFile(file);
}

export function withHeicAccept(accept: string) {
  if (!accept || accept.includes(".heic") || accept.includes("image/heic")) {
    return accept;
  }

  if (accept.includes("image/*") || accept.includes("image/")) {
    return `${accept},.heic,.heif,image/heic,image/heif`;
  }

  return accept;
}

export async function convertHeicToJpeg(file: File) {
  if (!isHeicFile(file)) return file;

  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;
  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg") || `${file.name}.jpg`;

  return new File([blob], newName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

async function loadImage(file: File) {
  const dataUrl = await fileToDataUrl(file);
  const image = new Image();
  image.decoding = "async";
  image.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to decode image"));
  });
  return image;
}

async function canvasToJpegFile(canvas: HTMLCanvasElement, name: string, quality: number) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (!nextBlob) {
        reject(new Error("Failed to encode resized image"));
        return;
      }
      resolve(nextBlob);
    }, "image/jpeg", quality);
  });

  const normalizedName = name.replace(/\.[^.]+$/, "") || "upload";
  return new File([blob], `${normalizedName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function normalizeLargeImage(file: File, maxBytes: number) {
  if (!isImageLikeFile(file) || file.size <= maxBytes) {
    return file;
  }

  const image = await loadImage(file);
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  const MAX_DIMENSION = 4096;
  if (Math.max(width, height) > MAX_DIMENSION) {
    const ratio = MAX_DIMENSION / Math.max(width, height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  const qualitySteps = [0.9, 0.82, 0.74, 0.66, 0.58];
  let candidate: File | null = null;

  for (const quality of qualitySteps) {
    candidate = await canvasToJpegFile(canvas, file.name, quality);
    if (candidate.size <= maxBytes) {
      return candidate;
    }
  }

  // If quality drops are not enough, progressively downscale.
  for (let scaleStep = 0; scaleStep < 3; scaleStep += 1) {
    width = Math.max(1, Math.round(width * 0.82));
    height = Math.max(1, Math.round(height * 0.82));
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    candidate = await canvasToJpegFile(canvas, file.name, 0.68);
    if (candidate.size <= maxBytes) {
      return candidate;
    }
  }

  return candidate || file;
}

export async function prepareUploadFiles(
  files: File[],
  options?: {
    maxImageBytes?: number;
  },
) {
  const maxImageBytes = options?.maxImageBytes ?? DEFAULT_MAX_IMAGE_BYTES;
  return Promise.all(
    files.map(async (file) => {
      const heicConverted = await convertHeicToJpeg(file);
      const normalized = await normalizeLargeImage(heicConverted, maxImageBytes);

      if (isImageLikeFile(normalized) && normalized.size > maxImageBytes) {
        throw new Error(`Image ${normalized.name} is too large. Please use an image under ${Math.round(maxImageBytes / (1024 * 1024))}MB.`);
      }

      return normalized;
    }),
  );
}
