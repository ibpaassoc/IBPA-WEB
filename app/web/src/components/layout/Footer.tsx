"use client";

import Link from "next/link";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useI18n } from "@/lib/i18n";

export const Footer = () => {
  const { locale } = useI18n();
  const currentYear = new Date().getFullYear();
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.12em]";

  const copy =
    locale === "ru"
      ? {
          about: "Об ассоциации",
          membership: "Сообщество",
          criteria: "Критерии",
          standards: "Стандарты",
          contact: "Контакты",
          memberDirectory: "Каталог мемберов",
          apply: "Подать заявку",
          description:
            "International Beauty Professionals Association (IBPA) развивает профессиональные стандарты и международное сотрудничество в индустрии красоты.",
          email: "Email",
          call: "Позвонить",
          map: "Карта",
          siteMap: "Карта сайта",
          contactInfo: "Контакты",
          policies: "Политики",
          faq: "FAQ",
          governance: "Управление",
          events: "События",
          news: "Новости",
          partnership: "Партнерство",
          copyrightTagline: "Профессиональные стандарты, образование и глобальное сотрудничество.",
          social: "Социальные сети",
          privacy: "Политика конфиденциальности",
          terms: "Условия использования",
          cancellation: "Политика отмены",
        }
      : locale === "uk"
        ? {
            about: "Про асоціацію",
            membership: "Спільнота",
            criteria: "Критерії",
            standards: "Стандарти",
            contact: "Контакти",
            memberDirectory: "Каталог мемберів",
            apply: "Подати заявку",
            description:
              "International Beauty Professionals Association (IBPA) розвиває професійні стандарти та міжнародну співпрацю в індустрії краси.",
            email: "Email",
            call: "Зателефонувати",
            map: "Мапа",
            siteMap: "Мапа сайту",
            contactInfo: "Контакти",
            policies: "Політики",
            faq: "FAQ",
            governance: "Управління",
            events: "Події",
            news: "Новини",
            partnership: "Партнерство",
            copyrightTagline: "Професійні стандарти, освіта та глобальна співпраця.",
            social: "Соціальні мережі",
            privacy: "Політика конфіденційності",
            terms: "Умови використання",
            cancellation: "Політика скасування",
          }
        : {
            about: "About",
            membership: "Membership",
            criteria: "Criteria",
            standards: "Standards",
            contact: "Contact",
            memberDirectory: "Member Directory",
            apply: "Apply Now",
            description:
              "International Beauty Professionals Association (IBPA) is dedicated to elevating professional standards and fostering global collaboration in the beauty industry.",
            email: "Email",
            call: "Call",
            map: "Map",
            siteMap: "Site Map",
            contactInfo: "Contact Info",
            policies: "Policies",
            faq: "FAQ",
            governance: "Governance",
            events: "Events",
            news: "News",
            partnership: "Partnership",
            copyrightTagline: "Professional standards, education, and global collaboration.",
            social: "Social Media",
            privacy: "Privacy Policy",
            terms: "Terms of Use",
            cancellation: "Cancellation Policy",
          };

  const footerLinks = [
    { name: copy.about, href: "/about" },
    { name: copy.membership, href: "/membership" },
    { name: copy.criteria, href: "/criteria" },
    { name: copy.standards, href: "/standards" },
    { name: copy.faq, href: "/faq" },
    { name: copy.governance, href: "/governance" },
    { name: copy.events, href: "/events" },
    { name: copy.news, href: "/news" },
    { name: copy.partnership, href: "/partnership" },
    { name: copy.contact, href: "/contact" },
    { name: copy.apply, href: "/apply" },
  ];

  const legalLinks = [
    { name: copy.privacy, href: "/privacy" },
    { name: copy.terms, href: "/terms" },
    { name: copy.cancellation, href: "/cancellation-policy" },
  ];

  return (
    <footer className="border-t border-slate-700 bg-slate-900 pb-12 pt-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 grid gap-16 lg:grid-cols-4">
          <div className="space-y-8 lg:col-span-2">
            <Link href="/" className="inline-block">
              <ImageWithFallback src="/branding/footer-logo-transparent.webp" alt="IBPA" className="h-14 w-auto object-contain md:h-16" />
            </Link>
            <p className={`max-w-md text-lg leading-relaxed text-slate-300 ${bodyClassName}`}>
              {copy.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:support@ibpassociations.org"
                className={`inline-flex items-center gap-2 rounded-full border border-slate-600 px-4 py-2 text-xs uppercase text-slate-200 transition-colors hover:border-[#72A0C1] hover:text-white ${uiClassName}`}
              >
                <Mail size={14} />
                {copy.email}
              </a>
              <a
                href="tel:+12792302804"
                className={`inline-flex items-center gap-2 rounded-full border border-slate-600 px-4 py-2 text-xs uppercase text-slate-200 transition-colors hover:border-[#72A0C1] hover:text-white ${uiClassName}`}
              >
                <Phone size={14} />
                {copy.call}
              </a>
              <a
                href="https://maps.google.com/?q=1220+Melody+Ln+Suite+110,+Roseville,+CA+95678"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-full border border-slate-600 px-4 py-2 text-xs uppercase text-slate-200 transition-colors hover:border-[#72A0C1] hover:text-white ${uiClassName}`}
              >
                <MapPin size={14} />
                {copy.map}
              </a>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className={`text-sm uppercase text-white ${uiClassName}`}>{copy.siteMap}</h4>
            <ul className="space-y-4">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className={`text-sm text-slate-300 transition-colors hover:text-white ${bodyClassName}`}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className={`text-sm uppercase text-white ${uiClassName}`}>{copy.contactInfo}</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <MapPin size={18} className="flex-shrink-0 text-[#72A0C1]" />
                <span className={`text-sm leading-relaxed text-slate-300 ${bodyClassName}`}>
                  1220 Melody Ln, Suite 110,<br />
                  Roseville, CA 95678
                </span>
              </li>
              <li className="flex gap-4">
                <Phone size={18} className="flex-shrink-0 text-[#72A0C1]" />
                <span className={`text-sm text-slate-300 ${bodyClassName}`}>+1 (279) 230-2804</span>
              </li>
              <li className="flex gap-4">
                <Mail size={18} className="flex-shrink-0 text-[#72A0C1]" />
                <span className={`whitespace-nowrap text-sm text-slate-300 ${bodyClassName}`}>support@ibpassociations.org</span>
              </li>
            </ul>
            <div className="space-y-4 pt-2">
              <h4 className={`text-sm uppercase text-white ${uiClassName}`}>{copy.social}</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://www.instagram.com/bbeauty_forum/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-3 text-sm text-slate-300 transition-colors hover:text-white ${bodyClassName}`}
                  >
                    <Instagram size={16} className="text-[#72A0C1]" />
                    @bbeauty_forum
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4 pt-2">
              <h4 className={`text-sm uppercase text-white ${uiClassName}`}>{copy.policies}</h4>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className={`text-sm text-slate-300 transition-colors hover:text-white ${bodyClassName}`}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-700 pt-12 md:flex-row">
          <p className={`text-[10px] uppercase text-slate-400 ${uiClassName}`}>
            © {currentYear} International Beauty Professionals Association, Inc.
          </p>
          <div className="flex flex-col items-center gap-4 md:items-end">
            <LanguageSwitcher />
            <p className={`text-[10px] uppercase text-slate-400 ${uiClassName}`}>
              {copy.copyrightTagline}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
