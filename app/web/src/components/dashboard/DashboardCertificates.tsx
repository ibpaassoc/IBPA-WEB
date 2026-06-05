"use client";

import { useRef, useState } from "react";
import {
  Award,
  CalendarDays,
  Download,
  FileBadge2,
  FileImage,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { genUploader } from "uploadthing/client";
import { toast } from "sonner";

import type {
  Certificate,
  ExternalCertificate,
} from "@/components/dashboard/dashboard-types";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { StatusPill } from "@/shared/components/DashboardShared";
import { formatStatusLabel } from "@/lib/dashboard-cabinet";

const { uploadFiles } = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
  package: "@uploadthing/react",
});

const shellCardClassName =
  "rounded-[32px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_22px_60px_rgba(11,31,68,0.09)]";

function formatDate(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFileIcon(fileUrl: string) {
  const normalized = fileUrl.toLowerCase();

  if (
    normalized.includes(".png") ||
    normalized.includes(".jpg") ||
    normalized.includes(".jpeg") ||
    normalized.includes(".webp") ||
    normalized.includes(".gif")
  ) {
    return <FileImage className="h-4 w-4" />;
  }

  if (normalized.includes(".pdf")) {
    return <FileBadge2 className="h-4 w-4" />;
  }

  return <FileText className="h-4 w-4" />;
}

function CertificatePreview({
  cert,
  fullName,
  membershipExpiresDisplay,
}: {
  cert: Certificate;
  fullName: string;
  membershipExpiresDisplay: string;
}) {
  const issuedDate = formatDate(cert.createdAt) || "Pending";
  const validThrough = formatDate(cert.expiresAt) || membershipExpiresDisplay;
  const isVerified = cert.status === "paid";

  return (
    <article className="overflow-hidden rounded-[34px] border border-[#D4E0F0] bg-white shadow-[0_24px_70px_rgba(11,31,68,0.11)]">
      <div className="bg-[radial-gradient(circle_at_18%_0%,rgba(114,160,193,0.38),transparent_34%),linear-gradient(135deg,#10203B_0%,#21466D_100%)] p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <Award className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/65">
                Official IBPA
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                IBPA Certificate
              </h2>
              <p className="mt-1 text-sm text-white/70">
                {cert.orderName || fullName}
              </p>
            </div>
          </div>

          <StatusPill
            label={
              isVerified ? "Verified" : formatStatusLabel(cert.status, "Pending")
            }
            tone={
              isVerified
                ? "verified"
                : cert.status === "approved"
                  ? "active"
                  : "pending"
            }
          />
        </div>
      </div>

      <div className="p-5">
        <div className="rounded-[24px] border border-[#DCE7F4] bg-[#F8FBFF] p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Certificate ID
          </p>
          <p className="mt-2 break-all font-mono text-xs font-semibold leading-5 text-[#10203B]">
            {cert.certNumber}
          </p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-[#DCE7F4] bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]">
                Issued
              </p>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#10203B]">
              {issuedDate}
            </p>
          </div>

          <div className="rounded-[22px] border border-[#DCE7F4] bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]">
                Valid through
              </p>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#10203B]">
              {validThrough}
            </p>
          </div>
        </div>

        <div className="mt-4">
          {cert.certificateUrl ? (
            <a
              href={cert.certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1A3157]"
            >
              <Download className="h-4 w-4" />
              Download certificate
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-400"
            >
              <Download className="h-4 w-4" />
              File pending
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function DashboardCertificates({
  certificates,
  externalCertificates,
  showCertificatesTab,
  fullName,
  membershipExpiresDisplay,
  refreshDashboardData,
}: {
  certificates: Certificate[];
  externalCertificates: ExternalCertificate[];
  showCertificatesTab: boolean;
  fullName: string;
  membershipExpiresDisplay: string;
  refreshDashboardData: (params?: { silent?: boolean }) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload() {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setError("Add a certificate title before uploading.");
      return;
    }

    if (!selectedFile) {
      setError("Choose a document or image to upload.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const uploaded = await uploadFiles("externalCertificateUploader", {
        files: [selectedFile],
      });
      const fileUrl =
        uploaded[0]?.serverData?.url || uploaded[0]?.ufsUrl || uploaded[0]?.url;

      if (!fileUrl) {
        throw new Error("Upload completed without a file URL.");
      }

      const response = await fetch("/api/dashboard/certificates/external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: normalizedTitle, fileUrl }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Failed to save the uploaded certificate.",
        );
      }

      setTitle("");
      setSelectedFile(null);
      await refreshDashboardData({ silent: true });
      toast.success("Certificate uploaded.");
    } catch (uploadError) {
      console.error("Failed to upload external certificate:", uploadError);
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload certificate.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/certificates/external/${id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Failed to remove certificate.",
        );
      }

      await refreshDashboardData({ silent: true });
      toast.success("Certificate removed.");
    } catch (deleteError) {
      console.error("Failed to delete external certificate:", deleteError);
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to remove certificate.";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  const primaryCertificate = certificates[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#21466D]">
          My Certificates
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10203B]">
          Verification and uploads
        </h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {showCertificatesTab && primaryCertificate ? (
          <CertificatePreview
            cert={primaryCertificate}
            fullName={fullName}
            membershipExpiresDisplay={membershipExpiresDisplay}
          />
        ) : (
          <section className={shellCardClassName}>
            <div className="rounded-[28px] border border-dashed border-[#D4E0F0] bg-[#FBFDFF] px-6 py-12 text-center">
              <Award className="mx-auto h-10 w-10 text-[#9EB7D2]" />
              <p className="mt-4 text-lg font-semibold text-[#10203B]">
                No issued IBPA certificate yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Your official IBPA certificate will appear here once it has been issued.
              </p>
            </div>
          </section>
        )}

        <section className={`${shellCardClassName} h-fit p-4`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#21466D]/75">
            Upload certificate
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[#10203B]">
            Add personal certificate
          </h2>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Certificate title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Advanced Brow Masterclass"
                className="mt-2 h-11 w-full rounded-2xl border border-[#D4E0F0] bg-[#F8FBFF] px-4 text-sm text-[#10203B] outline-none transition placeholder:text-slate-400 focus:border-[#72A0C1] focus:bg-white focus:ring-4 focus:ring-[#72A0C1]/10"
              />
            </label>

            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setError(null);
              }}
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-[24px] border border-dashed border-[#C8D8EA] bg-[#F8FBFF] px-4 py-3 text-left transition hover:border-[#72A0C1]/45 hover:bg-white"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2B5C99] shadow-sm">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#10203B]">
                  {selectedFile ? selectedFile.name : "Choose document or image"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  PDF, DOC, DOCX, JPG, PNG or WEBP
                </p>
              </div>
            </button>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1A3157] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Upload certificate
            </button>
          </div>
        </section>
      </div>

      <section className={shellCardClassName}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#21466D]/75">
              Personal uploads
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#10203B]">
              External certificates
            </h2>
          </div>

          <span className="rounded-full border border-[#D4E0F0] bg-[#F8FBFF] px-3 py-1 text-xs font-semibold text-[#21466D]">
            {externalCertificates.length} uploaded
          </span>
        </div>

        {externalCertificates.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {externalCertificates.map((item) => (
              <article
                key={item.id}
                className="group rounded-[28px] border border-[#D8E3F1] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FBFF_100%)] p-5 shadow-[0_18px_45px_rgba(11,31,68,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(11,31,68,0.10)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF4FF] text-[#2B5C99]">
                      {getFileIcon(item.fileUrl)}
                    </div>

                    <div className="min-w-0">
                      <p className="line-clamp-2 text-base font-semibold leading-6 text-[#10203B]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Added {formatDate(item.createdAt) || "recently"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#F0D7DB] bg-white text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-60"
                    aria-label={`Remove ${item.title}`}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="mt-5">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#D4E0F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#10203B] transition hover:border-[#2B5C99]/35 hover:bg-[#F5F9FF]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Open file
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[28px] border border-dashed border-[#D4E0F0] bg-[#FBFDFF] px-6 py-12 text-center">
            <FileBadge2 className="mx-auto h-10 w-10 text-[#9EB7D2]" />
            <p className="mt-4 text-lg font-semibold text-[#10203B]">
              No personal certificates uploaded yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Upload external training and credential files to keep them alongside your official IBPA certificate.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
