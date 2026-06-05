"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  dashboardInputClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
} from "@/shared/components/DashboardShared";
import { sanitizeBackendErrorMessage } from "@/lib/safe-backend-error";

type TeamMemberRecord = {
  id: string;
  teamMemberId: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  joinedAt?: string | null;
  portfolioLink?: string | null;
  licenseNumber: string;
  status: "invited" | "active" | "removed";
  seatNumber: number;
  seatKind: "included" | "additional";
  billingStatus: "included" | "payment_required" | "paid";
  accessStatus: string;
  registrationStatus: string;
  ticketCode?: string | null;
  attendanceStatus: string;
  createdAt: string;
};

type TeamMembersPayload = {
  ownerMemberId: string;
  partnerBusinessName: string;
  partnerBusinessEmail: string;
  includedSeats: number;
  includedUsed: number;
  includedRemaining: number;
  usedSeats: number;
  remainingSeats: number;
  totalAllowedSeats: number;
  additionalUsed: number;
  paidAdditionalSeats: number;
  pendingSeatExtensionSeats: number;
  pendingSeatExtensionRequests: number;
  additionalSeatPrice: number;
  canInvite: boolean;
  inviteDisabledReason: string | null;
  members: TeamMemberRecord[];
};

type TeamMembersPanelProps = {
  enabled: boolean;
};

type FormState = {
  fullName: string;
  email: string;
  role: string;
  portfolioLink: string;
  affiliationConfirmed: boolean;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  role: "",
  portfolioLink: "",
  affiliationConfirmed: false,
};

const FALLBACK_LICENSE_NUMBER = "Not provided";

const floatingSectionClassName =
  "rounded-[32px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_22px_60px_rgba(11,31,68,0.10)]";

const floatingMemberCardClassName =
  "rounded-[30px] border border-[#D4E0F0] bg-white p-5 shadow-[0_18px_45px_rgba(11,31,68,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(11,31,68,0.14)]";

const metricCardClassName =
  "rounded-[24px] border border-[#D4E0F0] bg-white/90 px-5 py-4 shadow-[0_18px_45px_rgba(11,31,68,0.07)]";

function getStatusBadge(member: TeamMemberRecord) {
  if (member.status === "removed") {
    return {
      label: "Removed",
      className: "border border-slate-200 bg-slate-100 text-slate-600",
    };
  }

  if (member.status === "active") {
    return {
      label: "Active",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Invited",
    className: "border border-amber-200 bg-amber-50 text-amber-700",
  };
}

function getSafeTeamErrorMessage(value: unknown, fallback: string) {
  return sanitizeBackendErrorMessage(value, fallback);
}

function getInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "TM";

  const first = parts[0]?.[0] || "";
  const second = parts.length > 1 ? parts[1]?.[0] || "" : "";

  return `${first}${second}`.toUpperCase();
}

function SummaryMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <article className={metricCardClassName}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[#10203B]">
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </article>
  );
}

function TeamMembersPanelSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className={metricCardClassName}>
            <div className="h-3 w-24 rounded-full bg-slate-200/80" />
            <div className="mt-3 h-8 w-14 rounded-full bg-slate-200/80" />
            <div className="mt-2 h-3 w-20 rounded-full bg-slate-100" />
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <article key={index} className={floatingMemberCardClassName}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-200/80" />

                <div className="min-w-0 space-y-3">
                  <div className="h-4 w-32 rounded-full bg-slate-200/80" />
                  <div className="h-3 w-40 rounded-full bg-slate-100" />
                  <div className="h-3 w-24 rounded-full bg-slate-100" />
                </div>
              </div>

              <div className="h-7 w-20 rounded-full bg-slate-100" />
            </div>

            <div className="mt-6 flex justify-end">
              <div className="h-9 w-24 rounded-2xl bg-slate-100" />
            </div>
          </article>
        ))}
      </section>

      <section className={floatingSectionClassName}>
        <div className="h-5 w-40 rounded-full bg-slate-200/80" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-3 w-20 rounded-full bg-slate-100" />
              <div className="h-11 rounded-2xl bg-slate-100" />
            </div>
          ))}
          <div className="h-16 rounded-[20px] bg-slate-100 md:col-span-2" />
          <div className="h-11 w-36 rounded-2xl bg-slate-200/80 md:col-span-2" />
        </div>
      </section>
    </div>
  );
}

export function TeamMembersPanel({ enabled }: TeamMembersPanelProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [extending, setExtending] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [payload, setPayload] = useState<TeamMembersPayload | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const loadTeamMembers = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/dashboard/team-members", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(
          getSafeTeamErrorMessage(data?.error, "Failed to load Team Members."),
        );
        return;
      }

      setPayload(data as TeamMembersPayload);
    } catch {
      setServerError("Connection error while loading Team Members.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void loadTeamMembers();
  }, [loadTeamMembers]);

  const visibleMembers = useMemo(
    () => (payload?.members || []).filter((member) => member.status !== "removed"),
    [payload?.members],
  );

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!enabled || !payload?.canInvite) return;

      if (!form.fullName.trim()) {
        toast.error("Full name is required.");
        return;
      }

      if (!form.email.trim()) {
        toast.error("Email is required.");
        return;
      }

      if (!form.role.trim()) {
        toast.error("Position / role is required.");
        return;
      }

      if (!form.affiliationConfirmed) {
        toast.error("Affiliation confirmation is required.");
        return;
      }

      setSubmitting(true);
      setServerError(null);

      try {
        const res = await fetch("/api/dashboard/team-members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            licenseNumber: FALLBACK_LICENSE_NUMBER,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errorText = getSafeTeamErrorMessage(
            data?.error,
            "Failed to invite team member.",
          );
          setServerError(errorText);
          toast.error(errorText);
          return;
        }

        toast.success("Team member invited.");
        setForm(INITIAL_FORM);
        await loadTeamMembers();
      } catch {
        setServerError("Connection error while inviting team member.");
        toast.error("Connection error while inviting team member.");
      } finally {
        setSubmitting(false);
      }
    },
    [enabled, form, loadTeamMembers, payload?.canInvite],
  );

  const handleRemoveMember = useCallback(
    async (id: string) => {
      setRemovingId(id);
      setServerError(null);

      try {
        const res = await fetch(
          `/api/dashboard/team-members/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
          },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errorText = getSafeTeamErrorMessage(
            data?.error,
            "Failed to remove team member.",
          );
          setServerError(errorText);
          toast.error(errorText);
          return;
        }

        toast.success("Team member removed.");
        await loadTeamMembers();
      } catch {
        setServerError("Connection error while removing team member.");
        toast.error("Connection error while removing team member.");
      } finally {
        setRemovingId(null);
      }
    },
    [loadTeamMembers],
  );

  const handleExtendSeats = useCallback(async () => {
    setExtending(true);
    setServerError(null);

    try {
      const res = await fetch("/api/dashboard/team-members/extend-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatsRequested: 1 }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorText = getSafeTeamErrorMessage(
          data?.error,
          "Failed to extend seat capacity.",
        );
        setServerError(errorText);
        toast.error(errorText);
        return;
      }

      toast.success("Seat capacity updated.");
      await loadTeamMembers();
    } catch {
      setServerError("Connection error while extending seats.");
      toast.error("Connection error while extending seats.");
    } finally {
      setExtending(false);
    }
  }, [loadTeamMembers]);

  if (!enabled) {
    return (
      <div className={floatingSectionClassName}>
        <p className="text-sm font-medium text-slate-900">Partner account required</p>
        <p className="mt-2 text-sm text-slate-500">
          Team access is available only for partner memberships.
        </p>
      </div>
    );
  }

  if (loading) {
    return <TeamMembersPanelSkeleton />;
  }

  const additionalSeats = Number(payload?.paidAdditionalSeats || 0);
  const pendingSeatRequests = Number(payload?.pendingSeatExtensionRequests || 0);

  return (
    <div className="space-y-6">
      {serverError ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverError}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="Included seats" value={payload?.includedSeats || 5} />
        <SummaryMetric label="Used seats" value={payload?.usedSeats || 0} />
        <SummaryMetric label="Remaining seats" value={payload?.remainingSeats || 0} />
        <SummaryMetric
          label="Additional seats"
          value={additionalSeats}
          helper={
            pendingSeatRequests > 0
              ? `${pendingSeatRequests} pending request${
                  pendingSeatRequests === 1 ? "" : "s"
                }`
              : undefined
          }
        />
      </section>

      {visibleMembers.length === 0 ? (
        <div className={floatingSectionClassName}>
          <div className="rounded-[24px] border border-dashed border-[#D4E0F0] bg-[#F5F9FF] px-6 py-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-[#4C7D9D] shadow-sm">
              <Users className="h-5 w-5" />
            </div>

            <p className="mt-4 text-base font-medium text-[#10203B]">
              No team members yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Invite your first professional to activate a seat.
            </p>

            <button
              type="button"
              onClick={() => document.getElementById("team-member-full-name")?.focus()}
              className={`${dashboardPrimaryButtonClassName} mt-5`}
            >
              Invite Team Member
            </button>
          </div>
        </div>
      ) : (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#10203B]">
              {visibleMembers.length} active member
              {visibleMembers.length === 1 ? "" : "s"}
            </p>

            <button
              type="button"
              disabled={extending}
              onClick={handleExtendSeats}
              className={`${dashboardSecondaryButtonClassName} !px-4 !py-2 text-xs`}
            >
              {extending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Extend seats
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {visibleMembers.map((member) => {
              const statusBadge = getStatusBadge(member);

              return (
                <article key={member.id} className={floatingMemberCardClassName}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D8E8FB] text-sm font-bold text-[#21466D]">
                        {getInitials(member.fullName)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-[#10203B]">
                          {member.fullName}
                        </h3>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {member.email}
                        </p>

                        <p className="mt-3 line-clamp-1 text-xs font-bold uppercase tracking-[0.18em] text-[#16386D]">
                          {member.role || "Team member"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusBadge.className}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removingId === member.id}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#D4E0F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                    >
                      {removingId === member.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className={floatingSectionClassName}>
        <div className="border-b border-[#D4E0F0] pb-4">
          <h3 className="text-lg font-semibold tracking-tight text-[#10203B]">
            Invite Team Member
          </h3>
        </div>

        {!payload?.canInvite && payload?.inviteDisabledReason ? (
          <div className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {payload.inviteDisabledReason}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-600">Full Name</span>
            <input
              id="team-member-full-name"
              type="text"
              value={form.fullName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fullName: event.target.value }))
              }
              className={dashboardInputClassName}
              placeholder="Full Name"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-600">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className={dashboardInputClassName}
              placeholder="member@company.com"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-600">Role / Position</span>
            <input
              type="text"
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, role: event.target.value }))
              }
              className={dashboardInputClassName}
              placeholder="Educator, Artist, Assistant"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-600">
              Instagram or Portfolio Link
            </span>
            <input
              type="url"
              value={form.portfolioLink}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, portfolioLink: event.target.value }))
              }
              className={dashboardInputClassName}
              placeholder="https://instagram.com/username"
            />
          </label>

          <label className="flex items-start gap-3 rounded-[20px] border border-[#D4E0F0] bg-white px-4 py-4 md:col-span-2">
            <input
              type="checkbox"
              checked={form.affiliationConfirmed}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  affiliationConfirmed: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#72A0C1] focus:ring-[#72A0C1]"
              required
            />

            <span className="text-sm text-slate-600">
              I confirm that this person is professionally affiliated with my business.
            </span>
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting || !payload?.canInvite}
              className={dashboardPrimaryButtonClassName}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {submitting ? "Inviting..." : "Invite Member"}
            </button>
          </div>
        </form>
      </section>

      <section className={floatingSectionClassName}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#4C7D9D]" />

          <div>
            <h4 className="text-sm font-semibold text-[#10203B]">
              Team Access Rules
            </h4>

            <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              {[
                "Individual email-based access",
                "No credential sharing",
                "Trackable access",
                "Professional affiliation required",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4C7D9D]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
