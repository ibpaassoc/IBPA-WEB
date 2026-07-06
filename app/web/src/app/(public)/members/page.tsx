import type { Metadata } from "next";
import { cookies } from "next/headers";

import { MembersDirectory } from "@/features/members/components/MembersDirectory";
import { getAllPublicMembers } from "@/features/members/server/get-members";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { resolveLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Members Directory | IBPA",
  description:
    "Browse active members of the International Beauty Professionals Association — beauty specialists, educators, and brands from around the world.",
};

function getCopy(locale: "en" | "ru" | "uk") {
  if (locale === "ru") {
    return {
      eyebrow: "Каталог участников",
      title: "Участники IBPA",
      description:
        "Открытый каталог оплаченных участников IBPA с активным профилем. Нажмите на карточку, чтобы открыть публичный профиль специалиста.",
    };
  }

  if (locale === "uk") {
    return {
      eyebrow: "Каталог учасників",
      title: "Учасники IBPA",
      description:
        "Відкритий каталог оплачених учасників IBPA з активним профілем. Натисніть на картку, щоб відкрити публічний профіль спеціаліста.",
    };
  }

  return {
    eyebrow: "Member Directory",
    title: "IBPA Members",
    description:
      "An open directory of active IBPA members. Select any card to open that member's public preview profile.",
  };
}

export default async function MembersPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("ibpa-locale")?.value);
  const members = await getAllPublicMembers(locale);
  const copy = getCopy(locale);

  const headlineClassName = `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`;

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#72A0C1]">
            {copy.eyebrow}
          </p>
          <h1
            className={`mt-4 text-[2.75rem] uppercase leading-[0.95] text-[#10203B] md:text-[4.5rem] ${headlineClassName}`}
          >
            {copy.title}
          </h1>
        </header>

        <div className="mt-12">
          <MembersDirectory members={members} locale={locale} />
        </div>
      </div>
    </main>
  );
}
