import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { SectionPattern } from "@/components/landing/SectionPattern";
import { cyrillicDisplay, cyrillicEditorial } from "@/lib/cyrillic-fonts";
import { homeTemplateAccent, homeTemplateDisplay } from "@/lib/home-template-fonts";

type CommunitySectionProps = {
  locale: "en" | "ru" | "uk";
};

export const CommunitySection = ({ locale }: CommunitySectionProps) => {
  const copy =
    locale === "ru"
      ? {
          eyebrow: "Сила сообщества",
          title: "Создаем глобальное beauty-сообщество",
          description:
            "IBPA формирует международное профессиональное сообщество, основанное на экспертизе, сотрудничестве и постоянном развитии.",
          quote:
            "Мы приглашаем специалистов, преподавателей, владельцев бизнеса и бренды стать частью сообщества, которое формирует будущее индустрии красоты.",
          cta: "Стать частью сообщества",
          communityAlt: "Сообщество IBPA",
        }
      : locale === "uk"
        ? {
            eyebrow: "Сила спільноти",
            title: "Створюємо глобальну beauty-спільноту",
            description:
              "IBPA формує міжнародну професійну спільноту, засновану на експертизі, співпраці та постійному розвитку.",
            quote:
              "Запрошуємо фахівців, викладачів, власників бізнесу та бренди стати частиною спільноти, що формує майбутнє індустрії краси.",
            cta: "Стати частиною спільноти",
            communityAlt: "Спільнота IBPA",
          }
      : {
            eyebrow: "Community Power",
            title: "Building a Global Beauty Community",
            description:
              "IBPA is forming an international professional community based on expertise, collaboration, and professional development.",
            quote:
              "We invite professionals, educators, business owners, and brands to become part of the founding community shaping the future of the beauty industry.",
            cta: "JOIN IBPA",
            communityAlt: "IBPA community",
          };

  const useEnglishHomepageTypography = true;
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const editorialClassName = `${cyrillicEditorial.className} italic`;
  const accentClassName = useEnglishHomepageTypography ? homeTemplateAccent.className : editorialClassName;

  return (
    <section className="relative overflow-hidden bg-[#EFF3F7] py-20 text-slate-900 md:py-40">
      <SectionPattern variant="right" className="top-0" />

      <div className="absolute inset-0 overflow-hidden lg:hidden">
        <ImageWithFallback
          src="/home/website.webp"
          alt={copy.communityAlt}
          className="h-full w-full object-cover object-[72%_center]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>
      <div className="absolute inset-y-0 left-0 hidden w-[48%] overflow-hidden lg:block">
        <ImageWithFallback
          src="/home/website.webp"
          alt={copy.communityAlt}
          className="h-full w-full object-cover object-[58%_center]"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-y-0 right-0 w-[48%] bg-[linear-gradient(90deg,rgba(239,243,247,0)_0%,rgba(239,243,247,0.16)_16%,rgba(239,243,247,0.42)_34%,rgba(239,243,247,0.7)_54%,rgba(239,243,247,0.92)_78%,#EFF3F7_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="lg:ml-auto lg:w-[48%] lg:pl-14 xl:pl-20">
          <div className="space-y-12 rounded-[30px] p-8 md:p-10">
            <div className="space-y-6 md:hidden">
              <p className={`text-sm uppercase tracking-[0.5em] text-white ${uiClassName}`}>{copy.eyebrow}</p>
              <h2 className={`text-[2.75rem] uppercase leading-[0.94] text-slate-900 ${headlineClassName}`}>{copy.title}</h2>
            </div>

            <div className="hidden space-y-6 md:block">
              <p className={`text-sm uppercase tracking-[0.5em] text-[#72A0C1] ${uiClassName}`}>{copy.eyebrow}</p>
              <h2 className={`max-w-[20rem] text-[2.75rem] uppercase leading-[0.94] md:max-w-[32rem] md:text-[4.85rem] ${headlineClassName}`}>{copy.title}</h2>
            </div>

            <div className="space-y-8 md:hidden">
              <p className={`text-[1.1rem] leading-relaxed text-black ${bodyClassName}`}>{copy.description}</p>
            </div>

            <div className="hidden space-y-8 md:block">
              <p className={`max-w-[26rem] text-[1.32rem] leading-relaxed text-slate-600 ${bodyClassName}`}>{copy.description}</p>
            </div>

            <div className="pt-4">
              <Link
                href="/membership"
                className={`flex w-fit items-center gap-4 rounded-full bg-black px-12 py-6 text-sm uppercase tracking-[0.14em] text-white shadow-2xl transition-all hover:scale-105 ${uiClassName}`}
              >
                {copy.cta} <ArrowRight size={18} />
              </Link>
            </div>

            <p className={`mt-6 border-l border-white pl-8 text-[1.6125rem] leading-[1.35] text-white md:hidden ${accentClassName}`}>
              {copy.quote}
            </p>

            <p className={`mt-16 hidden max-w-[26rem] border-l border-[#72A0C1] pl-8 text-[1.8rem] leading-[1.35] text-[#72A0C1] md:block ${accentClassName}`}>
              {copy.quote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
