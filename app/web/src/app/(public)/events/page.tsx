"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "@/components/content/EventCard";
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

  const localizedEvent = useMemo(() => ({
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
  }), [isRu, isUk]);

  useEffect(() => {
    fetchPublicContent("events", "site")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const renderedEvents = useMemo(
    () =>
      items.length
        ? items.map((item) => ({
            date: new Date(item.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            title: item.title,
            location: isRu ? "Опубликовано для сайта IBPA" : isUk ? "Опубліковано для сайту IBPA" : "Published for the IBPA website",
            description: item.body,
            extra: "",
            href: item.ctaUrl || "/contact",
            ctaLabel: item.ctaLabel || (isRu ? "Открыть ссылку" : isUk ? "Відкрити посилання" : "Open Link"),
            image: item.coverImage || "/events/teora-event.webp",
            imageMetadata: item.imageMetadata ?? null,
            aspect: item.coverAspect ?? 16 / 9,
            isPinned: Boolean(item.isPinned),
          }))
        : [{
            ...localizedEvent,
            ctaLabel: isRu ? "Перейти к регистрации" : isUk ? "Перейти до реєстрації" : "Open Registration",
            image: "/events/teora-event.webp",
            imageMetadata: null,
            aspect: 16 / 9,
            isPinned: false,
          }],
    [isRu, isUk, items, localizedEvent],
  );

  return (
    <div className="min-h-screen bg-[#F1F3F5] pt-40 pb-24">
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        <div className="space-y-6">
          <p className={`text-[10px] uppercase tracking-[0.4em] text-[#708090] ${uiClassName}`}>
            {isRu ? "События IBPA" : isUk ? "Події IBPA" : "IBPA Events"}
          </p>
          <h1 className={`break-words text-5xl uppercase leading-[0.92] text-slate-900 sm:text-7xl md:text-9xl ${headlineClassName}`}>
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

        <div className="space-y-8">
          {renderedEvents.map((renderedEvent, index) => (
            <EventCard
              key={`${renderedEvent.title}-${index}`}
              event={{
                title: renderedEvent.title,
                description: [renderedEvent.description, renderedEvent.extra].filter(Boolean).join("\n\n"),
                coverImage: renderedEvent.image,
                coverAspect: renderedEvent.aspect,
                imageMetadata: renderedEvent.imageMetadata,
                eyebrow: renderedEvent.isPinned
                  ? isRu ? "Закреплено" : isUk ? "Закріплено" : "Pinned"
                  : isRu ? "Событие IBPA" : isUk ? "Подія IBPA" : "IBPA event",
              }}
              imagePriority={index === 0}
              imageSizes="(min-width: 1024px) 520px, 100vw"
              meta={[
                { kind: "date", label: isRu ? "Дата" : isUk ? "Дата" : "Date", value: renderedEvent.date },
                { kind: "location", label: isRu ? "Место" : isUk ? "Місце" : "Location", value: renderedEvent.location },
              ]}
              actions={
                <>
                  <Link href={renderedEvent.href} target={renderedEvent.href.startsWith("http") ? "_blank" : undefined} rel={renderedEvent.href.startsWith("http") ? "noreferrer" : undefined} className={`inline-flex justify-center rounded-full bg-[#1F5D8F] px-7 py-3.5 text-sm uppercase text-white transition hover:bg-[#17496F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#72A0C1]/40 ${uiClassName}`}>
                    {renderedEvent.ctaLabel}
                  </Link>
                  <Link href="/contact" className={`inline-flex justify-center rounded-full border border-[#C8D9EA] bg-white px-7 py-3.5 text-sm uppercase text-[#10203B] transition hover:border-[#72A0C1] hover:text-[#1F5D8F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#72A0C1]/40 ${uiClassName}`}>
                    {isRu ? "Запросить детали события" : isUk ? "Запитати деталі події" : "Request Event Details"}
                  </Link>
                </>
              }
              titleClassName={headlineClassName}
              variant="featured"
            />
          ))}
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
