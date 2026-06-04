import Link from "next/link";
import { Award, Download, ExternalLink, Users } from "lucide-react";

import { SectionCard, SectionHeader, StatusPill } from "@/shared/components/DashboardShared";
import type { Certificate } from "@/components/dashboard/dashboard-types";
import { formatStatusLabel } from "@/lib/dashboard-cabinet";

export function DashboardCertificates({
  certificates,
  showCertificatesTab,
  fullName,
  membershipExpiresDisplay,
  publicProfileHref,
  setActiveTab,
}: {
  certificates: Certificate[];
  showCertificatesTab: boolean;
  fullName: string;
  membershipExpiresDisplay: string;
  publicProfileHref: string | null;
  setActiveTab: (tab: "support") => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="My Certificates"
          title="Verification and downloads"
          description="Issued certificate records, review status, and your public verification link for clients."
          action={
            <button
              type="button"
              onClick={() => setActiveTab("support")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
            >
              <Award className="h-4 w-4" />
              Need to upload more?
            </button>
          }
        />

        <div className="mt-6 space-y-4">
          {showCertificatesTab ? (
            certificates.length > 0 ? (
              certificates.map((cert) => (
                <div
                  key={cert.certNumber}
                  className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-[#10203B]">
                          {cert.certNumber}
                        </p>

                        <StatusPill
                          label={
                            cert.status === "paid"
                              ? "Verified"
                              : formatStatusLabel(cert.status, "Pending")
                          }
                          tone={
                            cert.status === "paid"
                              ? "verified"
                              : cert.status === "approved"
                                ? "active"
                                : "pending"
                          }
                        />
                      </div>

                      <p className="mt-3 text-sm text-slate-500">
                        {cert.orderName || fullName}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Issue date
                          </p>
                          <p className="mt-2 text-sm font-medium text-[#10203B]">
                            {new Date(cert.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Expiry
                          </p>
                          <p className="mt-2 text-sm font-medium text-[#10203B]">
                            {cert.expiresAt
                              ? new Date(cert.expiresAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : membershipExpiresDisplay}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Verification link
                          </p>
                          <p className="mt-2 truncate text-sm font-medium text-[#10203B]">
                            {publicProfileHref || "Available after profile mapping"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      {cert.certificateUrl ? (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-400"
                        >
                          <Download className="h-4 w-4" />
                          Not available yet
                        </button>
                      )}

                      {publicProfileHref ? (
                        <Link
                          href={publicProfileHref}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Public verification
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-[#FBFCFE] p-8 text-center">
                <Award className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-lg font-semibold text-[#10203B]">
                  No issued certificates yet
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Certificate files appear here once the review and upload process is complete.
                </p>
              </div>
            )
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-[#FBFCFE] p-8 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-lg font-semibold text-[#10203B]">
                Partner access uses team management instead
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Open Team Members to manage seats, invited specialists, and partner access.
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
