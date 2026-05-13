"use client";

import { AlertCircle, CheckCircle2, ClipboardCheck, IdCard, Loader2, ShieldAlert, Ticket, UserPlus, Users } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TeamMemberRecord = {
  id: string;
  teamMemberId: string;
  fullName: string;
  email: string;
  role: string;
  portfolioLink?: string | null;
  license: string;
  seatNumber: number;
  seatKind: "included" | "additional";
  billingStatus: "included" | "payment_required" | "paid";
  accessStatus: "active" | "pending_billing";
  registrationStatus: string;
  ticketCode?: string | null;
  attendanceStatus: string;
  createdAt: string;
};

type TeamMembersPayload = {
  ownerMemberId: string;
  includedSeats: number;
  includedUsed: number;
  additionalSeats: number;
  pendingAdditionalSeats: number;
  additionalSeatPrice: number;
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
  license: string;
  affiliationConfirmed: boolean;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  role: "",
  portfolioLink: "",
  license: "",
  affiliationConfirmed: false,
};

function getSeatBadge(member: TeamMemberRecord, additionalSeatPrice: number) {
  if (member.seatKind === "additional") {
    if (member.billingStatus === "payment_required") {
      return {
        label: `Additional Seat • Payment Required ($${additionalSeatPrice})`,
        className: "border border-amber-200 bg-amber-50 text-amber-700",
      };
    }

    return {
      label: "Additional Seat • Paid",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Included Educational Seat",
    className: "border border-sky-200 bg-sky-50 text-sky-700",
  };
}

export function TeamMembersPanel({ enabled }: TeamMembersPanelProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        setServerError(typeof data?.error === "string" ? data.error : "Failed to load Team Members.");
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

  const includedRemaining = useMemo(() => {
    if (!payload) return 0;
    return Math.max(payload.includedSeats - payload.includedUsed, 0);
  }, [payload]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!enabled) return;

      if (!form.fullName.trim()) {
        toast.error("Full Name is required.");
        return;
      }
      if (!form.email.trim()) {
        toast.error("Email is required.");
        return;
      }
      if (!form.role.trim()) {
        toast.error("Position / Role is required.");
        return;
      }
      if (!form.license.trim()) {
        toast.error("License is required.");
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
          const errorText = typeof data?.error === "string" ? data.error : "Failed to add Team Member.";
          setServerError(errorText);
          toast.error(errorText);
          return;
        }

        if (typeof data?.note === "string" && data.note.includes("requires payment")) {
          toast.warning(data.note);
        } else {
          toast.success("Team Member added.");
        }

        setForm(INITIAL_FORM);
        await loadTeamMembers();
      } catch {
        setServerError("Connection error while adding Team Member.");
        toast.error("Connection error while adding Team Member.");
      } finally {
        setSubmitting(false);
      }
    },
    [enabled, form, loadTeamMembers],
  );

  if (!enabled) {
    return (
      <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#72A0C1]">Team Members</p>
        <h3 className="mt-4 text-2xl uppercase font-anton text-slate-900 md:text-4xl">Business Owner Membership Required</h3>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-500 md:text-base">
          Team Educational Seats are available only for the Business Owner membership category.
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
        <h3 className="mt-4 text-2xl uppercase font-anton text-slate-900 md:text-4xl">Business Owner Team Access</h3>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500 md:text-base">
          Full Business Owner membership for the owner + limited educational access for affiliated team members.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Owner Member ID</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{payload?.ownerMemberId || "Pending"}</p>
        </article>
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Included Team Seats</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{payload?.includedUsed || 0} / {payload?.includedSeats || 5}</p>
          <p className="mt-1 text-xs text-slate-500">{includedRemaining} included seat(s) available</p>
        </article>
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Additional Seats</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{payload?.additionalSeats || 0}</p>
          <p className="mt-1 text-xs text-slate-500">${payload?.additionalSeatPrice || 100} each</p>
        </article>
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Pending Billing</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{payload?.pendingAdditionalSeats || 0}</p>
          <p className="mt-1 text-xs text-slate-500">Future Stripe billing ready</p>
        </article>
      </section>

      <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-3">
          <UserPlus className="mt-1 h-5 w-5 text-[#72A0C1]" />
          <div className="min-w-0">
            <h4 className="text-xl uppercase font-anton text-slate-900">Add / Invite Team Member</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Team access is email-based, individually assigned, and trackable. Team Members cannot use owner credentials and cannot share registrations or tickets.
            </p>
          </div>
        </div>

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
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Position / Role</span>
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
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">License</span>
            <input
              type="text"
              value={form.license}
              onChange={(e) => setForm((prev) => ({ ...prev, license: e.target.value }))}
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
              I confirm that the listed person is professionally affiliated with my business.
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
              disabled={submitting}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-black px-7 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#72A0C1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {submitting ? "Saving..." : "Add Team Member"}
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#72A0C1]" />
            <h5 className="text-lg uppercase font-anton text-slate-900">Team Members Receive</h5>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {[
              "educational materials",
              "webinars",
              "master classes",
              "educational resources",
              "member pricing for selected events",
              "ability to participate in competitions / awards if allowed",
              "optional participation certificates",
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
            <ShieldAlert className="h-5 w-5 text-[#72A0C1]" />
            <h5 className="text-lg uppercase font-anton text-slate-900">Team Members Do Not Receive</h5>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {[
              "full membership status",
              "public member listing",
              "voting rights",
              "separate membership certificate",
              "leadership privileges",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-[#72A0C1]" />
            <h5 className="text-lg uppercase font-anton text-slate-900">Member ID Structure</h5>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">Business Owner: <span className="font-semibold text-slate-900">{payload?.ownerMemberId || "IBPA-BO-001"}</span></p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">Team Members: <span className="font-semibold text-slate-900">{payload?.ownerMemberId || "IBPA-BO-001"}-T1</span>, <span className="font-semibold text-slate-900">{payload?.ownerMemberId || "IBPA-BO-001"}-T2</span>, ...</p>
        </article>
        <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[#72A0C1]" />
            <h5 className="text-lg uppercase font-anton text-slate-900">Future Event / Webinar Ready</h5>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> personal registration per Team Member</li>
            <li className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> personal QR / ticket per Team Member</li>
            <li className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> individual attendance tracking</li>
          </ul>
        </article>
      </section>

      <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#72A0C1]" />
          <h4 className="text-xl uppercase font-anton text-slate-900">Assigned Team Members</h4>
        </div>

        {!payload || payload.members.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-[#F8FAFC] p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">No Team Members added yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Add your first affiliated professional to activate a Team Educational Seat.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {payload.members.map((member) => {
              const seatBadge = getSeatBadge(member, payload.additionalSeatPrice);
              return (
                <article key={member.id} className="rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">{member.fullName}</p>
                      <p className="mt-1 text-sm text-slate-600">{member.email}</p>
                      <p className="mt-1 text-sm text-slate-500">{member.role}</p>
                      <p className="mt-1 text-xs text-slate-500">License: {member.license}</p>
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
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${seatBadge.className}`}>
                        {seatBadge.label}
                      </span>
                      <p className="text-xs text-slate-500">Seat #{member.seatNumber}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
