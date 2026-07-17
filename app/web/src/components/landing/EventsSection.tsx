import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { EventCard } from "@/components/content/EventCard";
import { SectionPattern } from "@/components/landing/SectionPattern";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { getBackendUrl } from "@/lib/public-urls";
import type { ContentImageMetadata } from "@/lib/content-image";

interface EventItem {
  date: string;
  name: string;
  location: string;
  img: string;
  aspect: number;
  description: string;
  href: string;
  imageMetadata?: ContentImageMetadata | null;
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
  imageMetadata?: ContentImageMetadata | null;
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
    imageMetadata: item.imageMetadata ?? null,
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
            <EventCard
              key={`${event.name}-${i}`}
              event={{
                title: event.name,
                description: event.description,
                coverImage: event.img,
                coverAspect: event.aspect,
                imageMetadata: event.imageMetadata,
                eyebrow: copy.upcoming,
              }}
              imagePriority={i === 0}
              imageSizes="(min-width: 1024px) 620px, 100vw"
              meta={[
                { kind: "date", value: event.date },
                { kind: "location", value: event.location },
              ]}
              actions={
                <Link href={event.href} target={event.href.startsWith("http") ? "_blank" : undefined} rel={event.href.startsWith("http") ? "noreferrer" : undefined} className={`inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#1F5D8F] px-8 py-4 text-center text-[10px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#17496F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#72A0C1]/40 md:w-fit ${uiClassName}`}>
                  {copy.register} <ArrowRight size={14} />
                </Link>
              }
              titleClassName={`${headlineClassName} uppercase`}
              variant="featured"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
