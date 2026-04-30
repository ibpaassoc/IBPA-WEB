import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";

type GovernancePreviewSectionProps = {
  locale: "en" | "ru" | "uk";
};

type MemberCard = {
  id: string;
  name: string;
  role: string;
  summary: string;
  image: string;
};

export const GovernancePreviewSection = ({ locale }: GovernancePreviewSectionProps) => {
  const useEnglishHomepageTypography = true;
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";

  const content =
    locale === "ru"
      ? {
          title: "Кто стоит за проектом IBPA",
          description:
            "Прозрачное управление и сильная профессиональная команда — основа развития IBPA. Познакомьтесь с людьми, которые формируют стратегию ассоциации и отвечают за ее международный рост.",
          cta: "Подробнее о governance",
          members: [
            {
              id: "yulia-andreeva",
                name: "Iuliia Andreeva",
                role: "Президент",
                summary: "Формирует стратегическое направление ассоциации, международные партнерства и ключевые инициативы сообщества.",
                image: "/board/board-of-directors-iulia.webp",
              },
            {
              id: "sergei-andreev",
                name: "Sergei Andreev",
                role: "Вице-президент",
                summary: "Отвечает за голос ассоциации, её позиционирование, медиаприсутствие и развитие наиболее заметных инициатив.",
                image: "/board/board-of-directors-sergei.webp",
              },
            {
              id: "valeriia-kizchuk",
                name: "Valeriia Kizchuk",
                role: "Секретарь",
                summary: "Поддерживает внутреннюю структуру ассоциации, документацию, коммуникацию и стабильность операционных процессов.",
                image: "/board/board-of-directors-valeriia.webp",
              },
          ] satisfies MemberCard[],
        }
      : locale === "uk"
        ? {
            title: "Хто стоїть за проєктом IBPA",
            description:
              "Прозоре управління та сильна професійна команда — основа розвитку IBPA. Познайомтеся з людьми, які формують стратегію асоціації та відповідають за її міжнародне зростання.",
            cta: "Детальніше про governance",
            members: [
              {
                id: "yulia-andreeva",
                name: "Iuliia Andreeva",
                role: "Президент",
                summary: "Формує стратегічний напрям асоціації, міжнародні партнерства та ключові ініціативи спільноти.",
                image: "/board/board-of-directors-iulia.webp",
              },
              {
                id: "sergei-andreev",
                name: "Sergei Andreev",
                role: "Віце-президент",
                summary: "Відповідає за голос асоціації, її позиціонування, медіаприсутність і розвиток найпомітніших ініціатив.",
                image: "/board/board-of-directors-sergei.webp",
              },
              {
                id: "valeriia-kizchuk",
                name: "Valeriia Kizchuk",
                role: "Секретар",
                summary: "Підтримує внутрішню структуру асоціації, документацію, комунікацію та стабільність операційних процесів.",
                image: "/board/board-of-directors-valeriia.webp",
              },
            ] satisfies MemberCard[],
          }
        : {
            title: "People Behind The IBPA Project",
            description:
              "Transparent governance and a strong professional team are the foundation of IBPA growth. Meet the people shaping the association strategy and leading its international expansion.",
            cta: "Explore governance",
            members: [
              {
                id: "yulia-andreeva",
                name: "Iuliia Andreeva",
                role: "President",
                summary: "Leads the association’s strategic direction, international partnerships, and the core initiatives of the community.",
                image: "/board/board-of-directors-iulia.webp",
              },
              {
                id: "sergei-andreev",
                name: "Sergei Andreev",
                role: "Vice President",
                summary: "Shapes the association’s voice, positioning, media presence, and the development of its most visible initiatives.",
                image: "/board/board-of-directors-sergei.webp",
              },
              {
                id: "valeriia-kizchuk",
                name: "Valeriia Kizchuk",
                role: "Secretary",
                summary: "Supports the association’s internal structure, documentation, communication, and operational consistency.",
                image: "/board/board-of-directors-valeriia.webp",
              },
            ] satisfies MemberCard[],
          };

  return (
    <section className="bg-white px-6 py-16 md:min-h-[100svh] md:py-0 md:flex md:items-center">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="space-y-8">
            <h2 className={`max-w-4xl text-[2.75rem] uppercase leading-[0.94] text-slate-900 md:text-[4.85rem] ${headlineClassName}`}>
              {content.title}
            </h2>

            <div className="space-y-8">
              <p className={`max-w-xl text-[1.1rem] leading-relaxed text-slate-700 md:text-[1.32rem] ${bodyClassName}`}>
                {content.description}
              </p>

              <div className="pt-2">
                <Link
                  href="/governance"
                  className={`group inline-flex items-center gap-3 border-b border-slate-900 pb-2 text-sm uppercase tracking-[0.14em] transition-colors hover:border-[#72A0C1] hover:text-[#72A0C1] ${uiClassName}`}
                >
                  {content.cta}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {content.members.map((member) => (
              <article
                key={member.id}
                className="grid grid-cols-[88px_minmax(0,1fr)] items-stretch gap-3 rounded-[16px] border border-slate-200 bg-white p-2.5 md:grid-cols-[104px_minmax(0,1fr)] md:gap-4 md:p-3"
              >
                <div className="relative overflow-hidden rounded-[12px] bg-slate-100">
                  <ImageWithFallback
                    src={member.image}
                    alt={member.name}
                    className="h-full min-h-[88px] w-full object-cover object-top md:min-h-[104px]"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>

                <div className="flex min-w-0 flex-col justify-center gap-1.5 py-1">
                  <h3 className={`text-[1rem] uppercase leading-[0.95] text-slate-900 md:text-[1.2rem] ${headlineClassName}`}>
                    {member.name}
                  </h3>
                  <p className={`text-[9px] uppercase tracking-[0.22em] text-[#708090] ${uiClassName}`}>{member.role}</p>
                  <p className={`text-[0.84rem] leading-relaxed text-slate-600 md:text-[0.88rem] ${bodyClassName}`}>
                    {member.summary}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
