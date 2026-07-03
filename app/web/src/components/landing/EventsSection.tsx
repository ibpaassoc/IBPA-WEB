import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { SectionPattern } from "@/components/landing/SectionPattern";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { getBackendUrl } from "@/lib/public-urls";

interface EventItem {
  date: string;
  name: string;
  location: string;
  img: string;
  aspect: number;
  description: string;
  href: string;
}

type EventsSectionProps = {
  locale: "en" | "ru" | "uk";
};

type ContentItem = {
  id: string;
  title: string;
  body: string;
  coverImage?: string | null;
  coverAspect?: number | null;
  cover_aspect?: number | null;
  ctaUrl?: string | null;
  createdAt: string;
};

async function getEvents() {
  const response = await fetch(getBackendUrl("/api/content/public?type=events&target=site"), {
    next: { revalidate: 300 },
  }).catch(() => null);

  if (!response?.ok) {
    return [] as ContentItem[];
  }

  const data = await response.json().catch(() => ({}));
  return Array.isArray(data.items) ? (data.items as ContentItem[]) : [];
}

export const EventsSection = async ({ locale }: EventsSectionProps) => {
  const items = await getEvents();
  const useEnglishHomepageTypography = true;
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const copy =
    locale === "ru"
      ? {
          eyebrow: "Предстоящие события",
          title: "Будущие события",
          description:
            "IBPA регулярно организует профессиональные события, которые поддерживают образование, нетворкинг и сотрудничество в индустрии красоты.",
          subdescription:
            "Каждое событие объединяет экспертов, преподавателей, бренды и профессионалов для обмена знаниями и опытом.",
          viewAll: "Все события",
          register: "Регистрация",
          upcoming: "Скоро",
          siteLabel: "Опубликовано для сайта IBPA",
        }
      : locale === "uk"
        ? {
            eyebrow: "Майбутні події",
            title: "Майбутні події",
            description:
              "IBPA регулярно організовує професійні події, що підтримують освіту, нетворкінг і співпрацю в beauty-індустрії.",
            subdescription:
              "Кожна подія об’єднує експертів, викладачів, бренди та професіоналів для обміну знаннями й досвідом.",
            viewAll: "Усі події",
            register: "Реєстрація",
            upcoming: "Скоро",
            siteLabel: "Опубліковано для сайту IBPA",
          }
        : {
            eyebrow: "Upcoming Events",
            title: "Future Events",
            description:
              "IBPA regularly organizes professional events that support education, networking, and collaboration within the beauty industry.",
            subdescription:
              "Each event brings together experts, educators, brands, and professionals to exchange knowledge and experience.",
            viewAll: "View All Events",
            register: "Register Now",
            upcoming: "Upcoming",
            siteLabel: "Published for the IBPA website",
          };
  const events: EventItem[] = items.slice(0, 1).map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    name: item.title,
    location: copy.siteLabel,
    img: item.coverImage || "/events/teora-event.webp",
    aspect: item.coverAspect ?? item.cover_aspect ?? 16 / 9,
    description: item.body,
    href: item.ctaUrl || "/events",
  }));

  if (!events.length) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-[#F1F3F5] py-20 md:py-40">
      <SectionPattern variant="left" className="top-12" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-24">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <p className={`text-[#708090] text-sm tracking-[0.5em] uppercase ${uiClassName}`}>{copy.eyebrow}</p>
              <h2 className={`text-[2.75rem] md:text-[4.85rem] uppercase leading-[0.94] ${headlineClassName}`}>{copy.title}</h2>
            </div>
            <div className="space-y-6">
              <p className={`text-[1.1rem] text-gray-700 leading-relaxed md:text-[1.32rem] ${bodyClassName}`}>
                {copy.description}
              </p>
              <p className={`text-gray-500 text-sm leading-relaxed ${bodyClassName}`}>
                {copy.subdescription}
              </p>
            </div>
          </div>
          <Link href="/events" className={`group flex items-center gap-4 text-sm uppercase tracking-[0.14em] border-b-2 border-black pb-2 hover:text-[#72A0C1] hover:border-[#72A0C1] transition-all whitespace-nowrap ${uiClassName}`}>
            {copy.viewAll} <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="grid gap-8">
          {events.map((event, i) => (
            <div key={i} className="group overflow-hidden rounded-[44px] border border-white bg-[#F0F8FF]/30 transition-[background-color,box-shadow,border-color] duration-300 hover:bg-white hover:shadow-2xl">
              <div className="grid lg:grid-cols-[0.96fr_1.04fr]">
              <div className="relative overflow-hidden" style={{ aspectRatio: event.aspect }}>
                <ImageWithFallback
                  src={event.img}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  alt={event.name}
                  sizes="(min-width: 1024px) 620px, 100vw"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className={`absolute top-6 right-6 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] text-white uppercase tracking-[0.14em] ${uiClassName}`}>
                  {copy.upcoming}
                </div>
              </div>
              
              <div className="p-10 md:p-12 flex-grow flex flex-col space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-[#708090]">
                    <CalendarDays size={20} className="text-[#72A0C1]" />
                    <span className={`text-[10px] uppercase tracking-[0.14em] ${uiClassName}`}>{event.date}</span>
                  </div>
                  <h3 className={`text-3xl uppercase font-bold leading-tight md:text-5xl ${headlineClassName}`}>
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-3 text-gray-400">
                    <MapPin size={20} className="opacity-50" />
                    <span className={`text-xs ${bodyClassName}`}>{event.location}</span>
                  </div>
                  <div className="max-w-2xl pt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                    <p className={`hidden md:block ${bodyClassName}`}>
                      {event.description}
                    </p>

                    <details className="group md:hidden">
                      <summary className={`list-none cursor-pointer ${bodyClassName}`}>
                        <p
                          className="overflow-hidden"
                          style={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 4,
                          }}
                        >
                          {event.description}
                        </p>
                        <span className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                          <span className="group-open:hidden">раскрыть</span>
                          <span className="hidden group-open:inline">свернуть</span>
                          <ArrowRight size={12} className="transition-transform group-open:rotate-90" />
                        </span>
                      </summary>
                      <p className={`mt-4 ${bodyClassName}`}>
                        {event.description}
                      </p>
                    </details>
                  </div>
                </div>
                
                <div className="pt-4 mt-auto">
                  <Link href={event.href} target="_blank" rel="noreferrer" className={`w-full md:w-fit px-8 py-4 bg-black text-white text-center rounded-full text-[10px] uppercase tracking-[0.16em] group-hover:bg-[#72A0C1] group-hover:text-black transition-colors duration-300 flex items-center justify-center gap-3 ${uiClassName}`}>
                    {copy.register} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
