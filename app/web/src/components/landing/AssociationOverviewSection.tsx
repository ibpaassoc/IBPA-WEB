import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";

type AssociationOverviewSectionProps = {
  locale: "en" | "ru" | "uk";
};

/**
 * Plain-language statement of what IBPA is, rendered on the server so the
 * homepage tells crawlers and first-time visitors the same thing: an
 * international professional beauty association, who it serves, and where to
 * read more. Every claim mirrors copy already published on /about, /criteria,
 * and /membership.
 */
export const AssociationOverviewSection = ({ locale }: AssociationOverviewSectionProps) => {
  const copy =
    locale === "ru"
      ? {
          eyebrow: "Об ассоциации",
          title: "Международная ассоциация профессионалов индустрии красоты",
          intro:
            "IBPA — некоммерческая профессиональная ассоциация индустрии красоты, зарегистрированная в Калифорнии и открытая для участников по всему миру. Мы объединяем косметологов, эстетистов, мастеров по ресницам и бровям, визажистов, специалистов по ногтевому сервису и парикмахеров, а также преподавателей, владельцев салонов и beauty-бренды вокруг общих профессиональных стандартов, образования и признания.",
          review:
            "Каждая заявка рассматривается Комитетом по членству до оплаты, поэтому членство отражает единый профессиональный стандарт.",
          primaryCta: "Как работает профессиональная beauty-ассоциация",
          links: [
            { href: "/membership", label: "Членство в ассоциации" },
            { href: "/criteria", label: "Критерии отбора" },
            { href: "/standards", label: "Профессиональные стандарты" },
            { href: "/governance", label: "Управление и совет" },
          ],
        }
      : locale === "uk"
        ? {
            eyebrow: "Про асоціацію",
            title: "Міжнародна асоціація професіоналів індустрії краси",
            intro:
              "IBPA — неприбуткова професійна асоціація індустрії краси, зареєстрована в Каліфорнії та відкрита для учасників з усього світу. Ми об’єднуємо косметологів, естетистів, майстрів з вій і брів, візажистів, фахівців з нігтьового сервісу та перукарів, а також викладачів, власників салонів і beauty-бренди навколо спільних професійних стандартів, освіти та визнання.",
            review:
              "Кожна заявка розглядається Комітетом з членства до оплати, тому членство відображає єдиний професійний стандарт.",
            primaryCta: "Як працює професійна beauty-асоціація",
            links: [
              { href: "/membership", label: "Членство в асоціації" },
              { href: "/criteria", label: "Критерії відбору" },
              { href: "/standards", label: "Професійні стандарти" },
              { href: "/governance", label: "Управління та рада" },
            ],
          }
        : {
            eyebrow: "About the Association",
            title: "An International Beauty Association for Professionals",
            intro:
              "IBPA is a nonprofit professional beauty association registered in California and open to members worldwide. We bring together estheticians, cosmetologists, lash and brow artists, makeup artists, nail and hair professionals, educators, salon owners, and beauty brands around shared professional standards, education, and recognition.",
            review:
              "Every application is reviewed by the Membership Review Board before payment, so membership reflects a consistent professional standard.",
            primaryCta: "How a Professional Beauty Association Works",
            links: [
              { href: "/membership", label: "Beauty Association Membership" },
              { href: "/criteria", label: "Selection Criteria" },
              { href: "/standards", label: "Professional Standards" },
              { href: "/governance", label: "Board & Governance" },
            ],
          };

  const headlineClassName = `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  // Cyrillic copy keeps the display face's Cyrillic companion, as the other sections do.
  const titleClassName = locale === "en" ? headlineClassName : `${cyrillicDisplay.className} font-black tracking-normal`;

  return (
    <section aria-labelledby="association-overview-title" className="bg-white px-6 py-20 md:py-32">
      <div className="mx-auto max-w-5xl space-y-10 text-left md:space-y-12">
        <p className={`text-[10px] uppercase tracking-[0.5em] text-[#708090] md:text-xs ${uiClassName}`}>
          {copy.eyebrow}
        </p>
        <h2
          id="association-overview-title"
          className={`text-[2.4rem] uppercase leading-[0.96] md:text-[3.6rem] ${titleClassName}`}
        >
          {copy.title}
        </h2>
        <div className="max-w-3xl space-y-6">
          <p className={`text-[1.05rem] leading-relaxed text-gray-700 md:text-[1.2rem] ${bodyClassName}`}>
            {copy.intro}
          </p>
          <p className={`text-[1.05rem] leading-relaxed text-gray-700 md:text-[1.2rem] ${bodyClassName}`}>
            {copy.review}
          </p>
        </div>
        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/beauty-association"
            className={`inline-flex items-center justify-center gap-3 rounded-full bg-black px-8 py-4 text-xs uppercase tracking-[0.1em] text-white shadow-2xl transition-transform duration-500 hover:scale-[1.03] ${uiClassName}`}
          >
            {copy.primaryCta} <ArrowRight size={16} />
          </Link>
          <ul className="flex flex-wrap gap-x-6 gap-y-3 sm:ml-2">
            {copy.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm text-slate-700 underline decoration-[#72A0C1] decoration-2 underline-offset-4 transition-colors hover:text-[#72A0C1] ${uiClassName}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
