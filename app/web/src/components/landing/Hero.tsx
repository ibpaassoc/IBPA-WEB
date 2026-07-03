import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay, cyrillicEditorial } from "@/lib/cyrillic-fonts";
import { homeTemplateAccent, homeTemplateDisplay } from "@/lib/home-template-fonts";

type HeroProps = {
  locale: "en" | "ru" | "uk";
};

export const Hero = ({ locale }: HeroProps) => {
  const copy =
    locale === "ru"
      ? {
          titleTop: "International Beauty",
          titleBottom: "Professionals Association",
            subtitle: "Где красота создает сообщество",
          description:
            "IBPA объединяет бьюти-специалистов, преподавателей и бренды для развития отраслевых стандартов, образования и глобального роста.",
          primaryCta: "Подать заявку",
          secondaryCta: "Партнер / Спонсор",
          ticker: [
            "Профессиональные стандарты",
            "Международное сотрудничество",
            "Сообщество индустрии красоты",
          ],
          heroAlt: "Главный визуал",
        }
      : locale === "uk"
        ? {
            titleTop: "International Beauty",
            titleBottom: "Professionals Association",
            subtitle: "Де краса створює спільноту",
            description:
              "IBPA об’єднує beauty-фахівців, викладачів і бренди для розвитку галузевих стандартів, освіти та глобального зростання.",
            primaryCta: "Подати заявку",
            secondaryCta: "Партнер / Спонсор",
            ticker: [
              "Професійні стандарти",
              "Міжнародна співпраця",
              "Спільнота індустрії краси",
            ],
            heroAlt: "Головний візуал",
          }
        : {
            titleTop: "International Beauty",
            titleBottom: "Professionals Association",
            subtitle: "Where Beauty Becomes Community",
            description:
              "IBPA connects beauty professionals, educators, and brands to advance industry standards, education, and global growth",
            primaryCta: "Become a Member",
            secondaryCta: "Partner / Sponsor",
            ticker: [
              "Professional Standards",
              "International Collaboration",
              "Beauty Industry Community",
            ],
            heroAlt: "Hero Visual",
          };

  const useEnglishHomepageTypography = true;
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.055em]`
    : cyrillicDisplay.className;
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const editorialClassName = `${cyrillicEditorial.className} italic tracking-normal`;
  const heroAccentClassName = useEnglishHomepageTypography
    ? `${homeTemplateAccent.className} tracking-normal`
    : editorialClassName;

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#F1F3F5] md:min-h-[120svh]">
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="/home/main-hero-section.webp"
          alt={copy.heroAlt}
          className="h-full w-full object-cover object-top blur-[1.6px]"
          priority
          sizes="100vw"
          quality={60}
        />
        <div className="absolute inset-0 bg-white/30" />
      </div>

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center px-6 text-center">
        <div className="space-y-14 py-40 md:space-y-14 md:py-40 lg:py-44">
          <h1 className="flex flex-col items-center text-white [text-shadow:0_6px_22px_rgba(0,0,0,0.38)]">
            <span
              className={`pb-8 text-[2.75rem] leading-[0.94] uppercase sm:text-6xl md:pb-4 md:text-8xl lg:text-[6.8vw] ${headlineClassName}`}
            >
              <span className="block md:inline">{copy.titleTop}</span>{" "}
              <span className="block md:inline">{copy.titleBottom}</span>
            </span>
          </h1>

          <div className="mx-auto mt-28 max-w-3xl space-y-8 md:mt-0">
            <p
              className={`pt-2 text-[1.55rem] text-[#6E9AB8] [text-shadow:0_1px_0_rgba(0,0,0,0.20),0_6px_18px_rgba(0,0,0,0.12),0_0_26px_rgba(0,0,0,0.10)] sm:text-[2.45rem] md:pt-4 md:text-[3.35rem] ${locale === "ru" || locale === "uk" ? "md:text-[3.16rem]" : "lg:whitespace-nowrap"} ${heroAccentClassName}`}
            >
              {copy.subtitle}
            </p>

            <p
              className={`mx-auto max-w-[44rem] text-base leading-relaxed text-white/88 drop-shadow-[0_3px_16px_rgba(0,0,0,0.55)] sm:text-lg md:text-[1.28rem] ${bodyClassName}`}
            >
              {copy.description}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:justify-center sm:gap-6">
            <Link
              href="/membership"
              className={`flex min-w-0 items-center justify-center gap-3 rounded-full bg-black px-4 py-4 text-[10px] uppercase tracking-[0.06em] text-white shadow-2xl transition-all hover:scale-105 sm:px-12 sm:py-6 sm:text-sm ${uiClassName}`}
            >
              {copy.primaryCta} <ArrowRight size={18} />
            </Link>
            <Link
              href="/partnership"
              className={`flex min-w-0 items-center justify-center rounded-full border border-slate-200 px-4 py-4 text-[10px] uppercase tracking-[0.06em] text-slate-900 backdrop-blur-md transition-all hover:bg-white sm:px-12 sm:py-6 sm:text-sm ${uiClassName}`}
            >
              {copy.secondaryCta}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 z-20 w-full overflow-hidden px-6 text-[10px] font-bold uppercase tracking-[0.45em] text-white/60 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
        <div className="ibpa-marquee flex gap-8 whitespace-nowrap">
          {copy.ticker.concat(copy.ticker).map((item, index) => (
            <span key={`${item}-${index}`} className="inline-flex items-center gap-8">
              <span>{item}</span>
              <span>•</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
