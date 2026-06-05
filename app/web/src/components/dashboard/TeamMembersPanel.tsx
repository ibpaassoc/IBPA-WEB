"use client";

import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { sanitizeBackendErrorMessage } from "@/lib/safe-backend-error";

type TeamMemberRecord = {
  id: string;
  teamMemberId: string;
  fullName: string;
  email: string;
  role: string;
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

function getSeatBadge(member: TeamMemberRecord) {
  if (member.seatKind === "additional") {
    return {
      label: "Additional Seat",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Included Seat",
    className: "border border-sky-200 bg-sky-50 text-sky-700",
  };
}

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        const errorText = getSafeTeamErrorMessage(data?.error, "Failed to extend seat capacity.");
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
      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] md:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#72A0C1]">Team Access</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Partner Account Required</h3>
        <p className="mt-3 max-w-2xl text-sm text-slate-500">
          Team access is available only for partner accounts.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] md:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#72A0C1]" />
      </div>
    );
  }

  const additionalSeats = Number(payload?.paidAdditionalSeats || 0);

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

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-[0_10px_36px_rgba(15,23,42,0.08)] md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#72A0C1]">Business Owner</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0F2240] md:text-4xl">Partner Team Access</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
              Manage affiliated professionals with individual educational access.
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-[#ECF4FF] px-4 py-2 text-[11px] font-semibold text-[#1E3A6D]">
            Business Owner Membership
          </span>
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium text-slate-500">Included Seats</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{payload?.includedSeats || 5}</p>
          </article>
          <article className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium text-slate-500">Used Seats</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{payload?.usedSeats || 0}</p>
          </article>
          <article className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium text-slate-500">Remaining Seats</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{payload?.remainingSeats || 0}</p>
          </article>
          <article className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-medium text-slate-500">Additional Seats</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{additionalSeats}</p>
            {Number(payload?.pendingSeatExtensionRequests || 0) > 0 ? (
              <p className="mt-1 text-xs text-amber-600">
                {payload?.pendingSeatExtensionRequests || 0} pending request
                {(payload?.pendingSeatExtensionRequests || 0) > 1 ? "s" : ""}
              </p>
            ) : null}
          </article>
        </div>
        <div className="flex justify-start">
          <button
            type="button"
            disabled={extending}
            onClick={handleExtendSeats}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0F2240] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#17386B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {extending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Extend Seats
          </button>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-[0_10px_36px_rgba(15,23,42,0.08)] md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">Team Members</h3>
            <p className="mt-1 text-sm text-slate-500">
              {payload?.partnerBusinessName ? `For ${payload.partnerBusinessName}` : "Manage your current invited team"}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {visibleMembers.length} member{visibleMembers.length === 1 ? "" : "s"}
          </span>
        </div>

        {visibleMembers.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-[#F7FAFF] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F0FF] text-[#2C5A91]">
              <Users className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-medium text-slate-900">No team members yet</p>
            <p className="mt-1 text-sm text-slate-500">Invite your first professional to activate a seat.</p>
            <button
              type="button"
              onClick={() => {
                const element = document.getElementById("team-member-full-name");
                element?.focus();
              }}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#0F2240] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#17386B]"
            >
              Invite Team Member
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {visibleMembers.map((member) => {
              const seatBadge = getSeatBadge(member);
              const statusBadge = getStatusBadge(member);

              return (
                <article key={member.id} className="rounded-2xl bg-[#F8FAFD] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCEBFF] text-sm font-semibold text-[#1F4D84]">
                        {getInitials(member.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{member.fullName}</p>
                        <p className="truncate text-sm text-slate-500">{member.email}</p>
                        <p className="mt-1 text-xs text-slate-500">{member.role}</p>
                        {member.portfolioLink ? (
                          <a
                            href={member.portfolioLink.startsWith("http") ? member.portfolioLink : `https://${member.portfolioLink}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-xs font-medium text-[#2A5D97] hover:underline"
                          >
                            Instagram / Portfolio
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                        Seat #{member.seatNumber}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${seatBadge.className}`}>
                        {seatBadge.label}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                      <button
                        type="button"
                        disabled={removingId === member.id}
                        onClick={() => void handleRemoveMember(member.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingId === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-[0_10px_36px_rgba(15,23,42,0.08)] md:p-8">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">Invite Team Member</h3>
        <p className="mt-1 text-sm text-slate-500">Add a professional and assign an individual seat.</p>

        {!payload?.canInvite && payload?.inviteDisabledReason ? (
          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {payload.inviteDisabledReason}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-medium text-slate-600">Full Name</span>
            <input
              id="team-member-full-name"
              type="text"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#72A0C1]"
              placeholder="Full Name"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium text-slate-600">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#72A0C1]"
              placeholder="member@company.com"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium text-slate-600">Role / Position</span>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#72A0C1]"
              placeholder="Educator, Artist, Assistant"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium text-slate-600">Instagram or Portfolio Link (optional)</span>
            <input
              type="url"
              value={form.portfolioLink}
              onChange={(e) => setForm((prev) => ({ ...prev, portfolioLink: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#72A0C1]"
              placeholder="https://instagram.com/username"
            />
          </label>

          <label className="md:col-span-2 flex items-start gap-3 rounded-2xl bg-[#F7FAFF] p-4">
            <input
              type="checkbox"
              checked={form.affiliationConfirmed}
              onChange={(e) => setForm((prev) => ({ ...prev, affiliationConfirmed: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#72A0C1] focus:ring-[#72A0C1]"
              required
            />
            <span className="text-sm text-slate-600">
              I confirm that this person is professionally affiliated with my business.
            </span>
          </label>

          {serverError ? (
            <div className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {serverError}
            </div>
          ) : null}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting || !payload?.canInvite}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0F2240] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#17386B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {submitting ? "Inviting..." : "Invite Member"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#2A5D97]" />
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Team Access Rules</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2A5D97]" />
                <span>Individual email-based access</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2A5D97]" />
                <span>No credential sharing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2A5D97]" />
                <span>Trackable access</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2A5D97]" />
                <span>Professional affiliation required</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
