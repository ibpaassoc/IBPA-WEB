"use client";

import Link from "next/link";
import { genUploader } from "uploadthing/client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { buildEditablePayload, getApplicationPayload, getEditableFields, type CombinedProfileData } from "@/lib/application-profile";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
  package: "@uploadthing/react",
});

export default function EditApplicationPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CombinedProfileData | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/dashboard/profile", { cache: "no-store" });
        const data = await res.json();

        if (res.status === 403) {
          setAccessBlocked(true);
          return;
        }

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load application data");
        }

        const nextProfile = (data.profile || {}) as CombinedProfileData;
        const payload = getApplicationPayload(nextProfile);
        const nextForm: Record<string, string> = {};

        for (const [key, value] of Object.entries(payload)) {
          nextForm[key] = Array.isArray(value) ? value.join(", ") : typeof value === "string" ? value : value == null ? "" : String(value);
        }

        setProfile(nextProfile);
        setForm(nextForm);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const editableFields = useMemo(
    () => getEditableFields(profile?.membershipCategory),
    [profile?.membershipCategory],
  );

  const immutableInfo = useMemo(() => {
    const payload = getApplicationPayload(profile || {});
    return [
      { label: "Full Name", value: [payload.firstName, payload.lastName].filter(Boolean).join(" ") || "Not provided" },
      { label: "Email", value: typeof payload.email === "string" ? payload.email : "Not provided" },
      { label: "Membership", value: profile?.membershipCategory || "Pending" },
      { label: "Applicant Type", value: profile?.applicantType || "Pending" },
    ];
  }, [profile]);

  const handleAvatarUpload = async (file?: File | null) => {
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const result = await uploadFiles("avatarUploader", { files: [file] });
      const uploaded = result?.[0] as
        | { ufsUrl?: string; url?: string; serverData?: { url?: string } }
        | undefined;
      const imageUrl = uploaded?.serverData?.url || uploaded?.ufsUrl || uploaded?.url;

      if (!imageUrl) {
        throw new Error("Upload completed, but no image URL was returned.");
      }

      setProfile((prev) => (prev ? { ...prev, imageUrl } : prev));
      toast.success("Profile photo updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload profile photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: profile.imageUrl || null,
          bio: profile.bio || null,
          specialization: form.specialization || profile.specialization || null,
          experienceYears: form.yearsExperience || profile.experienceYears || null,
          education: form.educationDesc || profile.education || null,
          instagramUrl: form.instagramLink || profile.instagramUrl || null,
          country: form.country || profile.country || null,
          city: form.city || profile.city || null,
          applicationPayload: buildEditablePayload(form, profile.membershipCategory),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save profile");
      }

      toast.success("Application information updated");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#72A0C1]" />
      </div>
    );
  }

  if (accessBlocked) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#72A0C1]">Application Editor</p>
            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-slate-900 md:text-5xl">
              Membership Activation Required
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
              Profile editing is available only for paid IBPA members. If your membership payment was completed, sign
              in with the same email used for your application and payment.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-[20px] bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#72A0C1] hover:text-black"
              >
                Back to Dashboard
              </Link>
              <Link
                href="https://ibpassociations.org/contact"
                className="inline-flex items-center justify-center rounded-[20px] border border-slate-200 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 transition-colors hover:text-[#72A0C1]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.35em] text-[#72A0C1]">Application Editor</p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-slate-900 md:text-5xl">
            Update Your Submitted Information
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500 md:text-base">
            You can update contact details, professional information, and category-specific application fields. Your legal name,
            email, membership type, and submitted identity data stay locked for review integrity.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-400">Locked Information</p>
            <div className="mt-5 rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Profile Photo</p>
              <div className="mt-4 flex flex-col items-center gap-4 text-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                  {profile?.imageUrl ? (
                    <ImageWithFallback
                      src={profile.imageUrl}
                      alt="Profile photo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#72A0C1]/20 text-2xl font-black text-slate-700">
                      {(immutableInfo[0]?.value || "IBPA")
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="flex w-full flex-col gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]">
                    <UploadCloud className="h-4 w-4" />
                    {uploadingAvatar ? "Uploading..." : "Upload New Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        await handleAvatarUpload(file);
                        event.target.value = "";
                      }}
                    />
                  </label>

                  {profile?.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setProfile((prev) => (prev ? { ...prev, imageUrl: null } : prev))}
                      className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-slate-200 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:border-red-200 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Photo
                    </button>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-slate-400">
                  This photo will be used in your dashboard profile and public member directory.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {immutableInfo.map((item) => (
                <div key={item.label} className="rounded-[20px] border border-slate-100 bg-[#F8FAFC] p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </aside>

          <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="grid gap-5 md:grid-cols-2">
              {editableFields.map((field) => (
                <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={form[field.key] || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="mt-2 min-h-[120px] w-full rounded-[20px] border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#72A0C1]"
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "select" && field.options ? (
                    <select
                      value={form[field.key] || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="mt-2 w-full rounded-[20px] border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#72A0C1]"
                    >
                      <option value="">{field.placeholder || "Select an option"}</option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={form[field.key] || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="mt-2 w-full rounded-[20px] border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#72A0C1]"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-[20px] border border-slate-200 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1]"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#72A0C1] hover:text-black disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
