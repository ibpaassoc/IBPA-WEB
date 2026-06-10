"use client";

import { ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";

import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getPortfolioImages,
  getTrainerFileGroups,
} from "../server/application-admin.service";
import type {
  ApplicationAdditionalFile,
  MemberApplicationDetail,
} from "../types/application-admin.types";

type Props = {
  memberApplication?: MemberApplicationDetail | null;
  additionalFiles: ApplicationAdditionalFile[];
  isLoadingFiles: boolean;
  onDeleteAdditionalFile: (fileId: string) => void;
  onUploadAdditionalFile: (
    url: string,
    metadata?: { fileName?: string; fileKey?: string | null; fileType?: string },
  ) => void;
};

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|avif|heic|bmp)(\?|#|$)/i;

function fileNameOf(url: string) {
  try {
    return decodeURIComponent(url.split("/").pop() ?? url).split("?")[0];
  } catch {
    return url.split("/").pop() ?? url;
  }
}

function isImageFile(url: string) {
  return IMAGE_EXTENSIONS.test(url);
}

function RailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#D7E5F4] bg-white p-5 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
      <h3 className="mb-4 text-sm font-semibold tracking-[-0.01em] text-[#10203B]">{title}</h3>
      {children}
    </section>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[20px] border border-dashed border-[#CFE0F3] bg-[#F8FBFF] p-4 text-sm text-[#6C7F95]">
      {children}
    </p>
  );
}

export function ApplicationMediaRail({
  additionalFiles,
  isLoadingFiles,
  memberApplication,
  onDeleteAdditionalFile,
  onUploadAdditionalFile,
}: Props) {
  if (!memberApplication) {
    return (
      <EmptyHint>Media is available for member applications.</EmptyHint>
    );
  }

  const images = getPortfolioImages(memberApplication);
  const visibleImages = images.slice(0, 12);
  const hiddenImagesCount = Math.max(images.length - visibleImages.length, 0);
  const documentGroups = getTrainerFileGroups(memberApplication);

  return (
    <div className="space-y-5">
      <RailCard title="Portfolio images">
        {visibleImages.length ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {visibleImages.map((image, index) => (
                <a
                  className="group relative aspect-[4/5] overflow-hidden rounded-[18px] border border-[#D7E5F4] bg-[#EEF6FF] transition-colors hover:border-[#BFD3EA]"
                  href={image}
                  key={`${image}-${index}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <img
                    alt={fileNameOf(image)}
                    className="h-full w-full object-cover"
                    decoding="async"
                    fetchPriority={index < 3 ? "high" : "auto"}
                    loading={index < 3 ? "eager" : "lazy"}
                    src={image}
                  />

                  <span className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full border border-[#D7E5F4] bg-white text-[#1F5D8F] opacity-0 transition-opacity group-hover:opacity-100">
                    <ExternalLink className="size-3.5" />
                  </span>
                </a>
              ))}
            </div>

            {hiddenImagesCount > 0 ? (
              <p className="mt-3 rounded-2xl border border-[#D7E5F4] bg-[#F8FBFF] px-4 py-2.5 text-center text-xs font-semibold text-[#6C7F95]">
                +{hiddenImagesCount} more images available in application data
              </p>
            ) : null}
          </>
        ) : (
          <EmptyHint>No portfolio images submitted.</EmptyHint>
        )}
      </RailCard>

      <RailCard title="Documents">
        <div className="space-y-3">
          {documentGroups.map((group) =>
            group.files.length ? (
              <div className="space-y-2" key={group.title}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8AA2BD]">
                  {group.title}
                </p>

                {group.files.map((file, index) => (
                  <a
                    className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#D7E5F4] bg-[#F8FBFF] px-3 py-2 text-sm text-[#10203B] transition-colors hover:bg-white"
                    href={file}
                    key={`${file}-${index}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#1F5D8F]">
                      <FileText className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{fileNameOf(file)}</span>
                    <ExternalLink className="size-3.5 shrink-0 text-[#8AA2BD]" />
                  </a>
                ))}
              </div>
            ) : null,
          )}

          {documentGroups.every((group) => group.files.length === 0) ? (
            <EmptyHint>No trainer documents submitted.</EmptyHint>
          ) : null}
        </div>
      </RailCard>

      <RailCard title="Admin-added documents">
        {isLoadingFiles ? (
          <div className="space-y-2">
            <Skeleton className="h-11 rounded-2xl" />
            <Skeleton className="h-11 rounded-2xl" />
          </div>
        ) : additionalFiles.length ? (
          <div className="space-y-2">
            {additionalFiles.map((file) => (
              <div
                className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#D7E5F4] bg-[#F8FBFF] p-2"
                key={file.id}
              >
                <a
                  className="block size-10 shrink-0 overflow-hidden rounded-xl border border-[#D7E5F4] bg-[#EEF6FF]"
                  href={file.fileUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {isImageFile(file.fileUrl) ? (
                    <img
                      alt={file.fileName}
                      className="h-full w-full object-cover"
                      decoding="async"
                      loading="lazy"
                      src={file.fileUrl}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[#1F5D8F]">
                      <FileText className="size-4" />
                    </span>
                  )}
                </a>

                <a
                  className="min-w-0 flex-1 truncate text-sm font-medium text-[#10203B]"
                  href={file.fileUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {file.fileName}
                </a>

                <Button
                  className="h-8 rounded-xl px-3 text-xs text-[#B42318] hover:bg-[#FFF5F5] hover:text-[#8B1A12]"
                  onClick={() => onDeleteAdditionalFile(file.id)}
                  type="button"
                  variant="ghost"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint>No admin-added documents yet.</EmptyHint>
        )}

        <div className="mt-4">
          <AdminUploadZone
            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            buttonText="Choose files"
            endpoint="applicationAdditionalFileUploader"
            helperText="JPG, PNG, WEBP, PDF, DOC, DOCX."
            label="Upload supporting documents"
            multiple
            onError={(message) => toast.error(message)}
            onUploaded={onUploadAdditionalFile}
          />
        </div>
      </RailCard>
    </div>
  );
}
