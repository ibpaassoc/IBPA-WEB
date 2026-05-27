"use client";

import Link from "next/link";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

const privacySections = [
  {
    id: "1",
    title: "Introduction",
    paragraphs: [
      "International Beauty Professionals Association, Inc. (\"IBPA,\" \"Association,\" \"we,\" \"our,\" or \"us\") respects your privacy and is committed to protecting your personal information.",
      "This Privacy Policy explains how we collect, use, store, share, and protect your information when you visit our website, apply for membership, become a member, register for events, communicate with us, or otherwise interact with the Association.",
      "By using our website or submitting your information, you agree to the terms of this Privacy Policy.",
    ],
  },
  {
    id: "2",
    title: "Information We Collect",
    paragraphs: ["We may collect the following categories of information:"],
    bullets: [
      "Personal Information: full name, email address, phone number, mailing address, country/state of residence",
      "Professional Information: profession and specialization, work experience, education and certifications, licenses (if applicable), portfolio or social media links, business name or brand affiliation",
      "Membership Information: membership category, application materials, documents submitted for review, membership status, participation history",
      "Payment Information: payment records processed via third-party providers and billing details, where applicable",
      "Technical Data: IP address, browser type, device information, website usage data, analytics, and cookies",
    ],
    note: "We do not store full credit card details. Payments are processed securely through third-party payment processors.",
  },
  {
    id: "3",
    title: "How We Use Information",
    bullets: [
      "to process membership applications",
      "to evaluate applicants through the Membership Review Board",
      "to manage membership accounts",
      "to provide access to member benefits",
      "to organize events, competitions, and programs",
      "to communicate with members and applicants",
      "to send important updates and notices",
      "to improve our website and services",
      "to ensure compliance with our policies and standards",
      "to maintain internal records and documentation",
    ],
  },
  {
    id: "4",
    title: "Membership Review and Data Use",
    paragraphs: ["By submitting an application, you acknowledge that:"],
    bullets: [
      "your information will be reviewed by the Membership Review Board",
      "your documents may be evaluated for eligibility and qualifications",
      "your data may be stored for internal recordkeeping",
      "acceptance into the Association is not guaranteed",
    ],
  },
  {
    id: "5",
    title: "Sharing of Information",
    paragraphs: ["We do not sell personal data. We may share information only in the following cases:"],
    bullets: [
      "Internal Use: with authorized personnel, including the Board of Directors, Membership Review Board, committees, and reviewers",
      "Service Providers: with trusted third parties providing payment processing, website hosting, email services, and analytics",
      "Legal Requirements: if required by law, regulation, or legal process",
    ],
  },
  {
    id: "6",
    title: "Public Information",
    paragraphs: [
      "If you become a member, certain information may be publicly displayed, including your name, membership category, location, professional title, and profile in the member directory.",
      "You consent to such display by becoming a member.",
    ],
  },
  {
    id: "7",
    title: "Data Retention",
    bullets: [
      "as long as necessary for membership and operations",
      "for legal, administrative, and compliance purposes",
      "even after membership termination, where required",
    ],
  },
  {
    id: "8",
    title: "Data Security",
    paragraphs: [
      "We take reasonable administrative, technical, and organizational measures to protect your information.",
      "However, no system is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    id: "9",
    title: "Your Rights",
    paragraphs: ["Depending on your location, including California, you may have the right to:"],
    bullets: [
      "request access to your data",
      "request correction of inaccurate information",
      "request deletion of your data, where applicable",
      "request limitation of data use",
    ],
    note: "To make a request, contact us using the information below.",
  },
  {
    id: "10",
    title: "Cookies and Tracking",
    paragraphs: ["Our website may use cookies and similar technologies to:"],
    bullets: [
      "improve user experience",
      "analyze website traffic",
      "remember user preferences",
    ],
    note: "You can control cookies through your browser settings.",
  },
  {
    id: "11",
    title: "Third-Party Links",
    paragraphs: ["Our website may contain links to third-party websites. We are not responsible for their privacy practices."],
  },
  {
    id: "12",
    title: "Children's Privacy",
    paragraphs: ["Our services are not intended for individuals under 18. We do not knowingly collect data from minors."],
  },
  {
    id: "13",
    title: "Changes to This Policy",
    paragraphs: ["We may update this Privacy Policy at any time. Updated versions will be posted on the website with a revised effective date."],
  },
  {
    id: "14",
    title: "Contact Information",
    paragraphs: [
      "International Beauty Professionals Association, Inc.",
      "Email: support@ibpassociations.org",
      "Address: 1220 Melody Ln, Suite 110, Roseville, CA 95678, United States",
    ],
  },
  {
    id: "15",
    title: "Governing Law",
    paragraphs: ["This Privacy Policy is governed by the laws of the State of California, United States."],
  },
];

export default function PrivacyPage() {
  const { locale } = useI18n();
  const isRu = locale === "ru";
  const useEnglishTypography = true;
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";

  return (
    <div className="min-h-screen bg-white pt-40 pb-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <section className="rounded-[48px] border border-slate-100 bg-[#F8FBFD] p-10 md:p-16">
          <div className="max-w-4xl space-y-6">
            <p className={`text-[10px] uppercase tracking-[0.4em] text-[#708090] ${uiClassName}`}>
              {isRu ? "Политика конфиденциальности" : "Privacy Policy"}
            </p>
            <h1 className={`text-4xl uppercase leading-none text-slate-900 md:text-7xl ${headlineClassName}`}>
              <span className="text-[#72A0C1]">Privacy</span> Policy
            </h1>
            <p className={`text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
              {isRu
                ? "Ниже размещён официальный текст Privacy Policy в исходной английской версии, чтобы сохранить юридическую точность формулировок."
                : "Below is the official Privacy Policy presented in its original legal wording."}
            </p>
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5">
              <p className={`text-[10px] uppercase tracking-[0.3em] text-slate-400 ${uiClassName}`}>
                {isRu ? "Дата вступления в силу" : "Effective Date"}
              </p>
              <p className={`mt-2 text-lg text-slate-900 ${bodyClassName}`}>March 20, 2026</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          {privacySections.map((section) => (
            <article key={section.id} className="rounded-[36px] border border-slate-100 bg-white p-8 shadow-sm md:p-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <p className={`text-[10px] uppercase tracking-[0.3em] text-[#708090] ${uiClassName}`}>{section.id}</p>
                  <h2 className={`text-2xl uppercase text-slate-900 md:text-4xl ${headlineClassName}`}>{section.title}</h2>
                </div>
              </div>

              <div className={`mt-6 space-y-4 text-base leading-relaxed text-slate-600 ${bodyClassName}`}>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {section.bullets ? (
                  <ul className="space-y-3 pt-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#72A0C1]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.note ? <p className={`rounded-[24px] bg-[#F8FBFD] px-5 py-4 italic text-slate-500 ${bodyClassName}`}>{section.note}</p> : null}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[40px] border border-slate-100 bg-[#F8FBFD] p-8 md:p-10">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/terms" className={`inline-flex justify-center rounded-full bg-black px-8 py-4 text-sm uppercase text-white ${uiClassName}`}>
              {isRu ? "Условия использования" : "Terms of Use"}
            </Link>
            <Link href="/cancellation-policy" className={`inline-flex justify-center rounded-full border border-slate-200 px-8 py-4 text-sm uppercase text-slate-900 ${uiClassName}`}>
              {isRu ? "Политика отмены" : "Cancellation Policy"}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
