"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const COOKIE_CONSENT_KEY = "ibpa-cookie-consent";

export function CookieConsentBanner() {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem(COOKIE_CONSENT_KEY);
  });

  const handleConsent = (value: "accepted" | "necessary") => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    document.cookie = `ibpa-cookie-consent=${value}; path=/; max-age=31536000; SameSite=Lax`;
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-[#d6dfe9] bg-white/95 p-5 shadow-[0_20px_60px_rgba(11,24,57,0.18)] backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#8ea6c1]">
              {t.cookies.title}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#445574] md:text-[15px]">
              {t.cookies.description}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleConsent("necessary")}
              className="rounded-full border border-[#cad6e4] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#12213f] transition hover:border-[#9eb4cc] hover:bg-[#f7f9fc]"
            >
              {t.cookies.necessaryOnly}
            </button>
            <button
              type="button"
              onClick={() => handleConsent("accepted")}
              className="rounded-full bg-[#09111f] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1b2a47]"
            >
              {t.cookies.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
