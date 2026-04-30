"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, FileText, ShieldCheck } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateAccent, homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

type DocumentEntry = {
  slug: string;
  title: {
    en: string;
    ru: string;
    uk: string;
  };
  description: {
    en: string;
    ru: string;
    uk: string;
  };
};

const documents: DocumentEntry[] = [
  {
    slug: "professional-standards.pdf",
    title: {
      en: "Professional Standards",
      ru: "Профессиональные стандарты",
      uk: "Професійні стандарти",
    },
    description: {
      en: "Core professional expectations, quality benchmarks, and the framework that supports ethical practice across the beauty industry.",
      ru: "Базовый документ с профессиональными ожиданиями, критериями качества и основой ответственной работы в индустрии красоты.",
      uk: "Базовий документ із професійними очікуваннями, критеріями якості та основою відповідальної роботи в індустрії краси.",
    },
  },
  {
    slug: "code-of-ethics.pdf",
    title: {
      en: "Code of Ethics",
      ru: "Кодекс этики",
      uk: "Кодекс етики",
    },
    description: {
      en: "Guiding principles for professional conduct, respectful communication, client care, and ethical representation.",
      ru: "Принципы профессиональной этики, уважительной коммуникации, заботы о клиентах и корректного позиционирования.",
      uk: "Принципи професійної етики, шанобливої комунікації, турботи про клієнтів і коректного позиціонування.",
    },
  },
  {
    slug: "membership-policy.pdf",
    title: {
      en: "Membership Policy",
      ru: "Политика членства",
      uk: "Політика членства",
    },
    description: {
      en: "Membership framework, eligibility logic, expectations for participants, and baseline policy structure.",
      ru: "Политика участия, логика допуска, ожидания к участникам и базовая структура правил сообщества.",
      uk: "Політика участі, логіка допуску, очікування до учасників і базова структура правил спільноти.",
    },
  },
  {
    slug: "membership-agreement.pdf",
    title: {
      en: "Membership Agreement",
      ru: "Соглашение о членстве",
      uk: "Угода про членство",
    },
    description: {
      en: "Agreement template covering participant responsibilities, association expectations, and accepted use of status.",
      ru: "Соглашение с обязанностями участника, ожиданиями ассоциации и правилами использования статуса.",
      uk: "Угода з обов’язками учасника, очікуваннями асоціації та правилами використання статусу.",
    },
  },
  {
    slug: "membership-review-procedure.pdf",
    title: {
      en: "Membership Review Procedure",
      ru: "Процедура рассмотрения заявок",
      uk: "Процедура розгляду заявок",
    },
    description: {
      en: "Review process, evaluation flow, and the internal structure used to assess applications and supporting materials.",
      ru: "Процедура рассмотрения заявок, этапы оценки и внутренняя логика проверки анкет и приложенных материалов.",
      uk: "Процедура розгляду заявок, етапи оцінювання та внутрішня логіка перевірки анкет і доданих матеріалів.",
    },
  },
  {
    slug: "awards-and-recognition-policy.pdf",
    title: {
      en: "Awards & Recognition Policy",
      ru: "Политика наград и признания",
      uk: "Політика нагород і визнання",
    },
    description: {
      en: "Recognition criteria, honorary distinctions, and the principles used to acknowledge contribution and excellence.",
      ru: "Критерии признания, почетные статусы и принципы, по которым отмечаются вклад и профессиональное качество.",
      uk: "Критерії визнання, почесні статуси та принципи, за якими відзначаються внесок і професійна якість.",
    },
  },
  {
    slug: "governance-policy.pdf",
    title: {
      en: "Governance Policy",
      ru: "Политика управления",
      uk: "Політика управління",
    },
    description: {
      en: "Association governance principles, decision-making structure, and the baseline operating framework.",
      ru: "Принципы управления ассоциацией, структура принятия решений и общая модель внутренней работы.",
      uk: "Принципи управління асоціацією, структура ухвалення рішень і загальна модель внутрішньої роботи.",
    },
  },
  {
    slug: "board-officers-and-committee-governance-policy.pdf",
    title: {
      en: "Board, Officers & Committee Governance Policy",
      ru: "Политика управления советом, офицерами и комитетами",
      uk: "Політика управління радою, офіцерами та комітетами",
    },
    description: {
      en: "Roles, authority lines, and governance responsibilities for directors, officers, and committee leadership.",
      ru: "Роли, зоны ответственности и линия полномочий для директоров, должностных лиц и руководителей комитетов.",
      uk: "Ролі, зони відповідальності та лінія повноважень для директорів, посадових осіб і керівників комітетів.",
    },
  },
  {
    slug: "committee-charters-policy.pdf",
    title: {
      en: "Committee Charters Policy",
      ru: "Политика комитетов и рабочих групп",
      uk: "Політика комітетів і робочих груп",
    },
    description: {
      en: "Committee mandates, scope of work, and how special working groups operate within the association.",
      ru: "Мандаты комитетов, круг задач и порядок работы профильных рабочих групп внутри ассоциации.",
      uk: "Мандати комітетів, коло завдань і порядок роботи профільних робочих груп усередині асоціації.",
    },
  },
  {
    slug: "conflict-of-interest-policy.pdf",
    title: {
      en: "Conflict of Interest Policy",
      ru: "Политика конфликта интересов",
      uk: "Політика конфлікту інтересів",
    },
    description: {
      en: "Standards for identifying, disclosing, and managing personal or business conflicts that may affect decisions.",
      ru: "Правила выявления, раскрытия и урегулирования личных и деловых конфликтов интересов.",
      uk: "Правила виявлення, розкриття та врегулювання особистих і ділових конфліктів інтересів.",
    },
  },
  {
    slug: "record-retention-policy.pdf",
    title: {
      en: "Record Retention Policy",
      ru: "Политика хранения документов",
      uk: "Політика зберігання документів",
    },
    description: {
      en: "Document retention expectations, storage logic, and internal reference rules for organizational records.",
      ru: "Политика хранения документов, логика архивирования и внутренние правила работы с организационными данными.",
      uk: "Політика зберігання документів, логіка архівування та внутрішні правила роботи з організаційними даними.",
    },
  },
  {
    slug: "bylaws-english.pdf",
    title: {
      en: "Bylaws (English)",
      ru: "Устав (английская версия)",
      uk: "Статут (англійська версія)",
    },
    description: {
      en: "Formal governing rules of the association, including structure, authority, voting, and foundational procedures.",
      ru: "Формальные учредительные правила ассоциации: структура, полномочия, голосование и базовые процедуры.",
      uk: "Формальні установчі правила асоціації: структура, повноваження, голосування та базові процедури.",
    },
  },
  {
    slug: "privacy-policy.pdf",
    title: {
      en: "Privacy Policy",
      ru: "Политика конфиденциальности",
      uk: "Політика конфіденційності",
    },
    description: {
      en: "Privacy notice outlining how information may be collected, stored, processed, and protected.",
      ru: "Политика конфиденциальности с описанием того, как данные могут собираться, храниться, обрабатываться и защищаться.",
      uk: "Політика конфіденційності з описом того, як дані можуть збиратися, зберігатися, оброблятися та захищатися.",
    },
  },
  {
    slug: "terms-of-use.pdf",
    title: {
      en: "Terms of Use",
      ru: "Условия использования",
      uk: "Умови використання",
    },
    description: {
      en: "Platform and website usage terms, including user responsibilities, limitations, and general conditions.",
      ru: "Условия использования сайта и платформы, включая обязанности пользователей, ограничения и общие положения.",
      uk: "Умови використання сайту та платформи, включно з обов’язками користувачів, обмеженнями та загальними положеннями.",
    },
  },
  {
    slug: "cancellation-policy-ibpa.pdf",
    title: {
      en: "Cancellation Policy",
      ru: "Политика отмены",
      uk: "Політика скасування",
    },
    description: {
      en: "Cancellation, refund, and policy handling guidance for association-related payments and participation.",
      ru: "Правила отмены, возврата и обработки платежей и участия, связанных с ассоциацией.",
      uk: "Правила скасування, повернення та обробки платежів і участі, пов’язаних з асоціацією.",
    },
  },
];

export default function Standards() {
  const { locale } = useI18n();
  const isRu = locale === "ru";
  const isUk = locale === "uk";
  const useEnglishTypography = true;
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-bold tracking-[-0.045em]`
    : `${cyrillicDisplay.className} font-light tracking-[-0.03em]`;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";

  const copy = {
    eyebrow: isRu ? "Библиотека документов" : isUk ? "Бібліотека документів" : "Document Library",
    title: isRu ? "Документы и стандарты IBPA" : isUk ? "Документи та стандарти IBPA" : "IBPA Documents & Standards",
    subtitle: isRu
      ? "Ключевые внутренние документы, политики и регламенты IBPA в одном архиве. Каждый файл открывается в новой вкладке."
      : isUk
        ? "Ключові внутрішні документи, політики та регламенти IBPA в одному архіві. Кожен файл відкривається в новій вкладці."
        : "Core internal documents, policies, and governance files of IBPA in one archive. Each file opens in a new tab.",
    introTitle: isRu ? "Единый архив для работы команды" : isUk ? "Єдиний архів для роботи команди" : "A Central Archive for Team Use",
    introBody: isRu
      ? "Библиотека включает стандарты, governance-документы, membership-политики, юридические материалы и внутренние процедуры. Сейчас файлы можно использовать как структурную основу и заглушки для будущего наполнения."
      : isUk
        ? "Бібліотека включає стандарти, governance-документи, membership-політики, юридичні матеріали та внутрішні процедури. Наразі файли можна використовувати як структурну основу та заглушки для майбутнього наповнення."
        : "The library includes standards, governance documents, membership policies, legal materials, and internal procedures. For now, the files can serve as structural placeholders and future-ready reference documents.",
    archiveLabel: isRu ? "Документов в библиотеке" : isUk ? "Документів у бібліотеці" : "Documents in the library",
    archiveValue: `${documents.length}`,
    cta: isRu ? "Открыть PDF" : isUk ? "Відкрити PDF" : "Open PDF",
    helper: isRu
      ? "Все документы открываются в новой вкладке. При необходимости их можно в будущем заменить финальными версиями без изменения структуры страницы."
      : isUk
        ? "Усі документи відкриваються в новій вкладці. За потреби їх можна в майбутньому замінити фінальними версіями без зміни структури сторінки."
        : "All documents open in a new tab. They can be replaced later with final versions without changing the structure of the page.",
  };

  return (
    <div className="min-h-screen bg-white selection:bg-[#B9D9EB] selection:text-black">
      <section className="relative flex h-[calc(60vh+70px)] items-center justify-center overflow-hidden bg-[#F1F3F5]">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="/home/website-9.webp"
            className="h-full w-full object-cover md:object-[center_28%]"
            alt={isRu ? "Документы IBPA" : isUk ? "Документи IBPA" : "IBPA documents"}
          />
        </div>
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-24 md:py-32">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`max-w-5xl text-6xl sm:text-7xl uppercase leading-[0.92] text-[#B9D9EB] md:text-9xl ${headlineClassName}`}
          >
            {copy.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className={`max-w-3xl text-3xl lowercase text-slate-400 md:-mt-6 md:text-5xl ${homeTemplateAccent.className}`}
          >
            {isRu ? "архив документов" : isUk ? "архів документів" : "document archive"}
          </motion.p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className={`text-4xl uppercase leading-[0.94] text-slate-900 md:text-[4.85rem] ${headlineClassName}`}>
              {copy.introTitle}
            </h2>
            <p className={`max-w-2xl text-lg leading-relaxed text-slate-600 md:text-[1.18rem] ${bodyClassName}`}>{copy.introBody}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="rounded-[36px] bg-[#F1F3F5] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#72A0C1] shadow-[0_12px_34px_rgba(39,54,72,0.05)]">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-1">
                <p className={`text-[10px] uppercase text-slate-400 ${uiClassName}`}>{copy.archiveLabel}</p>
                <p className={`text-5xl leading-none text-slate-900 ${headlineClassName}`}>{copy.archiveValue}</p>
              </div>
            </div>
            <p className={`mt-6 text-sm leading-relaxed text-slate-500 md:text-base ${bodyClassName}`}>{copy.helper}</p>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#F1F3F5] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((document, index) => {
              const title = document.title[locale as "en" | "ru" | "uk"] ?? document.title.en;
              const description = document.description[locale as "en" | "ru" | "uk"] ?? document.description.en;
              const href = `/documents/${document.slug}`;

              return (
                <motion.div
                  key={document.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.03 }}
                  className="group flex h-full flex-col rounded-[34px] bg-white p-7 shadow-[0_18px_55px_rgba(39,54,72,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(39,54,72,0.12)] md:p-8"
                >
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F3F5] text-[#72A0C1] transition-colors group-hover:bg-[#72A0C1] group-hover:text-white">
                      <FileText size={24} />
                    </div>
                    <span className={`text-[10px] uppercase text-slate-300 ${uiClassName}`}>
                      PDF
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col">
                    <h3 className={`text-2xl uppercase leading-[0.96] text-slate-900 md:text-[2rem] ${headlineClassName}`}>
                      {title}
                    </h3>
                    <p className={`mt-5 flex-1 text-base leading-relaxed text-slate-600 md:text-[1.04rem] ${bodyClassName}`}>{description}</p>
                  </div>

                  <div className="mt-8">
                    <Link
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-3 text-sm uppercase text-slate-900 transition-colors hover:text-[#72A0C1] ${uiClassName}`}
                    >
                      {copy.cta}
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
