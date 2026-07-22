"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminUploadZone } from "@/components/admin/AdminUploadZone";
import { Button } from "@/components/ui/button";

import { formatAdminDate } from "../../shared/utils/admin-formatters";
import {
  createAdminCertificate,
  deleteAdminCertificate,
  listAdminCertificates,
  replaceAdminCertificateFile,
  type AdminCertificateFilePayload,
} from "../server/admin-certificates.repository";
import type { AdminCertificateRecord } from "../types/members-admin.types";

type Props = {
  orderId: string;
};

function toFilePayload(
  url: string,
  metadata?: { fileName?: string; fileKey?: string | null; fileType?: string },
): AdminCertificateFilePayload {
  return {
    fileUrl: url,
    fileKey: metadata?.fileKey ?? null,
    fileName: metadata?.fileName ?? null,
    fileType: metadata?.fileType ?? null,
  };
}

export function AdminAdditionalCertificates({ orderId }: Props) {
  const [items, setItems] = useState<AdminCertificateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Guards against a second create request being kicked off while one is in
  // flight (e.g. a fast drag-drop after clicking upload).
  const createInFlightRef = useRef(false);
  const titleRef = useRef("");

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);

    listAdminCertificates(orderId)
      .then((next) => {
        if (active) setItems(next);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load additional certificates.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  const hasTitle = title.trim().length > 0;

  const handleCreate = async (
    url: string,
    metadata?: { fileName?: string; fileKey?: string | null; fileType?: string },
  ) => {
    const normalizedTitle = titleRef.current.trim();
    if (!normalizedTitle) {
      toast.error("Enter a certificate title before uploading.");
      return;
    }
    if (createInFlightRef.current) return;

    createInFlightRef.current = true;
    setIsCreating(true);
    try {
      const response = await createAdminCertificate(orderId, {
        title: normalizedTitle,
        ...toFilePayload(url, metadata),
      });
      if (response.item) {
        setItems((prev) => [response.item as AdminCertificateRecord, ...prev]);
      }
      setTitle("");
      toast.success("Additional certificate added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the certificate.");
    } finally {
      createInFlightRef.current = false;
      setIsCreating(false);
    }
  };

  const handleReplace = async (
    certificateId: string,
    url: string,
    metadata?: { fileName?: string; fileKey?: string | null; fileType?: string },
  ) => {
    if (replacingId) return;
    setReplacingId(certificateId);
    try {
      const response = await replaceAdminCertificateFile(
        orderId,
        certificateId,
        toFilePayload(url, metadata),
      );
      if (response.item) {
        setItems((prev) =>
          prev.map((item) => (item.id === certificateId ? (response.item as AdminCertificateRecord) : item)),
        );
      }
      toast.success("Certificate file replaced.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not replace the certificate file.");
    } finally {
      setReplacingId(null);
    }
  };

  const handleDelete = async (certificateId: string) => {
    if (deletingId) return;
    if (!window.confirm("Delete this additional certificate? This cannot be undone.")) return;

    setDeletingId(certificateId);
    try {
      await deleteAdminCertificate(orderId, certificateId);
      setItems((prev) => prev.filter((item) => item.id !== certificateId));
      toast.success("Certificate deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the certificate.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
            Additional certificates
          </p>
          <p className="mt-1 text-sm text-[#6C7F95]">
            Upload extra PDF certificates for this applicant. They appear in the member&apos;s
            &ldquo;My Certificates&rdquo; area, separate from the membership certificate.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#D7E5F4] bg-white px-3 py-1 text-xs font-semibold text-[#1F5D8F]">
          {items.length}
        </span>
      </div>

      {/* Create */}
      <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-[#DCE7F5] bg-white p-4">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6C7F95]">
            Certificate title
          </span>
          <input
            className="mt-2 h-10 w-full rounded-2xl border border-[#D7E5F4] bg-[#F8FBFF] px-3 text-sm text-[#10203B] outline-none transition focus:border-[#72A0C1] focus:bg-white"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Advanced Certification 2026"
            value={title}
          />
        </label>

        <div
          className={
            hasTitle && !isCreating ? "" : "pointer-events-none opacity-55"
          }
        >
          <AdminUploadZone
            accept=".pdf,application/pdf"
            buttonText={isCreating ? "Saving…" : "Upload PDF"}
            endpoint="certificateUploader"
            helperText={hasTitle ? "Signed PDF only." : "Enter a title first."}
            label="Add certificate"
            onError={(message) => toast.error(message)}
            onUploaded={(url, metadata) => {
              void handleCreate(url, metadata);
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#6C7F95]">
            <Loader2 className="size-4 animate-spin" />
            Loading certificates…
          </div>
        ) : loadError ? (
          <p className="rounded-[16px] border border-[#F2C7C7] bg-[#FFF5F5] p-3 text-sm text-[#B42318]">
            {loadError}
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-[#D7E5F4] bg-white p-4 text-center text-sm text-[#6C7F95]">
            No additional certificates uploaded yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li
                className="rounded-[18px] border border-[#DCE7F5] bg-white p-4"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF6FF] text-[#1F5D8F]">
                      <FileText className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#10203B]">{item.title}</p>
                      <p className="mt-0.5 text-xs text-[#6C7F95]">
                        Added {formatAdminDate(item.createdAt)}
                        {item.issuedAt ? ` · Issued ${formatAdminDate(item.issuedAt)}` : ""}
                      </p>
                      {item.fileName ? (
                        <p className="mt-0.5 truncate text-xs text-[#8AA2BD]">{item.fileName}</p>
                      ) : null}
                    </div>
                  </div>

                  <Button
                    className="size-9 shrink-0 rounded-full"
                    disabled={deletingId === item.id}
                    onClick={() => void handleDelete(item.id)}
                    size="icon"
                    type="button"
                    variant="destructive"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#D7E5F4] bg-white px-3 py-2 text-xs font-semibold text-[#1F5D8F] transition-colors hover:bg-[#EEF6FF]"
                    href={item.fileUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="size-4" />
                    View PDF
                  </a>
                  <div className={replacingId === item.id ? "pointer-events-none opacity-55" : ""}>
                    <AdminUploadZone
                      accept=".pdf,application/pdf"
                      buttonText={replacingId === item.id ? "Replacing…" : "Replace PDF"}
                      endpoint="certificateUploader"
                      helperText="Signed PDF only."
                      label="Replace file"
                      onError={(message) => toast.error(message)}
                      onUploaded={(url, metadata) => {
                        void handleReplace(item.id, url, metadata);
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
