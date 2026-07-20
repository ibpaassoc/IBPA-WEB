"use client";

import { genUploader } from "uploadthing/client";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
  package: "@uploadthing/react",
});

export type AdminUploadedFile = {
  url: string;
  key: string | null;
  name: string;
  type: string;
};

export async function uploadAdminContentImage(file: File): Promise<AdminUploadedFile> {
  const [result] = await uploadFiles("contentImageUploader", { files: [file] });
  const uploaded = result as
    | {
        ufsUrl?: string;
        url?: string;
        key?: string;
        name?: string;
        type?: string;
        serverData?: { url?: string };
      }
    | undefined;
  const url = uploaded?.serverData?.url || uploaded?.ufsUrl || uploaded?.url;

  if (!url) {
    throw new Error("Upload completed, but no file URL was returned.");
  }

  return {
    url,
    key: uploaded?.key || null,
    name: uploaded?.name || file.name,
    type: uploaded?.type || file.type,
  };
}
