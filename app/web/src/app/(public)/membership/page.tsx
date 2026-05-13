"use client";
import React from "react";
import { motion } from "motion/react";
import { Check, ArrowRight, UserCheck, ShieldCheck, Star, Users, Briefcase, Building, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateAccent, homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";
import { buildApplyHref, MembershipCategory } from "@/lib/membership";

export default function Membership() {
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

  const packages = [
    {
      category: "Specialist" as MembershipCategory,
      name: isRu ? "Специалист" : isUk ? "Спеціаліст" : "Specialist",
      price: "$49",
      image: "/home/student-1.webp",
      icon: <Users className="w-8 h-8" />,
      for: isRu ? "Для специалистов beauty-индустрии, проходящих обучение и находящихся в начале профессионального пути." : isUk ? "Для спеціалістів beauty-індустрії, які проходять навчання та перебувають на початку професійного шляху." : "For beauty industry specialists who are currently training and just starting their professional path.",
      features: [
        isRu ? "статус Specialist Member of IBPA" : isUk ? "статус Specialist Member of IBPA" : "Specialist Member of IBPA status",
        isRu ? "доступ к базовым образовательным материалам" : isUk ? "доступ до базових освітніх матеріалів" : "access to core educational materials",
        isRu ? "доступ к отдельным вебинарам и материалам для специалистов" : isUk ? "доступ до окремих вебінарів і матеріалів для спеціалістів" : "access to selected webinars and specialist-focused resources",
        isRu ? "возможность участия в открытых мероприятиях" : isUk ? "можливість участі у відкритих подіях" : "ability to join open events",
        isRu ? "цифровой сертификат участника" : isUk ? "цифровий сертифікат учасника" : "digital membership certificate",
      ],
      value: isRu ? "Этот пакет помогает специалисту начать путь в профессиональной среде и получать ранний доступ к знаниям." : isUk ? "Цей пакет допомагає спеціалісту розпочати шлях у професійному середовищі та отримувати ранній доступ до знань." : "This package helps specialists begin their path in the professional community and gain early access to knowledge."
    },
    {
      category: "Professional" as MembershipCategory,
      name: isRu ? "Профессионал" : isUk ? "Професіонал" : "Professional",
      price: "$199",
      image: "/home/professional.webp",
      icon: <UserCheck className="w-8 h-8" />,
      for: isRu ? "Для практикующих мастеров и специалистов beauty-индустрии." : isUk ? "Для практикуючих майстрів і фахівців beauty-індустрії." : "For practicing beauty specialists and working professionals in the beauty industry.",
      features: [
        isRu ? "официальный статус Professional Member of IBPA" : isUk ? "офіційний статус Professional Member of IBPA" : "official Professional Member of IBPA status",
        isRu ? "доступ к расширенной библиотеке материалов" : isUk ? "доступ до розширеної бібліотеки матеріалів" : "access to an expanded learning library",
        isRu ? "доступ к вебинарам и профессиональному контенту" : isUk ? "доступ до вебінарів і професійного контенту" : "access to webinars and professional content",
        isRu ? "размещение в каталоге участников" : isUk ? "розміщення в каталозі учасників" : "placement in the Member Directory",
        isRu ? "право указывать статус участника в профиле и биографии" : isUk ? "право вказувати статус учасника у профілі та біографії" : "ability to reference membership in profile and bio",
        isRu ? "цифровой сертификат" : isUk ? "цифровий сертифікат" : "digital certificate"
    ],
      value: isRu ? "Помогает мастеру усилить профессиональный статус, быть видимым в индустрии и получать образование." : isUk ? "Допомагає майстру посилити професійний статус, бути помітним в індустрії та отримувати освіту." : "Helps professionals strengthen status, gain visibility, and continue growing through education."
    },
    {
      category: "Trainer" as MembershipCategory,
      name: isRu ? "Тренер / Преподаватель" : isUk ? "Тренер / Викладач" : "Trainer / Educator",
      price: "$399",
      image: "/home/trainer-2.webp",
      icon: <Star className="w-8 h-8" />,
      for: isRu ? "Для преподавателей, тренеров, наставников, школ и академий." : isUk ? "Для викладачів, тренерів, наставників, шкіл та академій." : "For educators, trainers, mentors, schools, and academies.",
      features: [
        isRu ? "Всё, что входит в пакет для специалистов, плюс:" : isUk ? "Усе, що входить до пакета для фахівців, плюс:" : "Everything included in Professional Membership, plus:",
        isRu ? "доступ к инициативам для преподавателей" : isUk ? "доступ до ініціатив для викладачів" : "access to educator-focused initiatives",
        isRu ? "возможность участия в образовательных проектах" : isUk ? "можливість участі в освітніх проєктах" : "opportunities to join educational projects",
        isRu ? "возможность подачи на участие как спикер/эксперт" : isUk ? "можливість подачі на участь як спікер / експерт" : "ability to apply as a speaker or expert",
        isRu ? "более широкое представление в каталоге" : isUk ? "ширше представлення в каталозі" : "broader presentation inside the directory",
        isRu ? "право позиционирования как Educator Member of IBPA" : isUk ? "право позиціонування як Educator Member of IBPA" : "positioning as an Educator Member of IBPA"
      ],
      value: isRu ? "Для тех, кто формирует профессиональное будущее через обучение и наставничество." : isUk ? "Для тих, хто формує професійне майбутнє через навчання та наставництво." : "For professionals shaping the future of the industry through education and mentorship."
    },
    {
      category: "Business" as MembershipCategory,
      name: isRu ? "???????? ???????" : isUk ? "??????? ???????" : "Business Owner",
      price: "$599",
      image: "/home/salon.webp",
      icon: <Briefcase className="w-8 h-8" />,
      for: isRu
        ? "??? ?????????? ??????, ???????, beauty spaces ? ?????? beauty-????????."
        : isUk
          ? "??? ????????? ??????, ???????, beauty spaces ?? ????? beauty-????????."
          : "For owners of salons, studios, beauty spaces, and other beauty businesses.",
      features: [
        isRu ? "1 Owner Account (??????????? ???????? ?????????)" : isUk ? "1 Owner Account (?????????? ???????? ????????)" : "1 Owner Account (full owner membership)",
        isRu ? "5 Team Educational Seats ????????" : isUk ? "5 Team Educational Seats ????????" : "5 Team Educational Seats included",
        isRu ? "Additional Team Seat ? $100 ?? ???????" : isUk ? "Additional Team Seat ? $100 ?? ???????" : "Additional Team Seat ? $100 each",
        isRu ? "?????? Team Member ?????? ????? ????????" : isUk ? "????? Team Member ??? ???? ????????" : "Every Team Member must have a license",
        isRu ? "??????????????? ?????? ??? ?????????????? ?????????? ??????? (?? ??????????? ????????)" : isUk ? "???????? ?????? ??? ???????????? ????????? ??????? (?? ?????????? ????????)" : "Educational access for affiliated team members (not full membership)",
      ],
      value: isRu
        ? "??????????? ???????? ????????? ??????? + ???????????? ??????????????? ?????? ??? ??????????????? ?????????????? ???????."
        : isUk
          ? "?????????? ???????? ???????? ??????? + ????????? ???????? ?????? ??? ?????????? ???????????? ???????."
          : "Full Business Owner membership for the owner + limited educational access for affiliated team members.",
    },
    {
      category: "Brand" as MembershipCategory,
      name: isRu ? "Бренд-участник" : isUk ? "Бренд-учасник" : "Brand Member",
      price: "$1,299",
      image: "/home/brand.webp",
      icon: <Building className="w-8 h-8" />,
      for: isRu
        ? "Для beauty-брендов, производителей, дистрибьюторов и поставщиков, которые хотят быть признаны частью профессионального beauty-сообщества."
        : isUk
          ? "Для beauty-брендів, виробників, дистриб'юторів і постачальників, які хочуть бути визнаними частиною професійної beauty-спільноти."
          : "For beauty brands, manufacturers, distributors, and suppliers who want to be recognized as part of the professional beauty community.",
      features: [
        isRu ? "официальный статус Brand Member of IBPA, подтвержденный Membership Review Board" : isUk ? "офіційний статус Brand Member of IBPA, підтверджений Membership Review Board" : "Official Brand Member of IBPA status verified and approved by the Membership Review Board",
        isRu ? "цифровой сертификат членства IBPA для официального использования" : isUk ? "цифровий сертифікат членства IBPA для офіційного використання" : "Digital certificate of IBPA membership for official use",
        isRu ? "профиль бренда в каталоге участников IBPA: описание компании, логотип и ссылка на сайт" : isUk ? "профіль бренду в каталозі учасників IBPA: опис компанії, логотип і посилання на сайт" : "Brand profile in the IBPA Member Directory with company description, logo, and website link",
        isRu ? "упоминание логотипа в разделе Partners на сайте IBPA" : isUk ? "розміщення логотипа в розділі Partners на сайті IBPA" : "Logo acknowledgment in the Partners section of the IBPA website",
        isRu ? "доступ к профессиональной сети специалистов, преподавателей и владельцев бизнеса" : isUk ? "доступ до професійної мережі фахівців, викладачів і власників бізнесу" : "Access to IBPA's professional network of beauty specialists, educators, and business owners",
        isRu ? "возможность участвовать в образовательных инициативах IBPA: product demos, expert panels и industry forums" : isUk ? "можливість брати участь в освітніх ініціативах IBPA: product demos, expert panels та industry forums" : "Eligibility to participate in IBPA educational initiatives including product demos, expert panels, and industry forums",
        isRu ? "право использовать обозначение Brand Member of IBPA в материалах компании" : isUk ? "право використовувати позначення Brand Member of IBPA у матеріалах компанії" : "Right to use the Brand Member of IBPA designation in company materials",
        isRu ? "официальное письмо ассоциации по запросу для деловых и профессиональных целей" : isUk ? "офіційний лист асоціації на запит для ділових і професійних цілей" : "Official association letter available upon request for professional and business purposes"
      ],
      value: isRu
        ? "Это не спонсорский и не рекламный пакет. Brand Membership — это профессиональный статус внутри ассоциации, который подтверждает приверженность бренда отраслевым стандартам и профессиональному beauty-сообществу."
        : isUk
          ? "Це не спонсорський і не рекламний пакет. Brand Membership — це професійний статус усередині асоціації, який підтверджує відданість бренду галузевим стандартам і професійній beauty-спільноті."
          : "This is not a sponsorship or advertising package. Brand Membership is a professional standing within the association that signals your brand's commitment to industry standards and the professional beauty community.",
      note: isRu
        ? "Для маркетинговой видимости и охвата аудитории посмотрите Sponsorship Packages."
        : isUk
          ? "Для маркетингової видимості та охоплення аудиторії перегляньте Sponsorship Packages."
          : "For marketing visibility and audience reach, see our Sponsorship Packages.",
      noteHref: "/partnership",
      noteCta: isRu ? "Открыть Partnership" : isUk ? "Відкрити Partnership" : "Explore Partnership"
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* 7.1 Hero Section */}
      <section className="relative flex h-[calc(60vh+70px)] items-center justify-center overflow-hidden bg-[#F1F3F5]">
        <div className="absolute inset-0 md:hidden">
          <ImageWithFallback
            src="/home/salon.webp"
            className="h-full w-full object-cover object-top"
            alt={isRu ? "Сообщество IBPA" : isUk ? "Спільнота IBPA" : "Membership"}
          />
        </div>
        <div className="absolute inset-0 hidden md:block md:top-[-360px] md:h-[calc(100%+360px)]">
          <ImageWithFallback
            src="/home/salon.webp"
            className="h-full w-full object-cover object-top"
            alt={isRu ? "Сообщество IBPA" : isUk ? "Спільнота IBPA" : "Membership"}
          />
        </div>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 text-left text-slate-900">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-6xl sm:text-7xl md:text-9xl uppercase leading-[0.92] ${headlineClassName}`}
          >
            <span className="text-[#B9D9EB]">{isRu ? "Сообщество" : isUk ? "Спільнота" : "Membership"}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-2 text-3xl lowercase text-slate-400 md:-mt-6 md:text-5xl ${homeTemplateAccent.className}`}
          >
            {isRu ? "ТАРИФЫ И ПАКЕТЫ" : isUk ? "ТАРИФИ ТА ПАКЕТИ" : "MEMBERSHIP & PACKAGES"}
          </motion.p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="max-w-3xl space-y-8">
          <motion.div {...fadeInUp} className="space-y-4">
            <h2 className={`text-5xl uppercase leading-[0.94] text-slate-900 ${headlineClassName}`}>
              {isRu ? "Выберите свой уровень" : isUk ? "Оберіть свій рівень" : "Choose Your Level"}
            </h2>
            <p className={`text-xl leading-relaxed text-slate-600 ${bodyClassName}`}>
              {isRu ? "IBPA предлагает несколько тарифов и пакетов участия, разработанных с учётом профессионального уровня, роли в индустрии и целей участника." : isUk ? "IBPA пропонує кілька тарифів і пакетів участі, розроблених з урахуванням професійного рівня, ролі в індустрії та цілей учасника." : "IBPA offers several membership categories designed around professional level, role in the industry, and member goals."}
            </p>
          </motion.div>
          <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="flex gap-4 rounded-[40px] bg-[#F1F3F5] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)]">
            <ShieldCheck size={32} className="text-[#708090] shrink-0" />
            <p className={`text-slate-600 ${bodyClassName}`}>{isRu ? "Все заявки на участие проходят предварительное рассмотрение комиссией по отбору. После одобрения кандидат получает возможность завершить оплату и активировать доступ в сообщество." : isUk ? "Усі заявки на участь проходять попередній розгляд комісією з відбору. Після схвалення кандидат отримує можливість завершити оплату та активувати доступ до спільноти." : "All membership applications go through a preliminary review by the Membership Review Board. After approval, the candidate may complete payment and activate membership."}</p>
          </motion.div>
        </div>
      </section>

      {/* Packages List */}
      <section id="packages" className="bg-white">
        {packages.map((pkg, idx) => (
          <motion.div 
            key={idx}
            {...fadeInUp}
            className={`${idx % 2 === 0 ? "bg-white" : "bg-[#F1F3F5]"} py-24`}
          >
            <div className={`max-w-7xl mx-auto px-6 flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-start`}>
              <div className="lg:w-1/3">
                <div className="space-y-8 p-2 md:p-4">
                  <div className="inline-block h-fit rounded-[32px] bg-[#F1F3F5] p-8 text-[#72A0C1] shadow-[0_18px_55px_rgba(39,54,72,0.08)]">
                    {pkg.icon}
                  </div>
                  <div className="space-y-4">
                    <h3 className={`text-4xl uppercase leading-[0.94] text-slate-900 ${headlineClassName}`}>
                      {pkg.name}
                    </h3>
                    <p className={`text-5xl text-[#7A98AF] ${headlineClassName}`}>
                      {pkg.price}
                    </p>
                    <p className={`max-w-md border-t border-[#E4EDF3] pt-6 text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
                      {pkg.for}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:w-2/3">
                <div className="relative overflow-hidden rounded-[48px] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:p-12">
                  <div className="absolute inset-0">
                    <ImageWithFallback src={pkg.image} alt={`${pkg.name} package background`} className="h-full w-full object-cover saturate-[1.18] contrast-[1.06] brightness-[0.98]" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(247,251,254,0.6),rgba(247,251,254,0.42))]" />
                  </div>
                  <div className="relative space-y-8">
                    <div className="rounded-[36px] bg-white/30 p-8 backdrop-blur-[10px] md:p-10">
                      <p className={`text-sm uppercase text-[#72A0C1] ${uiClassName}`}>{isRu ? "Что входит:" : isUk ? "Що входить:" : "What's Included:"}</p>
                      <div className="mt-6 grid gap-6 sm:grid-cols-2">
                        {pkg.features.map((feature, fIdx) => (
                          <div key={fIdx} className={`flex gap-4 items-start text-slate-600 ${bodyClassName}`}>
                            <Check className="mt-1 shrink-0 text-[#72A0C1]" size={18} />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[36px] bg-white/30 p-8 backdrop-blur-[10px] md:p-10">
                      <p className={`mb-2 text-sm uppercase text-slate-900 ${uiClassName}`}>{isRu ? "Ценность пакета:" : isUk ? "Цінність пакета:" : "Value Statement:"}</p>
                      <p className={`text-xl leading-relaxed text-slate-600 ${bodyClassName}`}>
                        {pkg.value}
                      </p>
                      {"note" in pkg && pkg.note ? (
                        <div className="mt-6 rounded-[28px] border border-[#D6E3EC] bg-[#F6FAFD] p-6">
                          <p className={`text-sm uppercase text-[#72A0C1] ${uiClassName}`}>
                            {isRu ? "Важно" : isUk ? "Важливо" : "Important"}
                          </p>
                          <p className={`mt-3 text-base leading-relaxed text-slate-600 ${bodyClassName}`}>
                            {pkg.note}
                          </p>
                          {pkg.noteHref && pkg.noteCta ? (
                            <Link
                              href={pkg.noteHref}
                              className={`mt-4 inline-flex items-center gap-3 text-sm uppercase text-slate-900 transition-opacity hover:opacity-70 ${uiClassName}`}
                            >
                              {pkg.noteCta}
                              <ArrowRight size={16} />
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="mt-10">
                        <Link href={buildApplyHref(pkg.category)} className={`inline-flex items-center gap-4 rounded-full bg-slate-900 px-10 py-5 text-sm uppercase text-white transition-all hover:scale-105 ${uiClassName}`}>
                          {isRu ? `Подать заявку: ${pkg.name}` : isUk ? `Подати заявку: ${pkg.name}` : `Apply for ${pkg.name}`} <ArrowRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="bg-[#F8FBFD] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[40px] border border-[#DCE8F0] bg-white p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:p-12">
            <p className={`text-[10px] uppercase text-[#72A0C1] ${uiClassName}`}>
              {isRu ? "Business Owner" : isUk ? "Business Owner" : "Business Owner"}
            </p>
            <h2 className={`mt-4 text-4xl uppercase leading-[0.94] text-slate-900 md:text-6xl ${headlineClassName}`}>
              {isRu ? "Business Owner Membership Includes" : isUk ? "Business Owner Membership Includes" : "Business Owner Membership Includes"}
            </h2>
            <p className={`mt-4 max-w-4xl text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
              {isRu
                ? "??????????? ???????? ????????? ??????? + ???????????? ??????????????? ?????? ??? ??????????????? ?????????????? ???????."
                : isUk
                  ? "?????????? ???????? ???????? ??????? + ????????? ???????? ?????? ??? ?????????? ???????????? ???????."
                  : "Full Business Owner membership for the owner + limited educational access for affiliated team members."}
            </p>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-[#E4EDF3] bg-[#F8FBFD] p-6">
                <p className={`text-sm uppercase text-[#72A0C1] ${uiClassName}`}>
                  {isRu ? "??? ??????" : isUk ? "?? ???????" : "Business Owner Membership Includes"}
                </p>
                <ul className="mt-4 space-y-3 text-slate-600">
                  {[
                    isRu ? "??????????? ???????? IBPA ??? ????????? ???????" : isUk ? "?????????? ???????? IBPA ??? ???????? ???????" : "Full IBPA membership for the business owner",
                    isRu ? "5 Team Educational Seats ????????" : isUk ? "5 Team Educational Seats ????????" : "5 Team Educational Seats included",
                    isRu ? "??????????? ?????????? affiliated professionals" : isUk ? "?????????? ???????? affiliated professionals" : "Ability to add affiliated professionals",
                    isRu ? "??????????????? ?????? ??? Team Members" : isUk ? "???????? ?????? ??? Team Members" : "Educational access for team members",
                    isRu ? "Member pricing ??? selected team events" : isUk ? "Member pricing ??? selected team events" : "Member pricing for selected team events",
                    isRu ? "????????? ??????? ?????? IBPA" : isUk ? "????????? ??????? ????????? IBPA" : "Business visibility inside IBPA",
                    isRu ? "Networking opportunities" : isUk ? "Networking opportunities" : "Networking opportunities",
                    isRu ? "Leadership-level participation" : isUk ? "Leadership-level participation" : "Leadership-level participation",
                    isRu ? "Additional Team Seats ???????? ?? $100 ??????" : isUk ? "Additional Team Seats ???????? ?? $100 ?????" : "Additional Team Seats available for $100 each",
                  ].map((benefit) => (
                    <li key={benefit} className={`flex items-start gap-3 text-sm leading-relaxed ${bodyClassName}`}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#72A0C1]" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-[#E4EDF3] bg-white p-6">
                <p className={`text-sm uppercase text-[#72A0C1] ${uiClassName}`}>
                  {isRu ? "??????? Team Access" : isUk ? "??????? Team Access" : "Team Access Rules"}
                </p>
                <ul className="mt-4 space-y-3 text-slate-600">
                  {[
                    isRu ? "Team access ?????? ???? email-based" : isUk ? "Team access ??? ???? email-based" : "Team access must be email-based",
                    isRu ? "?????? ?????? individually assigned" : isUk ? "????? ?????? individually assigned" : "Individually assigned",
                    isRu ? "?????? ?????? ???? trackable" : isUk ? "?????? ??? ???? trackable" : "Trackable",
                    isRu ? "Team Members ?? ????? ???????????? owner credentials" : isUk ? "Team Members ?? ?????? ??????????????? owner credentials" : "Team Members cannot use owner credentials",
                    isRu ? "Team Members ?? ????? ???????? registrations ??? tickets" : isUk ? "Team Members ?? ?????? ???????? registrations ??? tickets" : "Team Members cannot share registrations or tickets",
                    isRu ? "?????? Team Member ?????? ????? ????????" : isUk ? "????? Team Member ??? ???? ????????" : "Every team member must have a license",
                  ].map((rule) => (
                    <li key={rule} className={`flex items-start gap-3 text-sm leading-relaxed ${bodyClassName}`}>
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#72A0C1]" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                  <p className={`text-xs leading-relaxed text-amber-800 ${bodyClassName}`}>
                    {isRu
                      ? "IBPA ????????? ?? ????? ????? ????????? ????????????? ???????????????? ????? Team Member ? ????????. ????????????? ????????????? Team Seats, ???????? ??????? ??? ?????? ??????? ????? ????? ???????? ? ??????????? ??? ??????????? membership access."
                      : isUk
                        ? "IBPA ??????? ?? ????? ????? ????????? ????????????? ???????????? ??????? Team Member ?? ????????. ???????????? ???????????? Team Seats, ??????????? ??????? ??? ?????? ?????? ?????? ???? ????????? ?? ????????? ??? ?????????? membership access."
                        : "IBPA reserves the right to request proof of professional affiliation between a Team Member and the business. Misuse of Team Seats, sharing access, or transferring access to third parties may result in restricted or terminated membership access."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-[28px] border border-[#E4EDF3] bg-white p-6">
                <p className={`text-sm uppercase text-[#72A0C1] ${uiClassName}`}>
                  {isRu ? "Future Event / Webinar Logic" : isUk ? "Future Event / Webinar Logic" : "Future Event / Webinar Logic"}
                </p>
                <ul className="mt-4 space-y-3 text-slate-600">
                  {[
                    isRu ? "personal registration ??? ??????? Team Member" : isUk ? "personal registration ??? ??????? Team Member" : "personal registration",
                    isRu ? "personal QR / ticket" : isUk ? "personal QR / ticket" : "personal QR / ticket",
                    isRu ? "individual attendance tracking" : isUk ? "individual attendance tracking" : "individual attendance tracking",
                  ].map((item) => (
                    <li key={item} className={`flex items-start gap-3 text-sm leading-relaxed ${bodyClassName}`}>
                      <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#72A0C1]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-[#E4EDF3] bg-white p-6">
                <p className={`text-sm uppercase text-[#72A0C1] ${uiClassName}`}>
                  {isRu ? "Member ID Format" : isUk ? "Member ID Format" : "Member ID Format"}
                </p>
                <div className={`mt-4 space-y-2 text-sm text-slate-700 ${bodyClassName}`}>
                  <p>Business Owner: <span className="font-bold">IBPA-BO-001</span></p>
                  <p>Team Members: <span className="font-bold">IBPA-BO-001-T1</span>, <span className="font-bold">IBPA-BO-001-T2</span>, <span className="font-bold">IBPA-BO-001-T3</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7.8 How to join */}
      <section className="overflow-hidden bg-[#F1F3F5] py-40 text-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid items-center gap-24 lg:grid-cols-2">
            <motion.div {...fadeInUp} className="space-y-12">
              <h2 className={`text-5xl uppercase leading-[0.94] text-slate-900 md:text-[4.85rem] ${headlineClassName}`}>
                {isRu ? <>Как вступить в <span className="text-[#B9D9EB]">IBPA?</span></> : isUk ? <>Як долучитися до <span className="text-[#B9D9EB]">IBPA?</span></> : <>How to join <span className="text-[#B9D9EB]">IBPA?</span></>}
              </h2>
              <div className="space-y-10">
                {[
                  { step: "01", title: isRu ? "Выбор тарифа" : isUk ? "Вибір тарифу" : "Choose Category", desc: isRu ? "Выберите подходящий тариф или пакет участия." : isUk ? "Оберіть відповідний тариф або пакет участі." : "Choose the membership category that fits your profile." },
                  { step: "02", title: isRu ? "Подача заявки" : isUk ? "Подання заявки" : "Submit Application", desc: isRu ? "Заполните и отправьте заявку на вступление." : isUk ? "Заповніть і надішліть заявку на вступ." : "Complete and submit your application." },
                  { step: "03", title: isRu ? "Рассмотрение" : isUk ? "Розгляд" : "Review Process", desc: isRu ? "Ваша заявка направляется на рассмотрение комиссии по отбору." : isUk ? "Вашу заявку передають на розгляд комісії з відбору." : "Your application is reviewed by the Membership Review Board." },
                  { step: "04", title: isRu ? "Активация" : isUk ? "Активація" : "Activation", desc: isRu ? "После одобрения и оплаты вы получаете статус участника сообщества." : isUk ? "Після схвалення та оплати ви отримуєте статус учасника спільноти." : "After approval and payment, your membership becomes active." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className={`text-4xl text-[#B9D9EB]/50 transition-colors group-hover:text-[#72A0C1] ${headlineClassName}`}>
                      {item.step}
                    </div>
                    <div className="space-y-2">
                      <h4 className={`text-2xl uppercase leading-[0.96] text-slate-900 ${headlineClassName}`}>{item.title}</h4>
                      <p className={`text-slate-600 ${bodyClassName}`}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeInUp} className="group relative aspect-square overflow-hidden rounded-[100px] shadow-[0_24px_80px_rgba(39,54,72,0.14)]">
              <ImageWithFallback src="https://images.unsplash.com/photo-1760862652442-e8ff7ebdd2f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtaW5pbWFsaXN0JTIwYmVhdXR5JTIwc2Fsb24lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzM0MjQzNDF8MA&ixlib=rb-4.1.0&q=80&w=1080" alt={isRu ? "Подача заявки" : isUk ? "Подання заявки" : "Apply"} className="h-full w-full object-cover brightness-[0.62] transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <div className="w-full flex flex-col gap-4">
                  <Link href="/apply" className="group/btn flex w-full items-center justify-center gap-5 rounded-[42px] border-2 border-[#B9D9EB] py-8 text-white transition-all hover:bg-[#B9D9EB] hover:text-white">
                    <span className={`text-4xl uppercase leading-none md:text-6xl ${headlineClassName}`}>{isRu ? "ПОДАТЬ ЗАЯВКУ" : isUk ? "ПОДАТИ ЗАЯВКУ" : "START APPLICATION"}</span>
                    <ChevronRight size={44} className="opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-3 transition-all" />
                  </Link>
                  <Link href="/criteria" className={`w-full rounded-[32px] border border-white/40 bg-white/10 py-5 text-center text-sm uppercase text-white transition-all hover:border-white/70 hover:text-white ${uiClassName}`}>
                    {isRu ? "Критерии участия" : isUk ? "Критерії участі" : "Review Membership Criteria"}
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
