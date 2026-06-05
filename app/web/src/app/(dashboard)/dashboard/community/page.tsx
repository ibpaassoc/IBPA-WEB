"use client";

import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { ArrowLeft, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  dashboardStandalonePageContainerClassName,
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  SectionCard,
  SectionHeader,
} from "@/shared/components/DashboardShared";
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

  if (
    /<!doctype|<html|<body|<pre|<\/?[a-z][\s\S]*>/i.test(trimmed) ||
    /node_modules| at [A-Za-z0-9_$]+\s*\(/i.test(trimmed)
  ) {
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
        const response = await fetch("/api/dashboard/community/members", {
          cache: "no-store",
        });
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
          setAccessError(
            getSafeUiErrorMessage(
              error?.message,
              "Failed to load community members.",
            ),
          );
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
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB]">
        <Loader2 className="h-10 w-10 animate-spin text-[#4C7D9D]" />
      </div>
    );
  }

  if (accessError) {
    return (
      <main className="min-h-screen bg-[#F4F7FB]">
        <div className={dashboardStandalonePageContainerClassName}>
          <SectionCard>
            <SectionHeader title="Member Directory" />
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
              {accessError}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className={dashboardPrimaryButtonClassName}>
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
              <SignOutButton>
                <button className={dashboardSecondaryButtonClassName}>
                  <LogIn className="h-4 w-4" />
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </SectionCard>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB]">
      <div className={`${dashboardStandalonePageContainerClassName} space-y-6`}>
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className={dashboardSecondaryButtonClassName}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <UserButton />
        </div>

        <SectionCard>
          <SectionHeader title="Member Directory" />
          <div className="mt-6">
            <MembersDirectory
              locale="en"
              items={items}
              mode="full"
              surface="dashboard"
              showIntro={false}
            />
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
