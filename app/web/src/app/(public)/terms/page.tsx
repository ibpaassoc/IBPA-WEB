"use client";

import Link from "next/link";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

const termsSections = [
  {
    id: "1",
    title: "Acceptance of Terms",
    paragraphs: [
      "By accessing, browsing, or using the website of International Beauty Professionals Association, Inc. (\"IBPA,\" \"Association,\" \"we,\" \"our,\" or \"us\"), you acknowledge that you have read, understood, and agree to be legally bound by these Terms of Use, as well as all policies and documents referenced herein.",
      "If you do not agree to these Terms, you must immediately discontinue use of the website.",
      "These Terms constitute a legally binding agreement between you and the Association.",
    ],
  },
  {
    id: "2",
    title: "Nature and Purpose of the Website",
    paragraphs: [
      "The website is operated as a professional platform intended to support the development, recognition, and advancement of specialists within the beauty industry.",
      "The Association provides information regarding industry standards and professional practices, membership programs subject to eligibility review and approval, educational materials and professional resources, events, competitions, awards, networking opportunities, publications, media content, industry-related materials, and access to restricted member areas and services.",
      "The Association reserves the right to modify, suspend, restrict, or discontinue any part of the website or services at any time without prior notice.",
    ],
  },
  {
    id: "3",
    title: "Membership and Eligibility",
    bullets: [
      "Membership in the Association is selective and not open to all applicants.",
      "It requires submission of an application and supporting documentation.",
      "It is subject to review by the Membership Review Board.",
      "It is based on professional qualifications, experience, and demonstrated involvement in the industry.",
      "It is not guaranteed upon application or payment.",
    ],
    note: "The Association reserves the right, at its sole discretion, to approve, deny, suspend, or terminate membership in accordance with its governing documents, policies, and standards.",
  },
  {
    id: "4",
    title: "User Representations and Responsibilities",
    paragraphs: ["By using the website, you represent and warrant that:"],
    bullets: [
      "all information you provide is accurate, complete, and up to date",
      "you will comply with all applicable laws and regulations",
      "you will not use the website for unlawful, fraudulent, or unauthorized purposes",
      "you will not attempt to interfere with the operation, security, or integrity of the website",
      "you will not attempt to gain unauthorized access to systems, data, or accounts",
      "you will not misuse or exploit any content or materials available on the website",
      "you will not impersonate any person or entity or misrepresent your affiliation with the Association",
    ],
  },
  {
    id: "5",
    title: "Intellectual Property Rights",
    paragraphs: [
      "All content and materials available on the website, including text, documents, publications, logos, trademarks, branding elements, graphics, images, design, databases, website structure, and layout are the exclusive property of the Association or its licensors and are protected under applicable intellectual property laws.",
      "No content may be copied, reproduced, distributed, modified, transmitted, displayed, or used for commercial purposes without the prior written consent of the Association.",
      "Unauthorized use may result in legal action.",
    ],
  },
  {
    id: "6",
    title: "Payments, Fees, and Financial Terms",
    paragraphs: [
      "All payments made through the website, including membership fees, event registrations, and other charges, are processed through third-party payment providers and must be paid in accordance with the terms presented at the time of transaction.",
      "Unless explicitly stated otherwise, all payments are non-refundable, including in cases of cancellation, termination, or non-approval of membership, except as may be specifically outlined in applicable policies.",
    ],
  },
  {
    id: "7",
    title: "Cancellation and Membership Termination",
    paragraphs: [
      "Membership cancellation, termination, and refund conditions are governed exclusively by the Cancellation & Membership Termination Policy.",
      "By applying for membership or using the website, you acknowledge that you have read and agree to that policy.",
    ],
  },
  {
    id: "8",
    title: "Limitation of Liability",
    paragraphs: ["To the fullest extent permitted by applicable law, the Association, including its directors, officers, committee members, employees, contractors, agents, and affiliates, shall not be liable for damages arising out of or related to:"],
    bullets: [
      "the use or inability to use the website",
      "reliance on any information provided",
      "errors, omissions, or inaccuracies in content",
      "service interruptions or technical failures",
      "unauthorized access to or loss of data",
      "participation in events, programs, or services",
    ],
    note: "This limitation includes indirect, incidental, consequential, special damages, loss of business, revenue, profits, opportunities, reputational harm, and data loss or corruption, regardless of the legal theory asserted.",
  },
  {
    id: "9",
    title: "Disclaimer of Guarantees",
    paragraphs: ["The Association provides professional and educational resources; however, it does not guarantee:"],
    bullets: [
      "acceptance into membership",
      "professional recognition or success",
      "awards, titles, or competition outcomes",
      "licensing, certification, or regulatory approval",
      "business growth, income, or client acquisition",
    ],
    note: "All information is provided for general informational and professional development purposes only and does not constitute legal, financial, or professional advice. Users remain solely responsible for their professional and business decisions.",
  },
  {
    id: "10",
    title: "Third-Party Services and External Links",
    paragraphs: [
      "The website may include links to or integrations with third-party services, platforms, or websites.",
      "The Association does not control such third-party services, does not guarantee their accuracy, reliability, or availability, and is not responsible for their content, policies, or practices.",
      "Use of third-party services is at the user's own risk.",
    ],
  },
  {
    id: "11",
    title: "Suspension and Termination of Access",
    paragraphs: ["The Association reserves the right, at its sole discretion and without prior notice, to suspend or restrict access to the website, terminate user accounts, revoke membership privileges, remove or restrict access to content, and deny future access to services."],
    bullets: [
      "violation of these Terms or any Association policies",
      "false or misleading information",
      "conduct harmful to the Association",
      "conduct inconsistent with the Association's mission, standards, or reputation",
    ],
    note: "Termination does not entitle the user to any refund unless expressly provided.",
  },
  {
    id: "12",
    title: "Modifications to Terms and Website",
    paragraphs: [
      "The Association reserves the right to modify, update, or revise these Terms of Use, related policies, website content and functionality, membership programs, and services at any time without prior notice.",
      "Updated Terms become effective upon publication. Continued use of the website constitutes acceptance of such changes.",
    ],
  },
  {
    id: "13",
    title: "Governing Law and Jurisdiction",
    paragraphs: [
      "These Terms shall be governed by and interpreted in accordance with the laws of the State of California, United States.",
      "Any disputes arising out of or related to these Terms or the use of the website shall be subject to the exclusive jurisdiction of the courts located in California.",
      "Users agree to submit to such jurisdiction.",
    ],
  },
  {
    id: "14",
    title: "Entire Agreement",
    paragraphs: [
      "These Terms, together with all referenced policies, including Privacy Policy, Cancellation Policy, Code of Ethics, and Membership Policies, constitute the entire agreement between the user and the Association.",
      "They supersede all prior agreements, communications, or understandings.",
    ],
  },
  {
    id: "15",
    title: "Severability",
    paragraphs: ["If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect."],
  },
  {
    id: "16",
    title: "Waiver",
    paragraphs: ["Failure by the Association to enforce any provision shall not constitute a waiver of that provision or any other rights."],
  },
  {
    id: "17",
    title: "Contact Information",
    paragraphs: [
      "International Beauty Professionals Association, Inc.",
      "Email: info@ibpassociations.org",
      "Address: 1220 Melody Ln, Suite 110, Roseville, CA 95678, United States",
    ],
  },
];

export default function TermsPage() {
  const { locale } = useI18n();
  const isRu = locale === "ru";
  const useEnglishTypography = true;
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";

  return (
    <div className="min-h-screen bg-[#F1F3F5] pt-40 pb-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <section className="rounded-[48px] border border-slate-100 bg-white p-10 md:p-16">
          <div className="max-w-4xl space-y-6">
            <p className={`text-[10px] uppercase tracking-[0.4em] text-[#708090] ${uiClassName}`}>
              {isRu ? "Условия использования" : "Terms of Use"}
            </p>
            <h1 className={`text-4xl uppercase leading-none text-slate-900 md:text-7xl ${headlineClassName}`}>
              Terms Of <span className="text-[#72A0C1]">Use</span>
            </h1>
            <p className={`text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
              {isRu
                ? "Ниже размещён официальный текст Terms of Use в исходной английской версии, чтобы сохранить юридическую точность и силу формулировок."
                : "Below is the official Terms of Use presented in its original legal wording."}
            </p>
            <div className="rounded-[28px] border border-slate-200 bg-[#F8FBFD] px-6 py-5">
              <p className={`text-[10px] uppercase tracking-[0.3em] text-slate-400 ${uiClassName}`}>
                {isRu ? "Дата вступления в силу" : "Effective Date"}
              </p>
              <p className={`mt-2 text-lg text-slate-900 ${bodyClassName}`}>March 20, 2026</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          {termsSections.map((section) => (
            <article key={section.id} className="rounded-[36px] border border-slate-100 bg-white p-8 shadow-sm md:p-10">
              <div className="space-y-3">
                <p className={`text-[10px] uppercase tracking-[0.3em] text-[#708090] ${uiClassName}`}>{section.id}</p>
                <h2 className={`text-2xl uppercase text-slate-900 md:text-4xl ${headlineClassName}`}>{section.title}</h2>
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

        <section className="rounded-[40px] border border-slate-100 bg-white p-8 md:p-10">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/privacy" className={`inline-flex justify-center rounded-full bg-black px-8 py-4 text-sm uppercase text-white ${uiClassName}`}>
              {isRu ? "Политика конфиденциальности" : "Privacy Policy"}
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
