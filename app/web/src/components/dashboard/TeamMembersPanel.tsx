"use client";

import { AlertCircle, CheckCircle2, Loader2, Trash2, UserPlus, Users } from "lucide-react";
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
  licenseNumber: string;
  affiliationConfirmed: boolean;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  role: "",
  portfolioLink: "",
  licenseNumber: "",
  affiliationConfirmed: false,
};

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
      if (!form.licenseNumber.trim()) {
        toast.error("License number is required.");
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
          body: JSON.stringify(form),
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
      <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#72A0C1]">Team Members</p>
        <h3 className="mt-4 text-2xl uppercase font-anton text-slate-900 md:text-4xl">Partner Account Required</h3>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-500 md:text-base">
          Team access is available only for partner accounts.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#72A0C1]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#72A0C1]">Team Members</p>
        <h3 className="mt-4 text-2xl uppercase font-anton text-slate-900 md:text-4xl">Partner Team Access</h3>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500 md:text-base">
          Invite and manage professionally affiliated team members with individual, email-based access.
        </p>
        {payload ? (
          <p className="mt-4 text-sm text-slate-600">
            Partner account: <span className="font-semibold text-slate-900">{payload.partnerBusinessName}</span>
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Team Seat Summary</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{payload?.includedSeats || 5} included seats</p>
          <p className="mt-1 text-xs text-slate-500">Owner ID: {payload?.ownerMemberId || "IBPA-BO-001"}</p>
        </article>
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Used Seats</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{payload?.usedSeats || 0}</p>
          <p className="mt-1 text-xs text-slate-500">Included used: {payload?.includedUsed || 0}</p>
        </article>
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Remaining Seats</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{payload?.remainingSeats || 0}</p>
          <p className="mt-1 text-xs text-slate-500">Included remaining: {payload?.includedRemaining || 0}</p>
        </article>
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Seat Extensions</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{payload?.pendingSeatExtensionRequests || 0} pending</p>
          <p className="mt-1 text-xs text-slate-500">{payload?.additionalSeatPrice || 100} USD per seat</p>
        </article>
      </section>

      <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-xl uppercase font-anton text-slate-900">Invite Member</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Team access must remain individually assigned and trackable. Team members cannot use partner owner credentials and cannot share registrations.
            </p>
          </div>
          <button
            type="button"
            disabled={extending}
            onClick={handleExtendSeats}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {extending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            Extend Team Seats
          </button>
        </div>

        {!payload?.canInvite && payload?.inviteDisabledReason ? (
          <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {payload.inviteDisabledReason}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Full Name</span>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#72A0C1]"
              placeholder="Full Name"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#72A0C1]"
              placeholder="member@company.com"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Role / Position</span>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#72A0C1]"
              placeholder="Educator, Artist, Assistant"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">License Number</span>
            <input
              type="text"
              value={form.licenseNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, licenseNumber: e.target.value }))}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#72A0C1]"
              placeholder="License Number"
              required
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Instagram or Portfolio Link (Optional)</span>
            <input
              type="url"
              value={form.portfolioLink}
              onChange={(e) => setForm((prev) => ({ ...prev, portfolioLink: e.target.value }))}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#72A0C1]"
              placeholder="https://instagram.com/username"
            />
          </label>

          <label className="md:col-span-2 flex items-start gap-3 rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-4">
            <input
              type="checkbox"
              checked={form.affiliationConfirmed}
              onChange={(e) => setForm((prev) => ({ ...prev, affiliationConfirmed: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#72A0C1] focus:ring-[#72A0C1]"
              required
            />
            <span className="text-sm leading-relaxed text-slate-600">
              I confirm that this person is professionally affiliated with my business.
            </span>
          </label>

          {serverError ? (
            <div className="md:col-span-2 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {serverError}
            </div>
          ) : null}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting || !payload?.canInvite}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-black px-7 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#72A0C1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {submitting ? "Inviting..." : "Invite Member"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#72A0C1]" />
          <h4 className="text-xl uppercase font-anton text-slate-900">Team Members</h4>
        </div>

        {visibleMembers.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-[#F8FAFC] p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">You have not invited any team members yet.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {visibleMembers.map((member) => {
              const seatBadge = getSeatBadge(member);
              const statusBadge = getStatusBadge(member);

              return (
                <article key={member.id} className="rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">{member.fullName}</p>
                      <p className="mt-1 text-sm text-slate-600">{member.email}</p>
                      <p className="mt-1 text-sm text-slate-500">{member.role}</p>
                      <p className="mt-1 text-xs text-slate-500">License: {member.licenseNumber}</p>
                      {member.portfolioLink ? (
                        <a
                          href={member.portfolioLink.startsWith("http") ? member.portfolioLink : `https://${member.portfolioLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs text-[#72A0C1] hover:underline"
                        >
                          Instagram / Portfolio
                        </a>
                      ) : null}
                    </div>
                    <div className="space-y-2 md:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{member.teamMemberId}</p>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${seatBadge.className}`}>
                          {seatBadge.label}
                        </span>
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="flex justify-start md:justify-end">
                        <button
                          type="button"
                          disabled={removingId === member.id}
                          onClick={() => void handleRemoveMember(member.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 transition-colors hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Remove Member
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#72A0C1]" />
            <h5 className="text-lg uppercase font-anton text-slate-900">Team Members Receive</h5>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {[
              "educational resources",
              "webinars and master classes",
              "selected event/member pricing info",
              "participation and certificates area (if enabled)",
              "parent partner/business account context",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#72A0C1]" />
            <h5 className="text-lg uppercase font-anton text-slate-900">Team Members Do Not Receive</h5>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {[
              "full membership certificate",
              "voting rights",
              "public member listing controls",
              "leadership features",
              "full owner/member privileges",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
