"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe, Instagram, MapPin, Sparkles } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getPublicProfileHref } from "@/lib/member-identity";
import { cn } from "@/lib/utils";
import type { PublicMember } from "@/lib/public-members";

type Locale = "en" | "ru" | "uk";

type MembersDirectoryProps = {
  items: PublicMember[];
  locale: Locale;
  mode?: "teaser" | "full";
  surface?: "public" | "dashboard";
  showIntro?: boolean;
};

function getMembershipLabels(locale: Locale): Record<string, string> {
  if (locale === "ru") {
    return {
      Specialist: "Старт",
      Student: "Старт",
      Professional: "Элита",
      Trainer: "Мастер",
      Business: "Премиум",
      Brand: "Партнёр",
      Entry: "Старт",
      Elite: "Элита",
      Master: "Мастер",
      Premium: "Премиум",
      Partner: "Партнёр",
    };
  }

  if (locale === "uk") {
    return {
      Specialist: "Старт",
      Student: "Старт",
      Professional: "Еліта",
      Trainer: "Майстер",
      Business: "Преміум",
      Brand: "Партнер",
      Entry: "Старт",
      Elite: "Еліта",
      Master: "Майстер",
      Premium: "Преміум",
      Partner: "Партнер",
    };
  }

  return {
    Specialist: "ENTRY",
    Student: "ENTRY",
    Professional: "Elite",
    Trainer: "Master",
    Business: "Premium",
    Brand: "Partner",
    Entry: "Entry",
    Elite: "Elite",
    Master: "Master",
    Premium: "Premium",
    Partner: "Partner",
  };
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

function normalizeUrl(value?: string | null) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function MembersDirectory({
  items,
  locale,
  mode = "full",
  surface = "public",
  showIntro = true,
}: MembersDirectoryProps) {
  const membershipLabels = getMembershipLabels(locale);
  const copy =
    locale === "ru"
      ? {
          eyebrow: "Члены ассоциации",
          title: mode === "teaser" ? "Знакомьтесь с членами IBPA" : "Каталог членов IBPA",
          description:
            mode === "teaser"
              ? "Оплаченные участники с активным кабинетом появляются в публичном каталоге, чтобы клиенты, партнёры и коллеги могли найти подходящего специалиста."
              : "Открытый каталог оплаченных участников IBPA с краткой профессиональной информацией, примерами работ и ссылками для связи.",
          empty: "Каталог скоро наполнится новыми профилями.",
          allMembers: "Смотреть всех",
          openProfile: "Открыть профиль",
          viewExamples: "Примеры работ",
          location: "Город",
          experience: "Опыт",
          since: "В ассоциации с",
          filtersTitle: "Найти специалиста",
          searchPlaceholder: "Имя, специализация, город",
          allCategories: "Все категории",
          noResults: "По текущим фильтрам ничего не найдено.",
          contact: "Связаться",
          about: "О мастере",
          highlights: "Фокус работы",
          closeHint: "Нажмите вне окна, чтобы закрыть.",
        }
      : locale === "uk"
        ? {
            eyebrow: "Члени асоціації",
            title: mode === "teaser" ? "Познайомтеся з членами IBPA" : "Каталог членів IBPA",
            description:
              mode === "teaser"
                ? "Оплачені учасники з активним кабінетом автоматично з’являються в каталозі, щоб клієнти, партнери та колеги могли знайти потрібного спеціаліста."
                : "Відкритий каталог оплачених членів IBPA з короткою професійною інформацією, прикладами робіт і посиланнями для зв’язку.",
            empty: "Каталог скоро наповниться новими профілями.",
            allMembers: "Переглянути всіх",
            openProfile: "Відкрити профіль",
            viewExamples: "Приклади робіт",
            location: "Місто",
            experience: "Досвід",
            since: "В асоціації з",
            filtersTitle: "Знайти спеціаліста",
            searchPlaceholder: "Ім'я, спеціалізація, місто",
            allCategories: "Усі категорії",
            noResults: "За поточними фільтрами нічого не знайдено.",
            contact: "Зв’язатися",
            about: "Про майстра",
            highlights: "Напрям роботи",
            closeHint: "Натисніть поза вікном, щоб закрити.",
          }
        : {
            eyebrow: "Member Directory",
            title: mode === "teaser" ? "Meet IBPA Members" : surface === "dashboard" ? "Community" : "IBPA Member Directory",
            description:
              mode === "teaser"
                ? "Paid members with active accounts appear in the public directory so clients, partners, and peers can discover the right beauty professional."
                : surface === "dashboard"
                  ? "Connect with active IBPA members, explore specializations, and discover peers across the professional beauty community."
                : "An open directory of paid IBPA members with core profile details, portfolio samples, and direct contact links.",
            empty: "New member profiles will appear here soon.",
            allMembers: "View all members",
            openProfile: "Open profile",
            viewExamples: "Portfolio samples",
            location: "Location",
            experience: "Experience",
            since: "Member since",
            filtersTitle: "Find a specialist",
            searchPlaceholder: "Name, specialty, city",
            allCategories: "All categories",
            noResults: "No members match the current filters.",
            contact: "Get in touch",
            about: "About",
            highlights: "Focus",
            closeHint: "Click outside the window to close.",
          };

  const teaserItems = items.slice(0, 20);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");
  const [specialization, setSpecialization] = useState("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(items.map((item) => item.membershipCategory).filter(Boolean)))],
    [items],
  );

  const countries = useMemo(
    () => ["all", ...Array.from(new Set(items.map((item) => item.country).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [items],
  );

  const specializations = useMemo(
    () =>
      [
        "all",
        ...Array.from(
          new Set(
            items
              .flatMap((item) => item.specializations || [])
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b)),
      ],
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory = category === "all" || item.membershipCategory === category;
      const matchesCountry = country === "all" || item.country === country;
      const matchesSpecialization =
        specialization === "all" ||
        (item.specializations || []).some((value) => value.toLowerCase() === specialization.toLowerCase()) ||
        item.title.toLowerCase().includes(specialization.toLowerCase());
      const haystack = [item.fullName, item.title, item.specializations?.join(" "), item.location, item.description, item.highlights.join(" ")]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesCategory && matchesCountry && matchesSpecialization && matchesQuery;
    });
  }, [category, country, items, search, specialization]);

  const list = mode === "teaser" ? teaserItems : filteredItems;

  if (mode === "teaser") {
    return (
      <section className="bg-white py-20 text-slate-900 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#72A0C1]">{copy.eyebrow}</p>
            <h2 className="mt-5 text-[2.6rem] uppercase leading-[0.95] text-slate-900 md:text-[4rem]">
              {copy.title}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">{copy.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard/community"
                className="inline-flex items-center gap-2 rounded-md bg-black px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-slate-800"
              >
                {copy.allMembers} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-[34rem] items-center justify-center">
            <div className="absolute inset-[12%] rounded-full border border-[#72A0C1]/20" />
            <div className="absolute inset-[24%] rounded-full border border-[#72A0C1]/12" />
            <div className="absolute inset-[36%] rounded-full border border-[#72A0C1]/10" />

            {list.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                {copy.empty}
              </div>
            ) : (
              <>
                {list.map((member, index) => {
                  const angle = (360 / list.length) * index;
                  const sizeClass =
                    index % 3 === 0 ? "h-20 w-20 md:h-24 md:w-24" : index % 3 === 1 ? "h-16 w-16 md:h-20 md:w-20" : "h-14 w-14 md:h-16 md:w-16";

                  return (
                    <div
                      key={member.id}
                      className="absolute left-1/2 top-1/2 origin-center animate-[spin_36s_linear_infinite]"
                      style={{ transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
                    >
                      <div
                        className="flex translate-y-[-12.5rem] translate-x-0 animate-[spin_36s_linear_infinite_reverse] items-center justify-center md:translate-y-[-15rem]"
                      >
                        <MemberAvatar member={member} className={sizeClass} />
                      </div>
                    </div>
                  );
                })}

                <div className="relative z-10 max-w-[15rem] rounded-lg border border-slate-200 bg-white/92 px-5 py-5 text-center shadow-xl backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#72A0C1]">{copy.eyebrow}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{items.length}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{copy.allMembers}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  const isDashboardSurface = surface === "dashboard";

  return (
    <section
      className={cn(
        "text-slate-900",
        isDashboardSurface ? "bg-transparent py-0" : "bg-[#F8FAFC] py-16 md:py-20",
      )}
    >
      <div
        className={cn(
          "mx-auto",
          isDashboardSurface ? "max-w-none px-0" : "max-w-7xl px-6",
        )}
      >
        {showIntro ? (
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#72A0C1]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 text-[2.7rem] uppercase leading-[0.95] text-slate-900 md:text-[4.2rem]">
              {copy.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">
              {copy.description}
            </p>
          </div>
        ) : null}

        <div
          className={cn(
            "grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-2 xl:grid-cols-4 md:p-5",
            showIntro ? "mt-10" : "",
          )}
        >
          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{copy.filtersTitle}</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#72A0C1]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{copy.allCategories}</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#72A0C1]"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? copy.allCategories : membershipLabels[item] || item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Country</span>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#72A0C1]"
            >
              {countries.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All countries" : item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Specialization</span>
            <select
              value={specialization}
              onChange={(event) => setSpecialization(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#72A0C1]"
            >
              {specializations.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All specializations" : item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {list.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
            {items.length === 0 ? copy.empty : copy.noResults}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((member) => (
              <MemberCard key={member.id} member={member} copy={copy} membershipLabels={membershipLabels} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MemberAvatar({ member, className }: { member: PublicMember; className?: string }) {
  return member.avatarUrl ? (
    <div className={cn("overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg", className)}>
      <ImageWithFallback src={member.avatarUrl} alt={member.fullName} className="h-full w-full object-cover" />
    </div>
  ) : (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-4 border-white bg-[linear-gradient(135deg,#72A0C1,#C9E4F2)] text-sm font-semibold text-slate-900 shadow-lg",
        className,
      )}
    >
      {getInitials(member.fullName)}
    </div>
  );
}

function MemberCard({
  member,
  copy,
  membershipLabels,
}: {
  member: PublicMember;
  copy: Record<string, string>;
  membershipLabels: Record<string, string>;
}) {
  const instagramUrl = normalizeUrl(member.instagramUrl);
  const websiteUrl = normalizeUrl(member.websiteUrl);
  const publicProfileHref = getPublicProfileHref(member.id);
  const memberSince = new Date(member.memberSince).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const specializations =
    member.specializations && member.specializations.length > 0
      ? member.specializations
      : member.title
        ? member.title.split(",").map((item) => item.trim()).filter(Boolean)
        : [];
  const specializationText = specializations.join(", ") || member.title;

  return (
    <Dialog>
      <div className="group flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
        <div className="flex items-start gap-4">
          <MemberAvatar member={member} className="h-[72px] w-[72px]" />

          <div className="min-w-0 flex-1">
            {member.membershipCategory ? (
              <span className="inline-flex rounded-full border border-[#72A0C1]/20 bg-[#F4FAFF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4C7D9D]">
                {membershipLabels[member.membershipCategory] || member.membershipCategory}
              </span>
            ) : null}

            <p className="mt-3 text-lg font-semibold leading-tight text-slate-900">
              {member.fullName}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {specializationText}
            </p>

            {member.location ? (
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4 text-[#72A0C1]" />
                {member.location}
              </p>
            ) : null}
          </div>
        </div>

        {specializations.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {specializations.slice(0, 3).map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-4">
          {(instagramUrl || websiteUrl) && (
            <div className="mb-3 flex items-center gap-2 text-slate-500">
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white transition hover:border-[#72A0C1]/40 hover:text-[#4C7D9D]"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              ) : null}
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white transition hover:border-[#72A0C1]/40 hover:text-[#4C7D9D]"
                >
                  <Globe className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          )}

          <DialogTrigger asChild>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]">
              {copy.openProfile}
              <ArrowRight className="h-4 w-4" />
            </button>
          </DialogTrigger>
        </div>
      </div>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-0 bg-transparent p-0 shadow-none">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950 text-white shadow-2xl">
          <div className="relative overflow-hidden px-5 pb-6 pt-14 md:px-8 md:pb-8 md:pt-16">
            <div className="absolute -left-10 top-0 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -right-8 top-8 h-24 w-24 rounded-full bg-[#72A0C1]/35 blur-3xl" />

            <div className="relative z-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
                  <MemberAvatar member={member} className="h-28 w-28 md:h-32 md:w-32" />

                  <div className="min-w-0">
                    {member.membershipCategory ? (
                      <p className="mb-3 inline-flex rounded-full border border-[#72A0C1]/30 bg-[#72A0C1]/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#B9D9EB]">
                        {membershipLabels[member.membershipCategory] || member.membershipCategory}
                      </p>
                    ) : null}
                    <DialogTitle className="text-3xl leading-none text-white md:text-5xl">
                      {member.fullName}
                    </DialogTitle>
                    <DialogDescription className="mt-3 max-w-2xl text-sm text-white/65 md:text-base">
                      {specializationText}
                    </DialogDescription>
                    {member.location ? (
                      <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/65">
                        <MapPin className="h-4 w-4 text-[#72A0C1]" />
                        {member.location}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 md:grid-cols-4">
                {member.experience ? (
                  <div>
                    <p className="text-lg font-semibold text-white md:text-2xl">{member.experience}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">{copy.experience}</p>
                  </div>
                ) : null}
                {member.location ? (
                  <div>
                    <p className="text-lg font-semibold text-white md:text-2xl">{member.city || member.location}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">{copy.location}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-lg font-semibold text-white md:text-2xl">{memberSince}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">{copy.since}</p>
                </div>
                {member.highlights[0] ? (
                  <div>
                    <p className="text-lg font-semibold text-white md:text-2xl">{member.highlights[0]}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">{copy.highlights}</p>
                  </div>
                ) : null}
              </div>

              {(member.description || instagramUrl || websiteUrl || member.highlights.length > 0) && (
                <div className="mt-5 grid gap-5 border-t border-white/10 pt-5 md:grid-cols-2">
                  {member.description ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">{copy.about}</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/80">{member.description}</p>
                    </div>
                  ) : null}

                  <div>
                    {(instagramUrl || websiteUrl) && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">{copy.contact}</p>
                        <div className="mt-2 flex flex-col gap-2">
                          {instagramUrl ? (
                            <a href={instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-[#8DD4F7] hover:underline">
                              <Instagram className="h-4 w-4" />
                              Instagram
                            </a>
                          ) : null}
                          {websiteUrl ? (
                            <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-[#8DD4F7] hover:underline">
                              <Globe className="h-4 w-4" />
                              Website
                            </a>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {member.highlights.length > 1 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {member.highlights.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-[#72A0C1]" />
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          {member.portfolioImages.length > 0 ? (
            <div className="border-t border-white/10 bg-slate-900/80 px-5 py-5 md:px-8 md:py-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">{copy.viewExamples}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {member.portfolioImages.slice(0, 6).map((image, index) => (
                  <div key={`${member.id}-${index}`} className="overflow-hidden rounded-lg bg-white/5">
                    <ImageWithFallback src={image} alt={`${member.fullName} portfolio sample ${index + 1}`} className="aspect-square w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-white/10 px-5 py-4 md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-white/35">{copy.closeHint}</p>
              {publicProfileHref ? (
                <Link
                  href={publicProfileHref}
                  className="inline-flex items-center gap-2 text-sm text-[#8DD4F7] transition hover:text-white"
                >
                  Public profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
