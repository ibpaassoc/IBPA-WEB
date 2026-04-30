"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { SignIn, SignUp, useUser } from "@clerk/nextjs";
import { getBackendUrl, getLandingOrigin } from "@/lib/public-urls";

function SuccessContent() {
  const { isLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const successUrl = token ? `/success?token=${encodeURIComponent(token)}` : "/success";
  const landingUrl = getLandingOrigin();
  const [status, setStatus] = useState<"loading" | "paid" | "error">(token ? "loading" : "error");
  const [errorReason, setErrorReason] = useState<"missing_token" | "not_found" | "backend_unavailable" | "verify_failed" | null>(
    token ? null : "missing_token",
  );
  const [orderData, setOrderData] = useState<{ email: string; name: string } | null>(null);
  const [authMode, setAuthMode] = useState<"sign-up" | "sign-in">("sign-up");

  useEffect(() => {
    if (!token) {
      return;
    }

    const verifyToken = async () => {
      try {
        const resp = await fetch(getBackendUrl(`/api/orders/verify/${token}`));
        if (!resp.ok) {
          setErrorReason("not_found");
          setStatus("error");
          return;
        }

        const data = await resp.json();
        if (data.status === "paid" || data.status === "approved") {
          setStatus("paid");
          setOrderData({ email: data.email, name: data.name });
          return;
        }

        setErrorReason("verify_failed");
        setStatus("error");
      } catch (err) {
        console.error(err);
        setErrorReason("backend_unavailable");
        setStatus("error");
      }
    };

    void verifyToken();
  }, [token]);

  if (status === "loading" || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F8FF]">
        <Loader2 className="w-10 h-10 text-[#B9D9EB] animate-spin" />
      </div>
    );
  }

  if (status === "error") {
    const fallbackBody =
      errorReason === "missing_token"
        ? "Your payment may already be completed. Please continue by signing in with the same email address you used for your application."
        : errorReason === "not_found"
          ? "Your payment may already be completed. This link looks outdated or incomplete, so please continue by signing in to your dashboard."
          : errorReason === "backend_unavailable"
            ? "Your payment may already be completed. The verification service is temporarily unavailable, so you can continue by signing in directly."
            : "Your payment may already be completed. Please sign in to your dashboard with the same email used for your application.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F3F5] px-4">
        <div className="max-w-3xl w-full rounded-[40px] border border-slate-100 bg-white p-10 shadow-2xl md:p-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-green-100 text-green-600">
            <CheckCircle size={44} />
          </div>
          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#708090]">
            Dashboard access
          </p>
          <h1 className="mt-4 text-4xl uppercase leading-none text-slate-900 md:text-6xl" style={{ fontFamily: "Anton SC, sans-serif" }}>
            Payment received
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
            {fallbackBody}
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-[#F8FAFC] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                Next step
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Sign in with the same email address you used for your application and payment to continue into your dashboard.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-[#F8FAFC] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                Need help?
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                If access still does not open after sign-in, contact IBPA support and we will verify your payment manually.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={landingUrl}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition-colors hover:border-slate-300 hover:text-black"
            >
              Back to landing
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-black px-8 py-[0.92rem] text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-all shadow-xl hover:scale-[1.02]"
            >
              Member Login <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F8FF] px-4 py-10 md:px-8 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.02fr)_460px] lg:items-start">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[40px] border border-white bg-[linear-gradient(135deg,#ffffff_0%,#eef4f8_100%)] p-8 shadow-xl md:p-12 lg:pt-16"
        >
          <div className="w-24 h-24 bg-green-100 flex items-center justify-center rounded-[32px] text-green-600">
            <CheckCircle size={56} />
          </div>
          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#708090]">
            Membership Activation
          </p>
          <h1 className="mt-4 text-5xl uppercase leading-none text-slate-900 md:text-7xl" style={{ fontFamily: "Anton SC, sans-serif" }}>
            Payment <span className="text-[#B9D9EB]">Successful!</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            Thank you, {orderData?.name || "member"}. Your payment has been confirmed. Create your dashboard access now to open your membership area, certificates, notifications, and future updates.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                First-time access
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                If this is your first visit after approval and payment, create your account with the same email used in the application.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                Existing account
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                If you already created your account earlier, switch to sign in and continue directly to the dashboard.
              </p>
            </div>
          </div>

          {orderData?.email && (
            <div className="mt-8 rounded-[28px] border border-[#B9D9EB]/30 bg-white/85 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                Approved Email
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900">{orderData.email}</p>
            </div>
          )}
        </motion.section>

        <section className="overflow-hidden rounded-[40px] border border-[#B9D9EB]/20 bg-white p-2 shadow-2xl lg:mt-8">
          {isSignedIn ? (
            <div className="p-8 text-center md:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#708090]">
                Account Ready
              </p>
              <h2 className="mt-4 text-3xl uppercase leading-none text-slate-900" style={{ fontFamily: "Anton SC, sans-serif" }}>
                Dashboard Access Active
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Your account is already signed in. You can continue directly to your personal dashboard.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-black px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-transform hover:scale-[1.02]"
              >
                Open Dashboard
              </Link>
            </div>
          ) : (
            <>
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex rounded-full border border-slate-200 bg-[#F8FAFC] p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode("sign-up")}
                  className={`flex-1 rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
                    authMode === "sign-up" ? "bg-black text-white" : "text-slate-500"
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("sign-in")}
                  className={`flex-1 rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
                    authMode === "sign-in" ? "bg-black text-white" : "text-slate-500"
                  }`}
                >
                  Sign In
                </button>
              </div>
            </div>

            <div className="p-1">
              {authMode === "sign-up" ? (
                <SignUp
                  routing="hash"
                  forceRedirectUrl="/"
                  fallbackRedirectUrl="/"
                  signInUrl={successUrl}
                />
              ) : (
                <SignIn
                  routing="hash"
                  forceRedirectUrl="/"
                  fallbackRedirectUrl="/"
                  signUpUrl={successUrl}
                />
              )}
            </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F8FF]">
      <Loader2 className="w-10 h-10 text-[#B9D9EB] animate-spin" />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
