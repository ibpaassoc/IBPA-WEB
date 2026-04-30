import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import type { PublicMember } from "@/lib/public-members";

type MembersSpotlightSectionProps = {
  locale: "en" | "ru" | "uk";
  items: PublicMember[];
};

export function MembersSpotlightSection({ locale, items }: MembersSpotlightSectionProps) {
  const useEnglishHomepageTypography = true;
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";

  const copy =
    locale === "ru"
      ? {
          title: "Оплаченные мемберы IBPA",
          cta: "Смотреть всех",
          empty: "Профили скоро появятся",
        }
      : locale === "uk"
        ? {
            title: "Оплачені мембери IBPA",
            cta: "Переглянути всіх",
            empty: "Профілі скоро з’являться",
          }
        : {
            title: "Paid IBPA Members",
            cta: "View all members",
            empty: "Profiles coming soon",
          };

  const mobileItems = items.slice(0, 5);
  const desktopItems = items.slice(0, 8);
  const mobileRemaining = Math.max(items.length - mobileItems.length, 0);
  const desktopRemaining = Math.max(items.length - desktopItems.length, 0);

  return (
    <section className="bg-white px-6 py-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="py-1 text-center md:py-3">
          <div className="flex min-h-[64px] items-center justify-center md:min-h-[84px]">
            <h2 className={`mx-auto max-w-3xl text-[1.5rem] uppercase leading-[0.96] text-slate-900 md:text-[1.95rem] ${headlineClassName}`}>
              {copy.title}
            </h2>
          </div>

          <div className="mt-3 flex flex-col items-center justify-center gap-5 md:mt-5">
            {desktopItems.length > 0 ? (
              <>
                <div className="flex items-center justify-center md:hidden">
                  <div className="flex items-center justify-center pl-6">
                    {mobileItems.map((member, index) => (
                      <div key={member.id} className={index === 0 ? "" : "-ml-3"}>
                        <Avatar className="size-12 border-2 border-white shadow-sm">
                          <AvatarImage src={member.avatarUrl || undefined} alt={member.fullName} />
                          <AvatarFallback className="bg-[#e8f3f9] text-[11px] font-semibold text-slate-700">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ))}
                    {mobileRemaining > 0 ? (
                      <div className="-ml-3 flex size-12 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-sm font-semibold text-slate-900 shadow-sm">
                        +{mobileRemaining}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="hidden flex-wrap items-center justify-center gap-3 md:flex md:gap-4">
                  {desktopItems.map((member) => (
                    <div key={member.id} className="flex min-h-[96px] items-center justify-center px-2 py-1">
                      <Avatar className="size-[3.15rem] border-2 border-slate-100 shadow-sm md:size-[3.85rem]">
                        <AvatarImage src={member.avatarUrl || undefined} alt={member.fullName} />
                        <AvatarFallback className="bg-[#e8f3f9] text-[11px] font-semibold text-slate-700">
                          {getInitials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                  {desktopRemaining > 0 ? (
                    <div className="flex size-[3.15rem] items-center justify-center rounded-full border-2 border-slate-100 bg-slate-900 text-[11px] font-semibold text-white shadow-sm md:size-[3.85rem]">
                      +{desktopRemaining}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">{copy.empty}</p>
            )}

            <Link
              href="/members"
              className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 ${uiClassName}`}
            >
              {copy.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
