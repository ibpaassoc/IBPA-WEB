"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";
import { fetchPublicContent, type PublicContentItem } from "@/lib/public-content";

export default function NewsPage() {
  const { locale } = useI18n();
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const isRu = locale === "ru";
  const isUk = locale === "uk";
  const useEnglishTypography = true;
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const contentClampStyle = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as const,
    WebkitLineClamp: 4,
    overflow: "hidden",
  };

  useEffect(() => {
    let mounted = true;

    fetchPublicContent("news", "site")
      .then((nextItems) => {
        if (mounted) {
          setItems(nextItems);
        }
      })
      .catch(() => {
        if (mounted) {
          setItems([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggleExpanded = (key: string) => {
    setExpandedItems((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const renderedUpdates = items.map((item) => ({
    category: isRu ? "Новость" : isUk ? "Новина" : "News",
    title: item.title,
    date: new Date(item.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    summary: item.body,
    image: item.coverImage || "/news/beauty-forum-2025.webp",
    href: item.ctaUrl || "/contact",
    ctaLabel: item.ctaLabel || (isRu ? "Открыть материал" : isUk ? "Відкрити матеріал" : "Open Story"),
    isPinned: Boolean(item.isPinned),
  }));

  return (
    <div className="min-h-screen bg-[#F1F3F5] pt-40 pb-24">
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        <div className="space-y-6">
          <p className={`text-[10px] uppercase tracking-[0.4em] text-[#708090] ${uiClassName}`}>{isRu ? "Редакция" : isUk ? "Редакція" : "Newsroom"}</p>
          <h1 className={`text-6xl sm:text-7xl md:text-9xl uppercase leading-[0.92] text-slate-900 ${headlineClassName}`}>
            {isRu ? <>Новости и <span className="text-[#72A0C1]">аналитика</span></> : isUk ? <>Новини та <span className="text-[#72A0C1]">аналітика</span></> : <>News And <span className="text-[#72A0C1]">Insights</span></>}
          </h1>
          <p className={`max-w-3xl text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
            {isRu
              ? "Следите за обновлениями IBPA, развитием индустрии, образовательными инициативами и профессиональной аналитикой для сообщества индустрии красоты."
              : isUk
                ? "Слідкуйте за оновленнями IBPA, розвитком індустрії, освітніми ініціативами та професійною аналітикою для спільноти індустрії краси."
              : "Follow IBPA updates, industry developments, educational initiatives, and professional commentary for the beauty community."}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {!isLoaded ? (
            <div className="md:col-span-2 rounded-[40px] border border-slate-200/80 bg-white px-8 py-10 text-sm text-slate-500 shadow-[0_18px_54px_rgba(15,23,42,0.06)]">
              Loading news...
            </div>
          ) : renderedUpdates.length ? (
            renderedUpdates.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-[40px] border border-slate-200/80 bg-white shadow-[0_18px_54px_rgba(15,23,42,0.06)]">
                <div className="aspect-[16/9] overflow-hidden rounded-[40px]">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-8">
                  <p className={`text-[10px] uppercase tracking-[0.24em] text-[#708090] ${uiClassName}`}>{item.category}</p>
                  {item.isPinned ? (
                    <div className="mt-3">
                      <span className={`inline-flex rounded-full bg-[#72A0C1] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white ${uiClassName}`}>
                        {isRu ? "Закреплено" : isUk ? "Закріплено" : "Pinned"}
                      </span>
                    </div>
                  ) : null}
                  <p className={`mt-3 text-[10px] uppercase tracking-[0.24em] text-slate-400 ${uiClassName}`}>{item.date}</p>
                  <h2 className={`mt-4 text-2xl uppercase text-slate-900 ${headlineClassName}`}>{item.title}</h2>
                  <p className={`mt-4 leading-relaxed text-slate-600 ${bodyClassName}`} style={expandedItems[item.title] ? undefined : contentClampStyle}>
                    {item.summary}
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.title)}
                      className={`inline-flex justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm uppercase text-slate-900 ${uiClassName}`}
                    >
                      {expandedItems[item.title]
                        ? isRu
                          ? "Скрыть"
                          : isUk
                            ? "Сховати"
                            : "Hide"
                        : isRu
                          ? "Раскрыть"
                          : isUk
                            ? "Показати"
                            : "Read More"}
                    </button>
                  </div>
                  {item.href && (
                    <div className="mt-4">
                      <Link href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noreferrer" : undefined} className={`inline-flex justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm uppercase text-slate-900 ${uiClassName}`}>
                        {item.ctaLabel}
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="md:col-span-2 rounded-[40px] border border-dashed border-slate-200 bg-white px-8 py-10 text-sm text-slate-500 shadow-[0_18px_54px_rgba(15,23,42,0.06)]">
              No news items are available right now.
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/contact" className={`inline-flex justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-sm uppercase text-slate-900 ${uiClassName}`}>
            {isRu ? "Связаться с редакцией" : isUk ? "Зв’язатися з редакцією" : "Contact Editorial Team"}
          </Link>
          <Link href="/membership#packages" className={`inline-flex justify-center rounded-full bg-black px-8 py-4 text-sm uppercase text-white ${uiClassName}`}>
            {isRu ? "Смотреть тарифы и пакеты" : isUk ? "Переглянути тарифи та пакети" : "View Membership"}
          </Link>
        </div>
      </div>
    </div>
  );
}
