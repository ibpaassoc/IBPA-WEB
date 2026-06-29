"use client";
import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { SectionPattern } from "@/components/landing/SectionPattern";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";
import { buildApplyHref, getMembershipCategory } from "@/lib/membership";

interface AudienceItem {
  title: string;
  price: string;
  type: string;
  desc: string;
  img: string;
}

export const AudienceSection: React.FC = () => {
  const { t, locale } = useI18n();
  const audience = t.home.audience.items;
  const useEnglishHomepageTypography = true;
  const swipeHint = locale === "ru" ? "Swipe" : locale === "uk" ? "Swipe" : "Swipe";
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleWheelScroll = (event: React.WheelEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return;
    if (!scrollerRef.current) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();
    scrollerRef.current.scrollLeft += event.deltaY;
  };

  const scrollToIndex = React.useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, audience.length - 1));
    const node = itemRefs.current[clampedIndex];
    if (!node) return;

    node.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    setActiveIndex(clampedIndex);
  }, [audience.length]);

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const updateActiveCard = () => {
      const scrollerRect = scroller.getBoundingClientRect();
      const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((node, index) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const distance = Math.abs(center - scrollerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    };

    updateActiveCard();
    scroller.addEventListener("scroll", updateActiveCard, { passive: true });
    window.addEventListener("resize", updateActiveCard);
    return () => {
      scroller.removeEventListener("scroll", updateActiveCard);
      window.removeEventListener("resize", updateActiveCard);
    };
  }, [audience.length]);

  return (
    <section className="relative overflow-hidden bg-[#F1F3F5] py-20 text-slate-900 md:py-40">
      <SectionPattern variant="right" className="top-8" />
      <SectionPattern variant="left" className="bottom-0 opacity-35" />
      <div className="max-w-7xl mx-auto px-6 mb-14 md:mb-24 flex flex-col items-center gap-6 text-center">
         <h2 className={`text-[2.75rem] md:text-[4.85rem] uppercase max-w-3xl leading-[0.94] ${headlineClassName}`}>{t.home.audience.title}</h2>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-35 md:inline-flex"
          aria-label={locale === "ru" ? "Предыдущая карточка" : locale === "uk" ? "Попередня картка" : "Previous card"}
        >
          <ArrowLeft size={40} />
        </button>
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex === audience.length - 1}
          className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-35 md:inline-flex"
          aria-label={locale === "ru" ? "Следующая карточка" : locale === "uk" ? "Наступна картка" : "Next card"}
        >
          <ArrowRight size={40} />
        </button>

        <div
          ref={scrollerRef}
          onWheel={handleWheelScroll}
          className="flex gap-4 overflow-x-auto pb-20 px-6 snap-x snap-mandatory no-scrollbar md:gap-6 md:px-[calc((100vw-80rem)/2)]"
        >
          {audience.map((item, i) => (
            <div 
              key={i}
              ref={(node) => {
                itemRefs.current[i] = node;
              }}
              className="group relative h-[550px] md:h-[650px] w-[85vw] md:w-[450px] overflow-hidden rounded-[40px] md:rounded-[60px] snap-center shrink-0 bg-white shadow-xl"
             >
              <ImageWithFallback
                src={item.img}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-[1.08]"
                alt={item.title}
                sizes="(min-width: 768px) 480px, 90vw"
              />
              <div className="absolute inset-0 bg-black/30 opacity-100 transition-opacity duration-500 md:group-hover:opacity-0" />
              
              <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end bg-linear-to-t from-white via-white/40 to-transparent">
                 <div className="mb-4 md:transition-transform md:duration-500 md:translate-y-0 md:group-hover:-translate-y-2">
                    <span className={`text-[10px] uppercase tracking-[0.14em] text-slate-500 mb-2 block ${uiClassName}`}>{item.type}</span>
                    <h3 className={`text-3xl md:text-5xl uppercase font-bold leading-none ${headlineClassName}`}>{item.title}</h3>
                 </div>
                 
                 <div className="overflow-hidden">
                    <div className="min-h-0">
                      <div className="space-y-6 pt-4 opacity-100 md:max-h-0 md:overflow-hidden md:translate-y-6 md:opacity-0 md:transition-[max-height,opacity,transform] md:duration-[950ms] md:ease-[cubic-bezier(0.16,1,0.3,1)] md:group-hover:max-h-[320px] md:group-hover:translate-y-0 md:group-hover:opacity-100">
                        <p className={`text-slate-600 text-sm md:text-base leading-relaxed ${bodyClassName}`}>
                          {item.desc}
                        </p>
                        <div className="pt-6 flex items-end justify-between border-t border-slate-100">
                          <div className="space-y-1">
                             <span className={`text-[10px] uppercase text-slate-400 block tracking-[0.14em] ${uiClassName}`}>{t.home.audience.annualFee}</span>
                             <span className={`text-3xl md:text-4xl font-bold text-[#708090] ${headlineClassName}`}>{item.price}</span>
                          </div>
                          <Link
                            href={buildApplyHref(getMembershipCategory(item.title))}
                            aria-label={
                              locale === "ru"
                                ? `Подать заявку: ${item.title}`
                                : locale === "uk"
                                  ? `Подати заявку: ${item.title}`
                                  : `Apply for ${item.title}`
                            }
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-2xl transition-transform duration-300 hover:scale-110 md:h-16 md:w-16"
                          >
                             <ArrowRight size={24} />
                          </Link>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-2 flex max-w-7xl flex-col items-center gap-4 px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-1 py-1">
            {audience.map((item, index) => (
              <button
                key={`${item.title}-dot`}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`${locale === "ru" ? "Показать карточку" : locale === "uk" ? "Показати картку" : "Show card"} ${index + 1}`}
                className={`rounded-full transition-all ${index === activeIndex ? "h-2.5 w-6 bg-[#72A0C1]" : "h-2.5 w-2.5 bg-[#B8C7D1]/90 hover:bg-[#8FA9BA]"}`}
              />
            ))}
          </div>
          <div className={`inline-flex items-center gap-3 px-1 py-1 text-[10px] uppercase tracking-[0.24em] text-[#708090] md:hidden ${uiClassName}`}>
            <ArrowLeft size={12} className="opacity-70" />
            <span>{swipeHint}</span>
            <ArrowRight size={12} className="opacity-70" />
          </div>
        </div>
      </div>
    </section>
  );
};
