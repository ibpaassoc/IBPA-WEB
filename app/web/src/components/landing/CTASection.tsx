import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";

type CTASectionProps = {
  locale: "en" | "ru" | "uk";
};

export const CTASection = ({ locale }: CTASectionProps) => {
  const copy =
    locale === "ru"
      ? {
          eyebrow: "Формируйте будущее",
          title: "Станьте частью глобального профессионального beauty-сообщества",
          description:
            "Присоединяйтесь к профессиональной ассоциации, которая развивает отраслевые стандарты, образование и сотрудничество между beauty-специалистами по всему миру.",
          primaryCta: "Подать заявку",
          secondaryCta: "Смотреть варианты членства",
          studioAlt: "Финальная сцена IBPA",
        }
      : locale === "uk"
        ? {
            eyebrow: "Формуйте майбутнє",
            title: "Станьте частиною глобальної професійної beauty-спільноти",
            description:
              "Приєднуйтесь до професійної асоціації, яка розвиває галузеві стандарти, освіту та співпрацю між beauty-фахівцями по всьому світу.",
            primaryCta: "Подати заявку",
            secondaryCta: "Переглянути варіанти членства",
            studioAlt: "Фінальна сцена IBPA",
          }
        : {
            eyebrow: "Shape the Future",
            title: "Become Part of a Global Professional Beauty Community",
            description:
              "Join a professional association that supports industry standards, education, and collaboration among beauty professionals worldwide.",
            primaryCta: "Apply for Membership",
            secondaryCta: "View Membership Options",
            studioAlt: "IBPA final visual",
          };

  const useEnglishHomepageTypography = true;
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";

  return (
    <section className="relative min-h-[680px] overflow-hidden bg-[#F1F3F5] md:h-[80vh]">
      <div className="absolute inset-0 overflow-hidden">
        <ImageWithFallback
          src="/home/website-3.webp"
          className="absolute inset-0 h-full w-full object-cover object-center blur-[1.6px] md:hidden"
          alt={copy.studioAlt}
        />
        <ImageWithFallback
          src="/home/website-3.webp"
          className="absolute inset-0 hidden h-full w-full object-cover object-[center_28%] blur-[1.6px] md:block"
          alt={copy.studioAlt}
        />
        <div className="absolute inset-0 bg-white/30" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="relative z-10 max-w-5xl space-y-10 p-12 text-center md:p-24 lg:p-32">
          <p className={`text-[10px] uppercase tracking-[0.5em] text-[#708090] [text-shadow:0_1px_0_rgba(0,0,0,0.12)] md:text-xs ${uiClassName}`}>{copy.eyebrow}</p>
          <h2 className={`text-[2.75rem] uppercase leading-[0.94] text-slate-900 [text-shadow:0_2px_0_rgba(0,0,0,0.12),0_14px_28px_rgba(0,0,0,0.14)] md:text-[4.2rem] ${headlineClassName}`}>
            {copy.title}
          </h2>
          <p className={`mx-auto max-w-3xl text-[1.1rem] leading-relaxed text-white [text-shadow:0_1px_0_rgba(0,0,0,0.16),0_8px_18px_rgba(0,0,0,0.12)] md:text-[1.32rem] ${bodyClassName}`}>
            {copy.description}
          </p>
          <div className="flex flex-col justify-center gap-6 pt-6 sm:flex-row">
            <Link
              href="/membership"
              className={`flex items-center justify-center gap-3 rounded-full bg-black px-10 py-5 text-xs uppercase tracking-[0.14em] text-white shadow-2xl transition-transform duration-500 hover:scale-[1.05] ${uiClassName}`}
            >
              {copy.primaryCta} <ArrowRight size={16} />
            </Link>
            <Link
              href="/membership"
              className={`flex items-center justify-center rounded-full bg-white/72 px-10 py-5 text-xs uppercase tracking-[0.14em] text-slate-900 transition-colors duration-300 hover:bg-white ${uiClassName}`}
            >
              {copy.secondaryCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
