"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InteractiveContentImage } from "@/components/content/InteractiveContentImage";
import { PreservedText } from "@/components/content/PreservedText";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";
import { fetchPublicContent, type PublicContentItem } from "@/lib/public-content";

export default function EventsPage() {
  const { locale } = useI18n();
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const isRu = locale === "ru";
  const isUk = locale === "uk";
  const useEnglishTypography = true;
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";

  const localizedEvent = {
    date: isRu ? "Сезон 2 • 25 февраля — 20 мая" : isUk ? "Сезон 2 • 25 лютого — 20 травня" : "Season 2 • Feb 25 — May 20",
    title: isRu ? "TB Champions — международный онлайн чемпионат для beauty-мастеров" : isUk ? "TB Champions — міжнародний онлайн чемпіонат для beauty-майстрів" : "TB Champions — International Online Championship for Beauty Professionals",
    location: isRu ? "Онлайн • участники со всего мира" : isUk ? "Онлайн • учасники з усього світу" : "Online • participants from around the world",
    description: isRu
      ? "TB Champions объединяет макияж, прически, наращивание волос, оформление бровей, перманентный макияж, ламинирование и наращивание ресниц, а также маникюр. Организаторы Eleonora Bediukh и Tetiana Kysliuk — эксперты в ламинировании ресниц и оформлении бровей, создатели бренда TE'ORA BEAUTY, многократные победители чемпионатов и аккредитованные судьи."
      : isUk
        ? "TB Champions об’єднує макіяж, зачіски, нарощення волосся, оформлення брів, перманентний макіяж, ламінування та нарощення вій, а також манікюр. Організаторки Eleonora Bediukh і Tetiana Kysliuk — експертки з ламінування вій та оформлення брів, засновниці бренду TE'ORA BEAUTY, багаторазові переможниці чемпіонатів та акредитовані судді."
        : "TB Champions brings together makeup, hairstyling, hair extensions, brow design, permanent makeup, lash lift, lash extensions, and manicure. Organizers Eleonora Bediukh and Tetiana Kysliuk are lash lift and brow design experts, founders of TE'ORA BEAUTY, multiple championship winners, and accredited judges.",
    extra: isRu
      ? "Чемпионат проходит на конкурсной основе с прозрачной системой оценивания для всех участников. Соревнования проходят каждые три месяца для мастеров со всего мира."
      : isUk
        ? "Чемпіонат проходить на конкурсній основі з прозорою системою оцінювання для всіх учасників. Змагання відбуваються кожні три місяці для майстрів з усього світу."
        : "The championship runs on a competitive format with a transparent judging system for all participants. New rounds are held every three months for beauty professionals worldwide.",
    href: "https://teora-beauty-championship.square.site/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAdGRleAQuo5BleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae4Yk3L2Lldo694Elx9CO9YP9zHG4mPuv1Qm_j8YU97TxLZtRhkJO9He-wLUw_aem_PuI-1mvDBpGMihapo0dYAw",
  };

  useEffect(() => {
    fetchPublicContent("events", "site")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const renderedEvent = useMemo(
    () =>
      items[0]
        ? {
            date: new Date(items[0].createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            title: items[0].title,
            location: isRu ? "Опубликовано для сайта IBPA" : isUk ? "Опубліковано для сайту IBPA" : "Published for the IBPA website",
            description: items[0].body,
            extra: "",
            href: items[0].ctaUrl || "/contact",
            ctaLabel: items[0].ctaLabel || (isRu ? "Открыть ссылку" : isUk ? "Відкрити посилання" : "Open Link"),
            image: items[0].coverImage || "/events/teora-event.webp",
            aspect: items[0].coverAspect ?? 16 / 9,
            isPinned: Boolean(items[0].isPinned),
          }
        : {
            ...localizedEvent,
            ctaLabel: isRu ? "Перейти к регистрации" : isUk ? "Перейти до реєстрації" : "Open Registration",
            image: "/events/teora-event.webp",
            aspect: 16 / 9,
            isPinned: false,
          },
    [isRu, isUk, items, localizedEvent],
  );

  return (
    <div className="min-h-screen bg-[#F1F3F5] pt-40 pb-24">
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        <div className="space-y-6">
          <p className={`text-[10px] uppercase tracking-[0.4em] text-[#708090] ${uiClassName}`}>
            {isRu ? "События IBPA" : isUk ? "Події IBPA" : "IBPA Events"}
          </p>
          <h1 className={`text-6xl sm:text-7xl md:text-9xl uppercase leading-[0.92] text-slate-900 ${headlineClassName}`}>
            {isRu ? <>Календарь <span className="text-[#72A0C1]">событий</span></> : isUk ? <>Календар <span className="text-[#72A0C1]">подій</span></> : <>Professional Events <span className="text-[#72A0C1]">Calendar</span></>}
          </h1>
          <p className={`max-w-3xl text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
            {isRu
              ? "Наша программа событий сфокусирована на образовании, профессиональном общении, конкурсах и международном сотрудничестве внутри индустрии красоты."
              : isUk
                ? "Наша програма подій зосереджена на освіті, професійному спілкуванні, конкурсах і міжнародній співпраці в індустрії краси."
              : "Our event program is focused on education, networking, competitions, and cross-border collaboration inside the beauty industry."}
          </p>
        </div>

        <div className="overflow-hidden rounded-[40px] border border-slate-200/70 bg-white shadow-[0_18px_54px_rgba(15,23,42,0.06)]">
          <div className="grid lg:grid-cols-[0.94fr_1.06fr]">
            <InteractiveContentImage
              alt={renderedEvent.title}
              caption={renderedEvent.description}
              className="rounded-none"
              legacyAspect={renderedEvent.aspect}
              legacyUrl={renderedEvent.image}
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
            />
            <div className="space-y-6 px-8 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
              <p className={`text-[10px] uppercase tracking-[0.24em] text-[#708090] ${uiClassName}`}>{renderedEvent.date}</p>
              {renderedEvent.isPinned ? (
                <div>
                  <span className={`inline-flex rounded-full bg-[#72A0C1] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white ${uiClassName}`}>
                    {isRu ? "Закреплено" : isUk ? "Закріплено" : "Pinned"}
                  </span>
                </div>
              ) : null}
              <h2 className={`text-3xl uppercase leading-none text-slate-900 md:text-5xl ${headlineClassName}`}>{renderedEvent.title}</h2>
              <p className={`text-sm uppercase tracking-[0.16em] text-slate-500 ${uiClassName}`}>{renderedEvent.location}</p>
              <PreservedText className={`max-w-3xl leading-relaxed text-slate-600 md:text-lg ${bodyClassName}`}>
                {renderedEvent.description}
              </PreservedText>
              {renderedEvent.extra ? (
                <PreservedText className={`max-w-3xl leading-relaxed text-slate-500 md:text-[1.02rem] ${bodyClassName}`}>
                  {renderedEvent.extra}
                </PreservedText>
              ) : null}
              <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                <Link href={renderedEvent.href} target={renderedEvent.href.startsWith("http") ? "_blank" : undefined} rel={renderedEvent.href.startsWith("http") ? "noreferrer" : undefined} className={`inline-flex justify-center rounded-full bg-black px-8 py-4 text-sm uppercase text-white ${uiClassName}`}>
                  {renderedEvent.ctaLabel}
                </Link>
                <Link href="/contact" className={`inline-flex justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-sm uppercase text-slate-900 ${uiClassName}`}>
                  {isRu ? "Запросить детали события" : isUk ? "Запитати деталі події" : "Request Event Details"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/membership#packages" className={`inline-flex justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-sm uppercase text-slate-900 ${uiClassName}`}>
            {isRu ? "Смотреть тарифы и пакеты" : isUk ? "Переглянути тарифи та пакети" : "Explore Membership"}
          </Link>
        </div>
      </div>
    </div>
  );
}
