"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { SignIn, SignUp, useUser } from "@clerk/nextjs";
import { useI18n } from "@/lib/i18n";
import { getBackendUrl, getLandingOrigin } from "@/lib/public-urls";

function SuccessContent() {
  const { isLoaded, isSignedIn } = useUser();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const successUrl = token ? `/success?token=${encodeURIComponent(token)}` : "/success";
  const landingUrl = getLandingOrigin();
  const successCopy = t.dashboard.success;
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
        ? successCopy.errorBodies.missingToken
        : errorReason === "not_found"
          ? successCopy.errorBodies.notFound
          : errorReason === "backend_unavailable"
            ? successCopy.errorBodies.backendUnavailable
            : successCopy.errorBodies.verifyFailed;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F3F5] px-4">
        <div className="max-w-3xl w-full rounded-[40px] border border-slate-100 bg-white p-10 shadow-2xl md:p-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-green-100 text-green-600">
            <CheckCircle size={44} />
          </div>
          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#708090]">
            {successCopy.accessEyebrow}
          </p>
          <h1 className="mt-4 text-4xl uppercase leading-none text-slate-900 md:text-6xl" style={{ fontFamily: "Anton SC, sans-serif" }}>
            {successCopy.paymentReceivedTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
            {fallbackBody}
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-[#F8FAFC] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                {successCopy.nextStepTitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {successCopy.nextStepDescription}
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-[#F8FAFC] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                {successCopy.needHelpTitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {successCopy.needHelpDescription}
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={landingUrl}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition-colors hover:border-slate-300 hover:text-black"
            >
              {successCopy.backToLanding}
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-black px-8 py-[0.92rem] text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-all shadow-xl hover:scale-[1.02]"
            >
              {successCopy.memberLogin} <ArrowRight size={16} />
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
            {successCopy.activationEyebrow}
          </p>
          <h1 className="mt-4 text-5xl uppercase leading-none text-slate-900 md:text-7xl" style={{ fontFamily: "Anton SC, sans-serif" }}>
            {successCopy.paymentSuccessPrefix}{" "}
            <span className="text-[#B9D9EB]">{successCopy.paymentSuccessHighlight}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            {successCopy.thankYou(orderData?.name || successCopy.memberFallback)}
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                {successCopy.firstTimeAccessTitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {successCopy.firstTimeAccessDescription}
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                {successCopy.existingAccountTitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {successCopy.existingAccountDescription}
              </p>
            </div>
          </div>

          {orderData?.email && (
            <div className="mt-8 rounded-[28px] border border-[#B9D9EB]/30 bg-white/85 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#708090]">
                {successCopy.approvedEmail}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900">{orderData.email}</p>
            </div>
          )}
        </motion.section>

        <section className="overflow-hidden rounded-[40px] border border-[#B9D9EB]/20 bg-white p-2 shadow-2xl lg:mt-8">
          {isSignedIn ? (
            <div className="p-8 text-center md:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#708090]">
                {successCopy.accountReadyEyebrow}
              </p>
              <h2 className="mt-4 text-3xl uppercase leading-none text-slate-900" style={{ fontFamily: "Anton SC, sans-serif" }}>
                {successCopy.dashboardAccessActive}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {successCopy.accountReadyDescription}
              </p>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-black px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-transform hover:scale-[1.02]"
              >
                {successCopy.openDashboard}
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
                  {successCopy.createAccount}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("sign-in")}
                  className={`flex-1 rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
                    authMode === "sign-in" ? "bg-black text-white" : "text-slate-500"
                  }`}
                >
                  {successCopy.signIn}
                </button>
              </div>
            </div>

            <div className="p-1">
              {authMode === "sign-up" ? (
                <SignUp
                  routing="hash"
                  forceRedirectUrl="/dashboard"
                  fallbackRedirectUrl="/dashboard"
                  signInUrl={successUrl}
                />
              ) : (
                <SignIn
                  routing="hash"
                  forceRedirectUrl="/dashboard"
                  fallbackRedirectUrl="/dashboard"
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
