"use client";
import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Globe, ShieldCheck, Target, MapPin, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay, cyrillicEditorial } from "@/lib/cyrillic-fonts";
import { homeTemplateAccent, homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

export default function About() {
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

  const goals = [
    {
      title: isRu ? "Профессиональные стандарты" : isUk ? "Професійні стандарти" : "Professional Standards",
      desc: isRu
        ? "Развитие и поддержка высоких стандартов качества, этики и ответственности в индустрии."
        : isUk
          ? "Розвиток і підтримка високих стандартів якості, етики та відповідальності в індустрії."
        : "Developing and upholding high standards of quality, ethics, and responsibility across the beauty industry.",
    },
    {
      title: isRu ? "Поддержка образования" : isUk ? "Підтримка освіти" : "Education Support",
      desc: isRu
        ? "Продвижение профессионального обучения и постоянного повышения квалификации."
        : isUk
          ? "Просування професійного навчання та безперервного підвищення кваліфікації."
        : "Supporting professional education and continuous advancement for members and educators.",
    },
    {
      title: isRu ? "Объединение специалистов" : isUk ? "Об’єднання фахівців" : "Uniting Professionals",
      desc: isRu
        ? "Создание международного сообщества для сотрудничества и взаимопомощи."
        : isUk
          ? "Створення міжнародної спільноти для співпраці та взаємної підтримки."
        : "Building an international community for collaboration, mentorship, and shared growth.",
    },
    {
      title: isRu ? "Признание" : isUk ? "Визнання" : "Recognition",
      desc: isRu
        ? "Предоставление профессионального статуса и видимости лучшим представителям отрасли."
        : isUk
          ? "Надання професійного статусу та видимості найкращим представникам галузі."
        : "Creating visibility and professional recognition for outstanding representatives of the field.",
    },
    {
      title: isRu ? "Развитие индустрии" : isUk ? "Розвиток індустрії" : "Industry Growth",
      desc: isRu
        ? "Поддержка партнерств, мероприятий и публикаций для развития beauty-сферы."
        : isUk
          ? "Підтримка партнерств, подій і публікацій для розвитку beauty-сфери."
        : "Supporting partnerships, events, and publications that help the beauty sector evolve.",
    },
  ];

  const missionItems = isRu
    ? [
        "Поддержка высокого профессионального уровня",
        "Продвижение значимости образования",
        "Укрепление стандартов качества и этики",
      ]
    : isUk
      ? [
          "Підтримка високого професійного рівня",
          "Просування значущості освіти",
          "Зміцнення стандартів якості та етики",
        ]
    : [
        "Supporting a high level of professional excellence",
        "Promoting the importance of education",
        "Strengthening standards of quality and ethics",
      ];

  const visionItems = isRu
    ? [
        "Сильное международное сообщество",
        "Признанная платформа для обучения",
        "Значимый голос индустрии",
      ]
    : isUk
      ? [
          "Сильна міжнародна спільнота",
          "Визнана платформа для навчання",
          "Вагомий голос індустрії",
        ]
    : [
        "A strong international community",
        "A recognized platform for education",
        "A meaningful voice in the industry",
      ];

  return (
    <div className="min-h-screen bg-white selection:bg-[#B9D9EB] selection:text-black">
      {/* 2.1 Hero / Description */}
      <section className="relative flex h-[calc(60vh+70px)] items-center overflow-hidden bg-[#F1F3F5]">
        <div className="absolute inset-0">
          <ImageWithFallback 
            src="/home/website.webp"
            className="w-full h-full object-cover md:object-[center_28%]"
            alt={isRu ? "Об ассоциации IBPA" : isUk ? "Про асоціацію IBPA" : "About IBPA"}
          />
        </div>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-slate-900 space-y-8">
          <div className="flex flex-col items-start">
            <h1 
              className={`text-6xl sm:text-7xl md:text-9xl uppercase leading-[0.92] ${headlineClassName}`}
            >
              <span className="text-[#B9D9EB]">{isRu ? "Об" : isUk ? "Про" : "About"}</span>{" "}
              <span className="text-[#B9D9EB]">IBPA</span>
            </h1>
            <span className={`mt-2 text-3xl lowercase text-slate-400 md:-mt-6 md:text-5xl ${homeTemplateAccent.className}`}>{isRu ? "наша история и видение" : isUk ? "наша історія та бачення" : "our story & vision"}</span>
          </div>
        </div>
      </section>

      {/* 2.2 Mission & 2.3 Vision */}
      <section className="py-20 md:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <motion.div {...fadeInUp} className="relative overflow-hidden rounded-[44px] shadow-[0_24px_80px_rgba(39,54,72,0.14)] md:rounded-[56px]">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop"
              className="h-[420px] w-full object-cover md:h-[760px]"
              alt={isRu ? "Команда и руководство IBPA" : isUk ? "Команда та керівництво IBPA" : "IBPA leadership and team"}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.46))]" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white md:p-10">
              <p className={`text-[10px] uppercase text-white/70 ${uiClassName}`}>
                {isRu ? "Люди за ассоциацией" : isUk ? "Люди за асоціацією" : "People Behind the Association"}
              </p>
              <p className={`mt-3 max-w-md text-base leading-relaxed text-white/88 md:text-[1.08rem] ${bodyClassName}`}>
                {isRu
                  ? "IBPA строится людьми, которые объединяют профессиональный опыт, организаторское мышление и долгосрочное видение развития beauty-индустрии."
                  : isUk
                    ? "IBPA будується людьми, які поєднують професійний досвід, організаційне мислення та довгострокове бачення розвитку beauty-індустрії."
                    : "IBPA is built by people who combine professional experience, operational thinking, and a long-term vision for the future of the beauty industry."}
              </p>
            </div>
          </motion.div>

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-1">
            <motion.div {...fadeInUp} className="space-y-8 rounded-[40px] bg-[#F8FBFD] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:space-y-10 md:p-12">
              <div className="flex items-center gap-4">
                <Target className="text-[#B9D9EB]" size={32} />
                <h2 className={`text-3xl uppercase text-slate-900 md:text-4xl ${headlineClassName}`}>{isRu ? "Миссия" : isUk ? "Місія" : "Mission"}</h2>
              </div>
              <p className={`text-xl leading-relaxed text-slate-600 md:text-[1.35rem] ${bodyClassName}`}>
                {isRu
                  ? "Объединять сильных и перспективных специалистов, способствовать развитию профессиональных стандартов и формировать культуру профессиональной ответственности."
                  : isUk
                    ? "Об’єднувати сильних і перспективних фахівців, сприяти розвитку професійних стандартів та формувати культуру професійної відповідальності."
                    : "To unite strong and promising professionals, support the growth of standards, and shape a culture of professional responsibility."}
              </p>
              <ul className="space-y-4">
                {missionItems.map((item, i) => (
                  <li key={i} className={`flex gap-4 text-slate-600 ${bodyClassName}`}>
                    <CheckCircle size={20} className="text-[#B9D9EB] flex-shrink-0" />
                    <span className={`text-[10px] uppercase sm:text-xs ${uiClassName}`}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div {...fadeInUp} className="space-y-8 rounded-[40px] bg-[#F8FBFD] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:space-y-10 md:p-12">
              <div className="flex items-center gap-4">
                <Globe className="text-[#B9D9EB]" size={32} />
                <h2 className={`text-3xl uppercase text-slate-900 md:text-4xl ${headlineClassName}`}>{isRu ? "Видение" : isUk ? "Бачення" : "Vision"}</h2>
              </div>
              <p className={`text-xl leading-relaxed text-slate-600 md:text-[1.35rem] ${bodyClassName}`}>
                {isRu
                  ? "Стать авторитетной международной платформой, которая служит ориентиром качества, этики и профессионализма во всей индустрии красоты."
                  : isUk
                    ? "Стати авторитетною міжнародною платформою, яка слугує орієнтиром якості, етики та професіоналізму в усій індустрії краси."
                    : "To become a respected international platform that serves as a benchmark for quality, ethics, and professionalism across the beauty industry."}
              </p>
              <ul className="space-y-4">
                {visionItems.map((item, i) => (
                  <li key={i} className={`flex gap-4 text-slate-600 ${bodyClassName}`}>
                    <CheckCircle size={20} className="text-[#B9D9EB] flex-shrink-0" />
                    <span className={`text-[10px] uppercase sm:text-xs ${uiClassName}`}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2.4 Goals */}
      <section className="py-20 md:py-40 bg-[#F1F3F5]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeInUp} className="max-w-3xl mb-16 md:mb-24">
            <p className={`mb-4 text-xs uppercase text-[#72A0C1] md:text-sm ${uiClassName}`}>{isRu ? "Стратегические опоры" : isUk ? "Стратегічні опори" : "Strategic Pillars"}</p>
            <h2 className={`text-4xl uppercase leading-[0.94] text-slate-900 md:text-[4.85rem] ${headlineClassName}`}>{isRu ? "Ключевые цели ассоциации" : isUk ? "Ключові цілі асоціації" : "Core Goals of the Association"}</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {goals.map((goal, i) => (
              <motion.div 
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="flex h-full flex-col justify-between rounded-[40px] bg-white p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(39,54,72,0.12)] md:rounded-[50px] md:p-12"
              >
                <div className="space-y-6">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-[20px] md:rounded-[24px] bg-[#B9D9EB]/10 flex items-center justify-center text-[#708090]">
                    <Target size={28} />
                  </div>
                  <h3 className={`text-2xl uppercase leading-[0.96] text-slate-900 md:text-3xl ${headlineClassName}`}>{goal.title}</h3>
                  <p className={`text-sm leading-relaxed text-slate-600 md:text-base ${bodyClassName}`}>{goal.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2.5 Geography & 2.7 What we are NOT */}
      <section className="py-20 md:py-40 bg-white border-y border-[#F1F3F5]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 md:gap-24">
          <motion.div {...fadeInUp} className="space-y-8 md:space-y-12">
            <div className="flex items-center gap-4">
              <MapPin className="text-[#B9D9EB]" size={32} />
              <h2 className={`text-3xl uppercase text-slate-900 md:text-4xl ${headlineClassName}`}>{isRu ? "География" : isUk ? "Географія" : "Geography"}</h2>
            </div>
            <p className={`text-xl leading-relaxed text-slate-600 md:text-[1.25rem] ${bodyClassName}`}>
              {isRu
                ? "IBPA является международной профессиональной ассоциацией и открыта для участников из различных стран и регионов. Юридически ассоциация зарегистрирована в штате Калифорния, США."
                : isUk
                  ? "IBPA є міжнародною професійною асоціацією та відкрита для учасників з різних країн і регіонів. Юридично асоціація зареєстрована в штаті Каліфорнія, США."
                : "IBPA is an international professional association open to members from different countries and regions. Legally, the association is registered in the State of California, USA."}
            </p>
          </motion.div>

          <motion.div {...fadeInUp} className="rounded-[40px] border border-slate-200 bg-[#F1F3F5] p-8 text-slate-900 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:rounded-[60px] md:p-16 md:space-y-10">
            <div className="flex items-center gap-4">
              <ShieldCheck className="text-[#B9D9EB]" size={32} />
              <h2 className={`text-3xl uppercase text-slate-900 md:text-4xl ${headlineClassName}`}>{isRu ? "Важное уведомление" : isUk ? "Важливе повідомлення" : "Important Notice"}</h2>
            </div>
            <p className={`text-base leading-relaxed text-slate-600 md:text-lg ${bodyClassName}`}>
              {isRu
                ? "IBPA не является государственным лицензирующим органом и не заменяет государственные лицензирующие советы. Мы не выдаем лицензии и не гарантируем получение виз. Ассоциация предоставляет профессиональные стандарты и поддержку."
                : isUk
                  ? "IBPA не є державним ліцензійним органом і не замінює державні ліцензійні ради. Ми не видаємо ліцензії та не гарантуємо отримання віз. Асоціація надає професійні стандарти та підтримку."
                : "IBPA is not a government licensing body and does not replace state boards. We do not issue licenses and do not guarantee visas. The association provides professional standards and support."}
            </p>
            <div className={`grid grid-cols-2 gap-8 border-t border-slate-200 pt-8 text-[10px] uppercase text-slate-400 md:text-xs ${uiClassName}`}>
              <p>{isRu ? "Некоммерческий статус" : isUk ? "Некомерційний статус" : "Nonprofit Status"}</p>
              <p>{isUk ? "Взаємна вигода" : "Mutual Benefit"}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white border-t border-[#F1F3F5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-10 rounded-[40px] bg-[#F8FBFD] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:rounded-[56px] md:p-14 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className={`text-[10px] uppercase text-[#72A0C1] ${uiClassName}`}>{isRu ? "Следующий шаг" : isUk ? "Наступний крок" : "Next Step"}</p>
              <h2 className={`text-3xl uppercase leading-[0.94] text-slate-900 md:text-5xl ${headlineClassName}`}>
                {isRu ? "Изучите тарифы и пакеты и выберите путь под свою роль" : isUk ? "Ознайомтеся з тарифами та пакетами й оберіть шлях відповідно до своєї ролі" : "Explore membership and choose the path that fits your role"}
              </h2>
              <p className={`text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
                {isRu
                  ? "Если IBPA соответствует вашим профессиональным целям, следующий лучший шаг — сравнить тарифы и пакеты и перейти в подходящую форму заявки."
                  : isUk
                    ? "Якщо IBPA відповідає вашим професійним цілям, наступний найкращий крок — порівняти тарифи та пакети й перейти до відповідної форми заявки."
                  : "If IBPA aligns with your professional goals, the next best step is to compare membership categories and start the correct application flow."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/membership#packages" className={`rounded-full bg-black px-8 py-4 text-center text-sm uppercase text-white ${uiClassName}`}>
                {isRu ? "Смотреть тарифы" : isUk ? "Переглянути тарифи" : "View Membership"}
              </Link>
              <Link href="/criteria" className={`rounded-full border border-slate-300 bg-white px-8 py-4 text-center text-sm uppercase text-slate-900 ${uiClassName}`}>
                {isRu ? "Изучить критерии" : isUk ? "Переглянути критерії" : "Review Criteria"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
