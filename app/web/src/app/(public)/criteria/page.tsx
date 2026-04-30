"use client";
import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ShieldCheck, Search, FileCheck, CheckCircle2, UserPlus, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateAccent, homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

export default function MembershipCriteria() {
  const { locale } = useI18n();
  const isRu = locale === "ru";
  const isUk = locale === "uk";
  const useEnglishTypography = true;
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-bold tracking-[-0.045em]`
    : `${cyrillicDisplay.className} font-light tracking-[-0.03em]`;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 }
  };

  const mainCriteria = [
    isRu ? "Профессиональный опыт кандидата" : isUk ? "Професійний досвід кандидата" : "The applicant's professional experience",
    isRu ? "Стаж работы в индустрии" : isUk ? "Стаж роботи в індустрії" : "Length of time working in the industry",
    isRu ? "Уровень подготовки и бэкграунд" : isUk ? "Рівень підготовки та бекграунд" : "Training level and background",
    isRu ? "Профессиональные достижения" : isUk ? "Професійні досягнення" : "Professional achievements",
    isRu ? "Участие в развитии индустрии" : isUk ? "Участь у розвитку індустрії" : "Contribution to industry development",
    isRu ? "Преподавательская деятельность" : isUk ? "Викладацька діяльність" : "Educational or teaching activity",
    isRu ? "Качество позиционирования" : isUk ? "Якість позиціонування" : "Quality of professional positioning",
    isRu ? "Деловая и профессиональная репутация" : isUk ? "Ділова та професійна репутація" : "Business and professional reputation",
    isRu ? "Соответствие ценностям IBPA" : isUk ? "Відповідність цінностям IBPA" : "Alignment with IBPA values"
  ];

  const reviewSteps = [
    {
      step: "01",
      title: isRu ? "Базовое соответствие" : isUk ? "Базова відповідність" : "Baseline Fit",
      desc: isRu
        ? "Комиссия сначала смотрит, соответствует ли заявка профессиональному профилю и категории, на которую претендует кандидат."
        : isUk
          ? "Комісія спочатку дивиться, чи відповідає заявка професійному профілю та категорії, на яку претендує кандидат."
          : "The board first checks whether the application matches the professional profile and category the candidate is applying for.",
    },
    {
      step: "02",
      title: isRu ? "Оценка опыта и качества" : isUk ? "Оцінка досвіду та якості" : "Experience & Quality Review",
      desc: isRu
        ? "Далее оцениваются опыт, уровень подготовки, достижения, репутация и общее профессиональное позиционирование."
        : isUk
          ? "Далі оцінюються досвід, рівень підготовки, досягнення, репутація та загальне професійне позиціонування."
          : "The board then evaluates experience, level of training, achievements, reputation, and overall professional positioning.",
    },
    {
      step: "03",
      title: isRu ? "Коллегиальное решение" : isUk ? "Колегіальне рішення" : "Collective Decision",
      desc: isRu
        ? "После оценки материалов комиссия принимает решение: одобрить заявку, запросить данные, отложить рассмотрение или отказать."
        : isUk
          ? "Після оцінювання матеріалів комісія ухвалює рішення: схвалити заявку, запросити дані, відкласти розгляд або відмовити."
          : "After reviewing the materials, the board decides whether to approve, request more information, postpone review, or decline.",
    },
  ];

  const decisions = isRu
    ? ["Одобрить заявку", "Запросить сведения", "Отложить рассмотрение", "Отказать в принятии"]
    : isUk
      ? ["Схвалити заявку", "Запросити додаткові відомості", "Відкласти розгляд", "Відмовити в прийнятті"]
      : ["Approve the application", "Request more information", "Postpone review", "Decline admission"];

  return (
    <div className="min-h-screen bg-white selection:bg-[#B9D9EB] selection:text-black">
      {/* Hero Section */}
      <section className="relative flex h-[calc(60vh+70px)] items-center justify-center overflow-hidden bg-[#F1F3F5]">
        <div className="absolute inset-0">
          <ImageWithFallback 
            src="/home/website-6.webp"
            className="h-full w-full object-cover md:object-[center_28%]"
            alt={isRu ? "Критерии участия" : isUk ? "Критерії участі" : "Membership Criteria"}
          />
        </div>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 text-left text-slate-900">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-6xl sm:text-7xl md:text-9xl uppercase leading-[0.92] ${headlineClassName}`}
          >
            <span className="text-[#B9D9EB]">{isRu ? "Критерии" : isUk ? "Критерії" : "Criteria"}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-2 text-3xl lowercase text-slate-400 md:-mt-6 md:text-5xl ${homeTemplateAccent.className}`}
          >
            {isRu ? "критерии отбора" : isUk ? "критерії відбору" : "selection criteria"}
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <motion.div {...fadeInUp} className="space-y-8 rounded-[40px] bg-[#F8FBFD] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:p-12">
            <p className={`text-[10px] uppercase text-[#72A0C1] ${uiClassName}`}>{isRu ? "Основной принцип" : isUk ? "Основний принцип" : "Core Principle"}</p>
            <h2 className={`text-4xl uppercase leading-[0.94] text-slate-900 md:text-[4.2rem] ${headlineClassName}`}>
              {isRu ? "Отбор не автоматический" : isUk ? "Відбір не автоматичний" : "Selection Is Not Automatic"}
            </h2>
            <div className={`space-y-6 text-lg leading-relaxed text-slate-600 md:text-[1.15rem] ${bodyClassName}`}>
              <p>{isRu ? "Участие в сообществе IBPA является селективным и не предоставляется автоматически всем заявителям." : isUk ? "Участь у спільноті IBPA є селективною та не надається автоматично всім заявникам." : "IBPA membership is selective and is not automatically granted to all applicants."}</p>
              <p>{isRu ? "Статус участника сообщества предоставляется только после рассмотрения заявки комиссией по отбору. Мы принимаем специалистов, которые демонстрируют профессиональный подход и разделяют ценности ассоциации." : isUk ? "Статус учасника спільноти надається лише після розгляду заявки комісією з відбору. Ми приймаємо фахівців, які демонструють професійний підхід і поділяють цінності асоціації." : "Membership is granted only after review by the Membership Review Board. We accept professionals who demonstrate a strong professional approach and share the association's values."}</p>
            </div>
            <div className="flex gap-5 rounded-[32px] bg-[#F1F3F5] p-6 shadow-[0_12px_34px_rgba(39,54,72,0.05)]">
              <ShieldCheck size={30} className="mt-1 flex-shrink-0 text-[#72A0C1]" />
              <p className={`text-sm uppercase text-slate-700 ${uiClassName}`}>{isRu ? "Качество, экспертиза и профессионализм" : isUk ? "Якість, експертиза та професіоналізм" : "Quality, Expertise, and Professionalism"}</p>
            </div>
          </motion.div>

          <motion.div {...fadeInUp} className="rounded-[40px] bg-[#F1F3F5] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:p-12">
            <p className={`mb-8 text-[10px] uppercase text-[#72A0C1] ${uiClassName}`}>{isRu ? "Как проходит оценка" : isUk ? "Як відбувається оцінювання" : "How Review Works"}</p>
            <div className="space-y-8">
              {reviewSteps.map((item) => (
                <div key={item.step} className="grid gap-4 border-b border-[#DCE7EE] pb-8 last:border-b-0 last:pb-0 md:grid-cols-[88px_1fr]">
                  <div className={`text-4xl text-[#B9D9EB]/60 ${headlineClassName}`}>{item.step}</div>
                  <div className="space-y-3">
                    <h3 className={`text-2xl uppercase leading-[0.96] text-slate-900 ${headlineClassName}`}>{item.title}</h3>
                    <p className={`text-base leading-relaxed text-slate-600 md:text-[1.05rem] ${bodyClassName}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#F1F3F5] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-4xl space-y-4">
            <p className={`text-sm uppercase text-[#72A0C1] ${uiClassName}`}>{isRu ? "Что оценивается" : isUk ? "Що оцінюється" : "What Is Evaluated"}</p>
            <h2 className={`text-4xl uppercase leading-[0.94] text-slate-900 md:text-[4.85rem] ${headlineClassName}`}>{isRu ? "Ключевые критерии оценки" : isUk ? "Ключові критерії оцінювання" : "Key Evaluation Criteria"}</h2>
            <p className={`max-w-3xl text-lg leading-relaxed text-slate-600 md:text-[1.12rem] ${bodyClassName}`}>
              {isRu ? "Ниже — основные области, на которые комиссия смотрит при рассмотрении заявки. Это не формальная галочка, а общий профессиональный профиль кандидата." : isUk ? "Нижче — основні напрями, на які комісія дивиться під час розгляду заявки. Це не формальна галочка, а загальний професійний профіль кандидата." : "These are the main areas the board reviews when evaluating an application. The goal is not a checkbox exercise, but an overall professional profile."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {mainCriteria.map((item, i) => (
              <motion.div 
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.05 }}
                className="group flex h-full items-start gap-5 rounded-[36px] bg-white p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(39,54,72,0.12)]"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#F1F3F5] text-[#72A0C1] transition-all group-hover:bg-[#72A0C1] group-hover:text-white">
                  <CheckCircle2 size={24} />
                </div>
                <p className={`text-lg leading-relaxed text-slate-600 transition-colors group-hover:text-slate-900 ${bodyClassName}`}>{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div {...fadeInUp} className="space-y-8 rounded-[40px] bg-[#F8FBFD] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:p-12">
          <div className="flex items-center gap-4">
            <FileCheck className="text-[#72A0C1]" size={32} />
            <h2 className={`text-3xl uppercase text-slate-900 md:text-4xl ${headlineClassName}`}>{isRu ? "Что усиливает заявку" : isUk ? "Що підсилює заявку" : "What Strengthens an Application"}</h2>
          </div>
          <p className={`text-lg leading-relaxed text-slate-600 md:text-[1.12rem] ${bodyClassName}`}>
            {isRu ? "В зависимости от категории комиссия может учитывать наличие лицензий, сертификатов, качество портфолио, опыт ведения бизнеса и публичную профессиональную активность." : isUk ? "Залежно від категорії комісія може враховувати наявність ліцензій, сертифікатів, якість портфоліо, досвід ведення бізнесу та публічну професійну активність." : "Depending on the category, the board may consider licenses, certifications, portfolio quality, business experience, and public professional activity."}
          </p>
          <div className="flex flex-wrap gap-3">
            {(isRu ? ["Портфолио", "Лицензии", "Награды", "Наставничество"] : isUk ? ["Портфоліо", "Ліцензії", "Нагороди", "Наставництво"] : ["Portfolio", "Licenses", "Awards", "Mentorship"]).map((tag, i) => (
              <span key={i} className={`rounded-full bg-[#F1F3F5] px-5 py-2 text-xs uppercase text-slate-700 shadow-[0_10px_26px_rgba(39,54,72,0.05)] ${uiClassName}`}>
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeInUp} className="rounded-[40px] bg-[#F1F3F5] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:p-12">
          <div className="flex items-center gap-4">
            <Search className="text-[#72A0C1]" size={32} />
            <h2 className={`text-3xl uppercase text-slate-900 md:text-4xl ${headlineClassName}`}>{isRu ? "Какие решения может принять комиссия" : isUk ? "Які рішення може ухвалити комісія" : "Possible Review Outcomes"}</h2>
          </div>
          <div className="mt-10 grid gap-4">
            {decisions.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-[28px] bg-white px-6 py-5 shadow-[0_12px_34px_rgba(39,54,72,0.05)]">
                <span className={`text-xl uppercase text-slate-900 md:text-2xl ${headlineClassName}`}>{item}</span>
                <ArrowRight className="text-[#72A0C1]" />
              </div>
            ))}
          </div>
          <p className={`mt-8 text-sm leading-relaxed text-slate-500 ${bodyClassName}`}>{isRu ? "Все заявки рассматриваются коллегиально комиссией по отбору. Подача заявки не гарантирует автоматическое принятие." : isUk ? "Усі заявки розглядаються колегіально комісією з відбору. Подання заявки не гарантує автоматичного прийняття." : "All applications are reviewed collectively by the Membership Review Board. Submitting an application does not guarantee acceptance."}</p>
        </motion.div>
      </section>

      <section className="bg-[#F1F3F5] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-[56px] bg-white p-10 text-center shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:p-16">
            <div className="absolute top-0 right-0 p-12 text-[#B9D9EB] opacity-10">
              <UserPlus size={200} />
            </div>
            <div className="relative z-10 mx-auto max-w-3xl space-y-8">
              <p className={`text-sm uppercase text-[#72A0C1] ${uiClassName}`}>{isRu ? "Комитет" : isUk ? "Комітет" : "Committee"}</p>
              <h2 className={`text-4xl uppercase leading-[0.94] text-slate-900 md:text-[4.85rem] ${headlineClassName}`}>{isRu ? "Комиссия по отбору" : isUk ? "Комісія з відбору" : "Membership Review Board"}</h2>
              <p className={`text-xl leading-relaxed text-slate-600 md:text-[1.2rem] ${bodyClassName}`}>
                {isRu ? "Комиссия по отбору состоит из опытных специалистов индустрии, преподавателей и лидеров, которые коллегиально рассматривают и оценивают заявки на участие в соответствии с критериями ассоциации." : isUk ? "Комісія з відбору складається з досвідчених фахівців індустрії, викладачів і лідерів, які колегіально розглядають та оцінюють заявки на участь відповідно до критеріїв асоціації." : "The Membership Review Board consists of experienced industry professionals, educators, and leaders who collectively review and evaluate membership applications in accordance with the association's criteria."}
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8 md:grid-cols-4">
                <div className="text-center">
                  <p className={`text-4xl text-slate-900 ${headlineClassName}`}>10+</p>
                  <p className={`text-[10px] uppercase text-slate-500 ${uiClassName}`}>{isRu ? "Эксперты" : isUk ? "Експерти" : "Experts"}</p>
                </div>
                <div className="text-center">
                  <p className={`text-4xl text-slate-900 ${headlineClassName}`}>5</p>
                  <p className={`text-[10px] uppercase text-slate-500 ${uiClassName}`}>{isRu ? "Комитеты" : isUk ? "Комітети" : "Committees"}</p>
                </div>
                <div className="text-center">
                  <p className={`text-4xl text-slate-900 ${headlineClassName}`}>40+</p>
                  <p className={`text-[10px] uppercase text-slate-500 ${uiClassName}`}>{isRu ? "Страны" : isUk ? "Країни" : "Countries"}</p>
                </div>
                <div className="text-center">
                  <p className={`text-4xl text-slate-900 ${headlineClassName}`}>2026</p>
                  <p className={`text-[10px] uppercase text-slate-500 ${uiClassName}`}>{isRu ? "Основано" : isUk ? "Засновано" : "Founded"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white border-t border-[#F0F8FF]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-10 rounded-[44px] bg-[#F1F3F5] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:rounded-[60px] md:p-14 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className={`text-[10px] uppercase text-[#72A0C1] ${uiClassName}`}>{isRu ? "Готовы подать заявку" : isUk ? "Готові подати заявку" : "Ready to Apply"}</p>
              <h2 className={`text-3xl uppercase leading-[0.94] text-slate-900 md:text-5xl ${headlineClassName}`}>
                {isRu ? "Сравните тарифы и пакеты и начните подходящую заявку" : isUk ? "Порівняйте тарифи та пакети й почніть відповідну заявку" : "Compare membership categories and start the right application"}
              </h2>
              <p className={`text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
                {isRu ? "Сначала выберите подходящий тариф на странице сообщества, а затем переходите в соответствующий сценарий заявки без лишних редиректов." : isUk ? "Спочатку оберіть відповідний тариф на сторінці спільноти, а потім переходьте до відповідного сценарію заявки без зайвих редиректів." : "Use the membership page to choose the best category first, then move into the matching application flow without extra redirects."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/membership#packages" className={`rounded-full bg-black px-8 py-4 text-center text-sm uppercase text-white ${uiClassName}`}>
                {isRu ? "Смотреть тарифы" : isUk ? "Переглянути тарифи" : "View Membership"}
              </Link>
              <Link href="/apply" className={`rounded-full border border-slate-300 bg-white px-8 py-4 text-center text-sm uppercase text-slate-900 ${uiClassName}`}>
                {isRu ? "Начать заявку" : isUk ? "Почати заявку" : "Start Application"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
