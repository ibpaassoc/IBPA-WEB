import { UTApi } from "uploadthing/server";

let cachedApi: UTApi | null = null;

function getUploadThingApi(): UTApi | null {
  // UTApi reads UPLOADTHING_TOKEN from the environment. When it is not
  // configured we simply skip storage cleanup rather than failing the request.
  if (!process.env.UPLOADTHING_TOKEN) {
    return null;
  }
  if (!cachedApi) {
    cachedApi = new UTApi();
  }
  return cachedApi;
}

/**
 * Best-effort removal of a file from UploadThing storage by its key.
 *
 * Storage cleanup must never fail the primary request (the database mutation
 * already succeeded), so errors are logged and swallowed.
 */
export async function deleteUploadThingFile(fileKey: unknown): Promise<void> {
  if (typeof fileKey !== "string" || !fileKey.trim()) {
    return;
  }

  const api = getUploadThingApi();
  if (!api) {
    return;
  }

  try {
    await api.deleteFiles(fileKey.trim());
  } catch (error) {
    console.error("[UploadThing] Failed to delete stored file:", error);
  }
}
