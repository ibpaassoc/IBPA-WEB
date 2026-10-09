"use client";
import React, { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

type NavbarProps = {
  dashboardHref?: string;
};

export const Navbar = ({ dashboardHref = "/dashboard" }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const isMembersPage = pathname === "/members" || pathname.startsWith("/members/");
  const isReadableTextPage =
    pathname === "/apply" ||
    pathname === "/partnership" ||
    pathname === "/news" ||
    pathname === "/events" ||
    pathname === "/faq";
  const isCyrillicLocale = locale === "ru" || locale === "uk";
  const useEnglishTypography = true;
  const navClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-extrabold ${isCyrillicLocale ? "tracking-[0.08em]" : "tracking-[0.14em]"}`
    : `${cyrillicDisplay.className} font-medium tracking-[0.08em]`;
  const ctaClassName = "font-sans font-semibold tracking-[0.08em]";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t.nav.about, href: "/about" },
    { name: t.nav.membership, href: "/membership" },
    { name: t.nav.governance, href: "/governance" },
    { name: t.nav.criteria, href: "/criteria" },
    { name: t.nav.standards, href: "/standards" },
    { name: t.nav.contact, href: "/contact" },
  ];
  const desktopNavLinks = navLinks.filter((link) => link.href !== "/governance");

  const useReadableHeader = scrolled || isMembersPage;
  const useReadableTextColors = useReadableHeader || isReadableTextPage;
  const useDarkLogo = useReadableHeader || isReadableTextPage;
  const navShellClassName = useReadableHeader
    ? "bg-white/88 py-4 shadow-sm backdrop-blur-md lg:py-[1.33rem]"
    : "bg-transparent py-5 lg:py-[2.4rem]";
  const desktopLinkColorClassName = useReadableTextColors
    ? "text-[#1E2A44] hover:text-slate-900"
    : "text-white/80 hover:text-white";
  const loginClassName = useReadableTextColors
    ? "border-white/50 bg-white/20 text-slate-700 hover:bg-white/40 hover:text-black"
    : "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white";
  const mobileToggleClassName = useReadableTextColors
    ? "border-slate-200 bg-white/90 text-slate-900 shadow-sm"
    : "border-white/30 bg-white/10 text-white backdrop-blur-md";
  const logoClassName = "h-14 w-auto object-contain md:h-16";

  return (
    <nav className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ${navShellClassName}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link href="/" aria-label="IBPA home" className="inline-flex items-center">
          <ImageWithFallback
            src={useDarkLogo ? "/branding/logo-header.webp" : "/branding/header-logo-transparent.webp"}
            alt="IBPA"
            className={logoClassName}
          />
        </Link>

        {/* Desktop Nav */}
        <div className={`hidden lg:flex items-center ${isCyrillicLocale ? "gap-5" : "gap-8"}`}>
          <div className={`flex items-center ${isCyrillicLocale ? "gap-5" : "gap-8"}`}>
            {desktopNavLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className={`whitespace-nowrap uppercase transition-colors ${desktopLinkColorClassName} ${isCyrillicLocale ? "text-[11.75px]" : "text-[13.5px]"} ${navClassName}`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className={`flex items-center ${isCyrillicLocale ? "gap-3" : "gap-4"}`}>
            <LanguageSwitcher scrolled={useReadableTextColors} />
            <Link
              href={dashboardHref}
              className={`shrink-0 whitespace-nowrap rounded-full border uppercase backdrop-blur-sm transition-all flex items-center ${loginClassName} ${isCyrillicLocale ? "px-4 py-[0.72rem] text-[10px]" : "px-5 py-[0.76rem] text-[10.5px]"} ${ctaClassName}`}
            >
              {t.nav.login}
            </Link>
            <Link 
              href="/apply"
              className={`shrink-0 whitespace-nowrap bg-black text-white rounded-full uppercase hover:scale-105 transition-all shadow-xl flex items-center ${isCyrillicLocale ? "gap-2 px-6 py-[0.88rem] text-[11px]" : "gap-2.5 px-8 py-[0.92rem] text-[12px]"} ${ctaClassName}`}
            >
              {t.nav.apply} <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          type="button"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          className={`rounded-full border p-2 lg:hidden ${mobileToggleClassName}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-navigation"
        className={`fixed left-0 top-[76px] h-[calc(100vh-76px)] w-full border-t border-slate-100 bg-white/95 p-8 shadow-2xl backdrop-blur-3xl transition-all duration-300 lg:hidden ${
          isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
          <div className="flex flex-col gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`text-sm uppercase text-slate-700 hover:text-black ${navClassName}`}
            >
              {link.name}
            </Link>
          ))}
          <Link 
            href="/apply"
            onClick={() => setIsOpen(false)}
            className={`rounded-full bg-black px-8 py-4 text-center text-xs uppercase text-white ${ctaClassName}`}
          >
            {t.nav.apply}
          </Link>
          <Link
            href={dashboardHref}
            onClick={() => setIsOpen(false)}
            className={`rounded-full border border-slate-200 px-8 py-4 text-center text-xs uppercase text-slate-800 ${ctaClassName}`}
          >
            {t.nav.login}
          </Link>
          <div className="pt-2">
            <LanguageSwitcher mobile scrolled={useReadableTextColors} />
          </div>
        </div>
      </div>
    </nav>
  );
};
