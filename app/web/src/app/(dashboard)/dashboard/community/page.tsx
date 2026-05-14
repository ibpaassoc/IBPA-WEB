"use client";

import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { ArrowLeft, LayoutDashboard, Loader2, LogIn, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MembersDirectory } from "@/components/members/MembersDirectory";
import type { PublicMember } from "@/lib/public-members";

function getSafeUiErrorMessage(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (/<!doctype|<html|<body|<pre|<\/?[a-z][\s\S]*>/i.test(trimmed) || /node_modules| at [A-Za-z0-9_$]+\s*\(/i.test(trimmed)) {
    return fallback;
  }

  return trimmed.length > 260 ? fallback : trimmed;
}

export default function DashboardCommunityPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<PublicMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    let cancelled = false;

    async function loadMembers() {
      setIsLoading(true);
      setAccessError(null);

      try {
        const response = await fetch("/api/dashboard/community/members", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));

        if (cancelled) {
          return;
        }

        if (response.status === 401) {
          router.replace("/sign-in");
          return;
        }

        if (!response.ok) {
          setItems([]);
          setAccessError(
            getSafeUiErrorMessage(
              data?.error,
              "Community access is available only for active IBPA members.",
            ),
          );
          return;
        }

        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (error: any) {
        if (!cancelled) {
          setItems([]);
          setAccessError(getSafeUiErrorMessage(error?.message, "Failed to load community members."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-10 w-10 animate-spin text-[#72A0C1]" />
      </div>
    );
  }

  if (accessError) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#72A0C1]">Community Access</p>
          <h1 className="mt-4 text-3xl uppercase text-slate-900 md:text-5xl">Membership Activation Required</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">{accessError}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#72A0C1] hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <SignOutButton>
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700 transition-colors hover:border-slate-300 hover:text-black">
                <LogIn className="h-4 w-4" />
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#72A0C1]/40 hover:text-[#4C7D9D]"
              aria-label="Back to dashboard"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#72A0C1]">Member Dashboard</p>
              <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 md:text-2xl">Community</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-slate-200 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 transition-colors hover:border-slate-300 hover:text-black sm:inline-flex"
            >
              Dashboard
            </Link>
            <UserButton />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-2xl px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-[#F8FAFC] hover:text-slate-600"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/community"
                className="flex items-center gap-3 rounded-2xl bg-[#72A0C1] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#72A0C1]/20"
              >
                <Users className="h-5 w-5" />
                Community
              </Link>
            </nav>
          </div>
        </aside>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <MembersDirectory locale="en" items={items} mode="full" surface="dashboard" />
        </div>
      </div>
    </main>
  );
}
