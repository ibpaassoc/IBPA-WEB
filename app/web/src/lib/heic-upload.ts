const HEIC_EXTENSION_RE = /\.(heic|heif)$/i;

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

export async function prepareUploadFiles(files: File[]) {
  return Promise.all(files.map((file) => convertHeicToJpeg(file)));
}
