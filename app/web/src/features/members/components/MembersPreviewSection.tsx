import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { getFeaturedMembers } from "../server/get-members";
import type { MembersLocale } from "../types";
import { MemberCard } from "./MemberCard";

type MembersPreviewSectionProps = {
  locale: MembersLocale;
};

const FEATURED_LIMIT = 8;

function getCopy(locale: MembersLocale) {
  if (locale === "ru") {
    return {
      eyebrow: "Сообщество IBPA",
      title: "Знакомьтесь с членами",
      description:
        "Оплаченные участники IBPA с активным профилем — специалисты, преподаватели и бренды beauty-индустрии со всего мира.",
      cta: "Смотреть всех участников",
    };
  }

  if (locale === "uk") {
    return {
      eyebrow: "Спільнота IBPA",
      title: "Познайомтеся з членами",
      description:
        "Оплачені учасники IBPA з активним профілем — спеціалісти, викладачі та бренди beauty-індустрії з усього світу.",
      cta: "Переглянути всіх учасників",
    };
  }

  return {
    eyebrow: "IBPA Community",
    title: "Meet Our Members",
    description:
      "Paid IBPA members with active profiles — beauty specialists, educators, and brands from across the global professional community.",
    cta: "See more members",
  };
}

export async function MembersPreviewSection({ locale }: MembersPreviewSectionProps) {
  const members = await getFeaturedMembers(locale, FEATURED_LIMIT);

  // Match the homepage behaviour of other data-driven sections: render nothing
  // rather than an empty shell when there is no content yet.
  if (members.length === 0) {
    return null;
  }

  const copy = getCopy(locale);
  const headlineClassName = `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";

  return (
    <section className="relative overflow-hidden bg-[#F4F7FB] py-20 md:py-32">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#72A0C1]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#B9D9EB]/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl space-y-5">
            <p className={`text-sm uppercase tracking-[0.4em] text-[#72A0C1] ${uiClassName}`}>
              {copy.eyebrow}
            </p>
            <h2
              className={`text-[2.5rem] uppercase leading-[0.95] text-[#10203B] md:text-[4.25rem] ${headlineClassName}`}
            >
              {copy.title}
            </h2>
            <p className={`text-[1.05rem] leading-relaxed text-slate-600 md:text-[1.25rem] ${bodyClassName}`}>
              {copy.description}
            </p>
          </div>

          <Link
            href="/members"
            className={`group hidden shrink-0 items-center gap-3 rounded-full bg-[#071933] px-7 py-4 text-sm uppercase tracking-[0.14em] text-white shadow-lg shadow-[#071933]/15 transition hover:-translate-y-0.5 hover:bg-[#10284E] lg:inline-flex ${uiClassName}`}
          >
            {copy.cta}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {members.map((member, index) => (
            <MemberCard
              key={member.id}
              member={member}
              locale={locale}
              priority={index < 4}
            />
          ))}
        </div>

        <div className="mt-12 flex justify-center lg:hidden">
          <Link
            href="/members"
            className={`group inline-flex items-center gap-3 rounded-full bg-[#071933] px-7 py-4 text-sm uppercase tracking-[0.14em] text-white shadow-lg shadow-[#071933]/15 transition hover:-translate-y-0.5 hover:bg-[#10284E] ${uiClassName}`}
          >
            {copy.cta}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
