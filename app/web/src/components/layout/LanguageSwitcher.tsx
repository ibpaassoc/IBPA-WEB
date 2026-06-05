"use client";

import React from "react";
import { Globe } from "lucide-react";
import { getLocaleCookieValue, resolveLocale, useI18n } from "@/lib/i18n";

export const LanguageSwitcher = ({ mobile = false, scrolled = false }: { mobile?: boolean; scrolled?: boolean }) => {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const languages = [
    { code: "en" as const, label: "EN" },
    { code: "ru" as const, label: "RU" },
    { code: "ua" as const, label: "UA" },
  ];

  const currentLanguage =
    languages.find((item) => item.code === getLocaleCookieValue(locale)) ??
    languages[0];

  return (
    <div ref={wrapperRef} className={`relative ${mobile ? "w-full" : "w-fit"}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.nav.menu}
        className={`group inline-flex items-center gap-2 rounded-full border transition-all ${
          scrolled
            ? "border-slate-300/60 bg-transparent text-[#1E2A44] hover:border-slate-400/70 hover:bg-white/10"
            : "border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/20"
        } ${
          mobile ? "w-full justify-between px-4 py-3" : "h-10 px-3"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <Globe
            size={mobile ? 16 : 15}
            className={`transition-colors ${
              scrolled ? "text-[#1E2A44] group-hover:text-[#1E2A44]" : "text-white group-hover:text-white"
            }`}
          />
          {mobile ? <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{currentLanguage.label}</span> : null}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute z-[70] min-w-[120px] overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-2xl ${
            mobile ? "left-0 right-0 mt-3" : "right-0 mt-3"
          }`}
        >
          {languages.map((item) => {
            const isActive = getLocaleCookieValue(locale) === item.code;

            return (
              <button
                key={item.code}
                type="button"
                role="menuitem"
                onClick={() => {
                  setLocale(resolveLocale(item.code));
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-center px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.2em] transition-colors ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-black"
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
