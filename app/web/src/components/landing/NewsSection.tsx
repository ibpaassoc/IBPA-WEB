import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { InteractiveContentImage } from "@/components/content/InteractiveContentImage";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { getBackendUrl } from "@/lib/public-urls";
import type { ContentImageMetadata } from "@/lib/content-image";

type NewsSectionProps = {
  locale: "en" | "ru" | "uk";
};

type ContentItem = {
  id: string;
  type: "news" | "events";
  title: string;
  coverImage?: string | null;
  coverAspect?: number | null;
  cover_aspect?: number | null;
  imageMetadata?: ContentImageMetadata | null;
  ctaUrl?: string | null;
  createdAt: string;
};

async function getNews() {
  const response = await fetch(getBackendUrl("/api/content/public?type=news&target=site"), {
    next: { revalidate: 300 },
  }).catch(() => null);

  if (!response?.ok) {
    return [] as ContentItem[];
  }

  const data = await response.json().catch(() => ({}));
  return Array.isArray(data.items) ? (data.items as ContentItem[]) : [];
}

export const NewsSection = async ({ locale }: NewsSectionProps) => {
  const items = await getNews();
  const useEnglishHomepageTypography = true;
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const copy =
    locale === "ru"
      ? {
          eyebrow: "Новости и обновления",
          title: "Последние новости",
          description: "Следите за ключевыми новостями, публикациями и обновлениями, которые формируют сообщество IBPA.",
          viewAll: "Все новости",
          readArticle: "Открыть",
          newsCategory: "Новость",
        }
      : locale === "uk"
        ? {
            eyebrow: "Новини та оновлення",
            title: "Останні новини",
            description: "Слідкуйте за ключовими новинами, публікаціями та оновленнями, що формують спільноту IBPA.",
            viewAll: "Усі новини",
            readArticle: "Відкрити",
            newsCategory: "Новина",
          }
        : {
            eyebrow: "News & Updates",
            title: "Latest News",
            description: "Follow the latest stories, publications, and updates shaping the IBPA professional community.",
            viewAll: "View All News",
            readArticle: "Read Article",
            newsCategory: "News",
          };
  const newsItems = items.slice(0, 2).map((item) => ({
    img: item.coverImage || "/news/beauty-forum-2025.webp",
    aspect: item.coverAspect ?? item.cover_aspect ?? 16 / 9,
    title: item.title,
    date: new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    category: locale === "ru" ? "Новость" : locale === "uk" ? "Новина" : item.type === "news" ? copy.newsCategory : "Event",
    imageMetadata: item.imageMetadata ?? null,
  }));

  if (!newsItems.length) {
    return null;
  }

  return (
    <section className="py-20 md:py-40 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-24">
          <div className="max-w-3xl space-y-6">
            <p className={`text-[#708090] text-sm tracking-[0.4em] uppercase ${uiClassName}`}>{copy.eyebrow}</p>
            <div className="max-w-4xl">
              <h2 className={`text-[2.75rem] md:text-[4.85rem] uppercase leading-[0.94] ${headlineClassName}`}>{copy.title}</h2>
            </div>
            <p className={`text-[1.1rem] text-gray-700 leading-relaxed md:text-[1.32rem] ${bodyClassName}`}>
              {copy.description}
            </p>
          </div>
          <Link href="/news" className={`group flex items-center gap-4 text-sm uppercase tracking-[0.14em] border-b-2 border-black pb-2 hover:text-[#72A0C1] hover:border-[#72A0C1] transition-all whitespace-nowrap ${uiClassName}`}>
            {copy.viewAll} <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          {newsItems.map((news, i) => (
            <article key={i} className="group block space-y-6">
              <div className="relative overflow-hidden rounded-[40px]">
                <InteractiveContentImage
                  alt={news.title}
                  className="rounded-[40px]"
                  imageClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                  legacyAspect={news.aspect}
                  legacyUrl={news.img}
                  metadata={news.imageMetadata}
                  sizes="(min-width: 768px) 600px, 100vw"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className={`absolute bottom-6 left-6 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] text-white uppercase tracking-[0.14em] ${uiClassName}`}>
                  {news.category}
                </div>
              </div>
                <div className="space-y-4 px-2">
                <p className={`text-[#708090] text-[10px] uppercase tracking-[0.14em] ${uiClassName}`}>{news.date}</p>
                <div className="space-y-4">
                  <h3 className={`text-2xl uppercase font-bold group-hover:text-[#72A0C1] transition-colors ${headlineClassName}`}>
                    <Link href="/news">{news.title}</Link>
                  </h3>
                </div>
                <Link href="/news" className={`flex items-center gap-2 text-black text-[10px] uppercase tracking-[0.14em] ${uiClassName}`}>
                  {copy.readArticle} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
