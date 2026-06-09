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
    <section className="rounded-[26px] border border-[#D9E4F2] bg-white/82 p-4 shadow-[0_16px_42px_rgba(15,35,70,0.08)]">
      <h3 className="mb-3 text-sm font-semibold text-[#10203B]">{title}</h3>
      {children}
    </section>
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
      <div className="rounded-[26px] border border-dashed border-[#D9E4F2] bg-white/70 p-5 text-sm text-[#6B7C93]">
        Media is available for member applications.
      </div>
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
                  className="group relative aspect-[4/5] overflow-hidden rounded-[20px] border border-[#D9E4F2] bg-[#EEF5FF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BDD0E8]"
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

                  <span className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-[#21466D] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    <ExternalLink className="size-3.5" />
                  </span>
                </a>
              ))}
            </div>

            {hiddenImagesCount > 0 ? (
              <p className="mt-3 rounded-2xl bg-[#F7FAFE] px-4 py-3 text-center text-xs font-semibold text-[#6B7C93]">
                +{hiddenImagesCount} more images available in application data
              </p>
            ) : null}
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-[#D9E4F2] bg-[#F7FAFE]/80 p-4 text-sm text-[#6B7C93]">
            No portfolio images submitted.
          </p>
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
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-[#D9E4F2] bg-white/80 px-3 py-2 text-sm text-[#10203B] shadow-sm transition-colors hover:bg-white"
                    href={file}
                    key={`${file}-${index}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF5FF] text-[#21466D]">
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
            <p className="rounded-2xl border border-dashed border-[#D9E4F2] bg-[#F7FAFE]/80 p-4 text-sm text-[#6B7C93]">
              No trainer documents submitted.
            </p>
          ) : null}
        </div>
      </RailCard>

      <RailCard title="Admin-added documents">
        {isLoadingFiles ? (
          <div className="space-y-2">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        ) : additionalFiles.length ? (
          <div className="space-y-2">
            {additionalFiles.map((file) => (
              <div
                className="flex min-w-0 items-center gap-2 rounded-xl border border-[#D9E4F2] bg-white/80 p-2 shadow-sm"
                key={file.id}
              >
                <a
                  className="block size-10 shrink-0 overflow-hidden rounded-lg border border-[#D9E4F2] bg-[#EEF5FF]"
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
                    <span className="flex h-full w-full items-center justify-center text-[#21466D]">
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
                  className="h-8 rounded-xl px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
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
          <p className="rounded-2xl border border-dashed border-[#D9E4F2] bg-[#F7FAFE]/80 p-4 text-sm text-[#6B7C93]">
            No admin-added documents yet.
          </p>
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
