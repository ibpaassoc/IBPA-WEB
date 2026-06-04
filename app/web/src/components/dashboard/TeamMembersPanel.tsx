"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
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
  dashboardMetricCardClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  dashboardSubtlePanelClassName,
} from "@/components/dashboard/DashboardShared";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
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

  if (parts.length === 0) {
    return "TM";
  }

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
    <article className={dashboardMetricCardClassName}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </article>
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
      const res = await fetch("/api/dashboard/team-members", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(getSafeTeamErrorMessage(data?.error, "Failed to load Team Members."));
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
      if (!enabled || !payload?.canInvite) {
        return;
      }

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
          const errorText = getSafeTeamErrorMessage(data?.error, "Failed to invite team member.");
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
        const res = await fetch(`/api/dashboard/team-members/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errorText = getSafeTeamErrorMessage(data?.error, "Failed to remove team member.");
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
        const errorText = getSafeTeamErrorMessage(data?.error, "Failed to request additional seats.");
        setServerError(errorText);
        toast.error(errorText);
        return;
      }

      toast.warning("Seat extension request submitted. Payment is required before activation.");
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
      <div className={`${dashboardSubtlePanelClassName} p-6`}>
        <p className="text-sm font-medium text-slate-900">Partner account required</p>
        <p className="mt-2 text-sm text-slate-500">
          Team access is available only for partner memberships.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-[22px] border border-slate-200 bg-slate-50/70">
        <Loader2 className="h-8 w-8 animate-spin text-[#4C7D9D]" />
      </div>
    );
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric label="Included seats" value={payload?.includedSeats || 5} />
          <SummaryMetric label="Used seats" value={payload?.usedSeats || 0} />
          <SummaryMetric label="Remaining seats" value={payload?.remainingSeats || 0} />
          <SummaryMetric
            label="Additional seats"
            value={additionalSeats}
            helper={
              pendingSeatRequests > 0
                ? `${pendingSeatRequests} pending request${pendingSeatRequests === 1 ? "" : "s"}`
                : undefined
            }
          />
        </div>

        <button
          type="button"
          disabled={extending}
          onClick={handleExtendSeats}
          className={dashboardSecondaryButtonClassName}
        >
          {extending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Extend Seats
        </button>
      </section>

      <section className={`${dashboardSubtlePanelClassName} p-5`}>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              Team Members
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Keep invited professionals, access status, and actions in one place.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            {visibleMembers.length} member{visibleMembers.length === 1 ? "" : "s"}
          </span>
        </div>

        {visibleMembers.length === 0 ? (
          <div className="mt-4 rounded-[20px] border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-[#4C7D9D]">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-4 text-base font-medium text-slate-900">
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
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {visibleMembers.map((member) => {
              const statusBadge = getStatusBadge(member);
              const portfolioHref = member.portfolioLink
                ? member.portfolioLink.startsWith("http")
                  ? member.portfolioLink
                  : `https://${member.portfolioLink}`
                : null;

              return (
                <article
                  key={member.id}
                  className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DCEBFF] text-sm font-semibold text-[#1F4D84]">
                      {member.avatarUrl ? (
                        <ImageWithFallback
                          src={member.avatarUrl}
                          alt={member.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(member.fullName)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {member.fullName}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {member.email}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2A5D97]">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {portfolioHref ? (
                      <a
                        href={portfolioHref}
                        target="_blank"
                        rel="noreferrer"
                        className={dashboardSecondaryButtonClassName}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Portfolio
                      </a>
                    ) : null}

                    <button
                      type="button"
                      disabled={removingId === member.id}
                      onClick={() => void handleRemoveMember(member.id)}
                      className={dashboardSecondaryButtonClassName}
                    >
                      {removingId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={`${dashboardSubtlePanelClassName} p-5`}>
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">
            Invite Team Member
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Add a professional and assign an individual seat.
          </p>
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

          <label className="md:col-span-2 flex items-start gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-4">
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

      <section className={`${dashboardSubtlePanelClassName} p-5`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#4C7D9D]" />
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Team Access Rules</h4>
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
