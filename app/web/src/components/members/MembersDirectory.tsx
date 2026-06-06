"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Globe,
  Instagram,
  MapPin,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    Specialist: "Entry",
    Student: "Entry",
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

function formatCount(value: number, locale: Locale) {
  const code = locale === "uk" ? "uk-UA" : locale === "ru" ? "ru-RU" : "en-US";
  return new Intl.NumberFormat(code).format(value);
}

function getSelectLabel(value: string, fallback: string) {
  return value === "all" ? fallback : value;
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
          title:
            mode === "teaser"
              ? "Знакомьтесь с членами IBPA"
              : "Каталог членов IBPA",
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
          allCountries: "Все страны",
          allSpecializations: "Все специализации",
          country: "Страна",
          specialization: "Специализация",
          noResults: "По текущим фильтрам ничего не найдено.",
          contact: "Связаться",
          about: "О мастере",
          highlights: "Фокус работы",
          closeHint: "Нажмите вне окна, чтобы закрыть.",
          profiles: "профилей",
          clear: "Сбросить",
          publicProfile: "Публичный профиль",
        }
      : locale === "uk"
        ? {
            eyebrow: "Члени асоціації",
            title:
              mode === "teaser"
                ? "Познайомтеся з членами IBPA"
                : "Каталог членів IBPA",
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
            allCountries: "Усі країни",
            allSpecializations: "Усі спеціалізації",
            country: "Країна",
            specialization: "Спеціалізація",
            noResults: "За поточними фільтрами нічого не знайдено.",
            contact: "Зв’язатися",
            about: "Про майстра",
            highlights: "Напрям роботи",
            closeHint: "Натисніть поза вікном, щоб закрити.",
            profiles: "профілів",
            clear: "Скинути",
            publicProfile: "Публічний профіль",
          }
        : {
            eyebrow: "Member Directory",
            title:
              mode === "teaser"
                ? "Meet IBPA Members"
                : surface === "dashboard"
                  ? "Member Directory"
                  : "IBPA Member Directory",
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
            allCountries: "All countries",
            allSpecializations: "All specializations",
            country: "Country",
            specialization: "Specialization",
            noResults: "No members match the current filters.",
            contact: "Get in touch",
            about: "About",
            highlights: "Focus",
            closeHint: "Click outside the window to close.",
            profiles: "profiles",
            clear: "Clear",
            publicProfile: "Public profile",
          };

  const teaserItems = items.slice(0, 20);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");
  const [specialization, setSpecialization] = useState("all");

  const categories = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(items.map((item) => item.membershipCategory).filter(Boolean)),
      ),
    ],
    [items],
  );

  const countries = useMemo(
    () => [
      "all",
      ...Array.from(new Set(items.map((item) => item.country).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    ],
    [items],
  );

  const specializations = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          items.flatMap((item) => item.specializations || []).filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory =
        category === "all" || item.membershipCategory === category;
      const matchesCountry = country === "all" || item.country === country;
      const matchesSpecialization =
        specialization === "all" ||
        (item.specializations || []).some(
          (value) => value.toLowerCase() === specialization.toLowerCase(),
        ) ||
        item.title.toLowerCase().includes(specialization.toLowerCase());

      const haystack = [
        item.fullName,
        item.title,
        item.specializations?.join(" "),
        item.location,
        item.description,
        item.highlights.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query);

      return (
        matchesCategory &&
        matchesCountry &&
        matchesSpecialization &&
        matchesQuery
      );
    });
  }, [category, country, items, search, specialization]);

  const list = mode === "teaser" ? teaserItems : filteredItems;
  const isDashboardSurface = surface === "dashboard";

  if (mode === "teaser") {
    return (
      <section className="bg-white py-20 text-slate-950 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#5C91B7]">
              {copy.eyebrow}
            </p>
            <h2 className="mt-5 text-[2.6rem] font-semibold uppercase leading-[0.95] text-slate-950 md:text-[4rem]">
              {copy.title}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">
              {copy.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard/community"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#071933] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-[#10284E]"
              >
                {copy.allMembers} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-[34rem] items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-50 to-[#EEF7FC]">
            <div className="absolute inset-[12%] rounded-full border border-[#72A0C1]/20" />
            <div className="absolute inset-[24%] rounded-full border border-[#72A0C1]/12" />
            <div className="absolute inset-[36%] rounded-full border border-[#72A0C1]/10" />

            {list.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                {copy.empty}
              </div>
            ) : (
              <>
                {list.map((member, index) => {
                  const angle = (360 / list.length) * index;
                  const sizeClass =
                    index % 3 === 0
                      ? "h-20 w-20 md:h-24 md:w-24"
                      : index % 3 === 1
                        ? "h-16 w-16 md:h-20 md:w-20"
                        : "h-14 w-14 md:h-16 md:w-16";

                  return (
                    <div
                      key={member.id}
                      className="absolute left-1/2 top-1/2 origin-center animate-[spin_36s_linear_infinite]"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                      }}
                    >
                      <div className="flex translate-y-[-12.5rem] translate-x-0 animate-[spin_36s_linear_infinite_reverse] items-center justify-center md:translate-y-[-15rem]">
                        <MemberAvatar member={member} className={sizeClass} />
                      </div>
                    </div>
                  );
                })}

                <div className="relative z-10 max-w-[15rem] rounded-[1.5rem] border border-white bg-white/90 px-5 py-5 text-center shadow-xl shadow-slate-900/10 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5C91B7]">
                    {copy.eyebrow}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {formatCount(items.length, locale)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {copy.allMembers}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "w-full min-w-0 text-slate-950",
        isDashboardSurface ? "bg-transparent py-0" : "bg-[#F4F7FB] py-16 md:py-20",
      )}
    >
      <div
        className={cn(
          "mx-auto w-full min-w-0",
          isDashboardSurface ? "max-w-full px-0" : "max-w-7xl px-6",
        )}
      >
        {showIntro ? (
          <div
            className={cn(
              "overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm",
              isDashboardSurface ? "p-5 sm:p-6 lg:p-7" : "p-6 md:p-10",
            )}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5C91B7]">
                  {copy.eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
                  {copy.title}
                </h1>
                {!isDashboardSurface ? (
                  <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                    {copy.description}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    {formatCount(items.length, locale)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {copy.profiles}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    {formatCount(specializations.length - 1, locale)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {copy.specialization}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#10203B]">
              {copy.title}
            </h1>
          </div>
        )}

        <div
          className={cn(
            "w-full min-w-0 overflow-hidden rounded-[32px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_22px_60px_rgba(11,31,68,0.09)]",
            showIntro ? "mt-5" : "mt-5",
          )}
        >
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(220px,1.35fr)_repeat(3,minmax(150px,1fr))] lg:items-end">
            <label className="grid gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#21466D]/70">
                {copy.filtersTitle}
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="h-12 w-full rounded-2xl border border-[#D4E0F0] bg-[#F8FBFF] pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#72A0C1] focus:bg-white focus:ring-4 focus:ring-[#72A0C1]/10"
                />
              </div>
            </label>

            <FilterSelect
              label={copy.allCategories}
              value={category}
              onChange={setCategory}
              items={categories}
              getLabel={(item) =>
                item === "all" ? copy.allCategories : membershipLabels[item] || item
              }
            />

            <FilterSelect
              label={copy.country}
              value={country}
              onChange={setCountry}
              items={countries}
              getLabel={(item) => getSelectLabel(item, copy.allCountries)}
            />

            <FilterSelect
              label={copy.specialization}
              value={specialization}
              onChange={setSpecialization}
              items={specializations}
              getLabel={(item) => getSelectLabel(item, copy.allSpecializations)}
            />
          </div>
        </div>

        {list.length === 0 ? (
          <div className="mt-5 rounded-[32px] border border-dashed border-[#D4E0F0] bg-white/95 px-6 py-16 text-center text-slate-500 shadow-[0_22px_60px_rgba(11,31,68,0.08)]">
            {items.length === 0 ? copy.empty : copy.noResults}
          </div>
        ) : (
          <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2">
            {list.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                copy={copy}
                membershipLabels={membershipLabels}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  items,
  getLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: string[];
  getLabel: (value: string) => string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#21466D]/70">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full min-w-0 rounded-2xl border border-[#D4E0F0] bg-[#F8FBFF] px-4 text-sm text-slate-950 outline-none transition focus:border-[#72A0C1] focus:bg-white focus:ring-4 focus:ring-[#72A0C1]/10"
      >
        {items.map((item) => (
          <option key={item} value={item}>
            {getLabel(item)}
          </option>
        ))}
      </select>
    </label>
  );
}

function MemberAvatar({
  member,
  className,
}: {
  member: PublicMember;
  className?: string;
}) {
  return member.avatarUrl ? (
    <div
      className={cn(
        "overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg shadow-slate-900/12",
        className,
      )}
    >
      <ImageWithFallback
        src={member.avatarUrl}
        alt={member.fullName}
        className="h-full w-full object-cover"
      />
    </div>
  ) : (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-4 border-white bg-[radial-gradient(circle_at_30%_20%,#E0F2FE,#72A0C1_45%,#0F3B63)] text-sm font-bold text-white shadow-lg shadow-slate-900/12",
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
        ? member.title
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

  const specializationText = specializations.join(", ") || member.title;
  const highlightChips = member.highlights.filter(Boolean).slice(0, 3);

  const categoryLabel = member.membershipCategory
    ? membershipLabels[member.membershipCategory] || member.membershipCategory
    : null;

  return (
    <Dialog>
      <div className="group flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-[32px] border border-[#D4E0F0] bg-white shadow-[0_22px_60px_rgba(11,31,68,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(11,31,68,0.14)]">
        <div className="h-20 bg-[radial-gradient(circle_at_18%_18%,rgba(114,160,193,0.34),transparent_32%),linear-gradient(135deg,#F6FAFF,#EAF3FD)]" />

        <div className="flex flex-1 flex-col px-5 pb-5 pt-0">
          <div className="-mt-10 flex items-start justify-between gap-3">
            <MemberAvatar member={member} className="h-[78px] w-[78px]" />

            <div className="flex flex-wrap justify-end gap-2 pt-3">
              {categoryLabel ? (
                <span className="inline-flex items-center rounded-full border border-[#72A0C1]/20 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#477998] shadow-sm">
                  {categoryLabel}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                Active Member
              </span>
            </div>
          </div>

          <div className="mt-4 min-w-0">
            <p className="line-clamp-1 text-lg font-semibold leading-tight tracking-[-0.02em] text-[#10203B]">
              {member.fullName}
            </p>

            {member.location ? (
              <p className="mt-3 flex items-start gap-2 text-sm leading-5 text-slate-500">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#72A0C1]" />
                <span className="line-clamp-1">{member.location}</span>
              </p>
            ) : null}

            <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
              {specializationText || "IBPA Member"}
            </p>
          </div>

          {highlightChips.length > 0 ? (
            <div className="mt-4 flex min-h-[2rem] flex-wrap gap-2">
              {highlightChips.map((item) => (
                <span
                  key={item}
                  className="inline-flex max-w-full rounded-full border border-[#D4E0F0] bg-[#F8FBFF] px-3 py-1 text-[11px] font-medium text-slate-600"
                >
                  <span className="truncate">{item}</span>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto pt-5">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
              {member.experience ? (
                <span className="rounded-full bg-[#F8FBFF] px-3 py-1 font-semibold text-slate-600">
                  {member.experience}
                </span>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2 text-slate-500">
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D4E0F0] bg-white transition hover:border-[#72A0C1]/50 hover:bg-[#F4FAFF] hover:text-[#4C7D9D]"
                    aria-label={`${member.fullName} Instagram`}
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                ) : null}

                {websiteUrl ? (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D4E0F0] bg-white transition hover:border-[#72A0C1]/50 hover:bg-[#F4FAFF] hover:text-[#4C7D9D]"
                    aria-label={`${member.fullName} website`}
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>

            <DialogTrigger asChild>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071933] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#071933]/10 transition hover:-translate-y-0.5 hover:bg-[#10284E]">
                {copy.openProfile}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            </DialogTrigger>
          </div>
        </div>
      </div>

      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-0 bg-transparent p-0 shadow-none">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-2xl">
          <div className="relative overflow-hidden px-5 pb-6 pt-12 md:px-8 md:pb-8 md:pt-14">
            <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-[#72A0C1]/25 blur-3xl" />
            <div className="absolute -right-8 top-8 h-36 w-36 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
                  <MemberAvatar
                    member={member}
                    className="h-28 w-28 md:h-32 md:w-32"
                  />

                  <div className="min-w-0">
                    {categoryLabel ? (
                      <p className="mb-3 inline-flex rounded-full border border-[#72A0C1]/30 bg-[#72A0C1]/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#B9D9EB]">
                        {categoryLabel}
                      </p>
                    ) : null}

                    <DialogTitle className="text-3xl font-semibold leading-none tracking-[-0.04em] text-white md:text-5xl">
                      {member.fullName}
                    </DialogTitle>

                    <DialogDescription className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
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
                  <StatBlock value={member.experience} label={copy.experience} />
                ) : null}

                {member.location ? (
                  <StatBlock value={member.city || member.location} label={copy.location} />
                ) : null}

                <StatBlock value={memberSince} label={copy.since} />

                {member.highlights[0] ? (
                  <StatBlock value={member.highlights[0]} label={copy.highlights} />
                ) : null}
              </div>

              {(member.description ||
                instagramUrl ||
                websiteUrl ||
                member.highlights.length > 0) && (
                <div className="mt-6 grid gap-6 border-t border-white/10 pt-6 md:grid-cols-[1.25fr_0.75fr]">
                  {member.description ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        {copy.about}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-white/80">
                        {member.description}
                      </p>
                    </div>
                  ) : null}

                  <div>
                    {(instagramUrl || websiteUrl) && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          {copy.contact}
                        </p>

                        <div className="mt-3 flex flex-col gap-2">
                          {instagramUrl ? (
                            <a
                              href={instagramUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-[#8DD4F7] hover:underline"
                            >
                              <Instagram className="h-4 w-4" />
                              Instagram
                            </a>
                          ) : null}

                          {websiteUrl ? (
                            <a
                              href={websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-[#8DD4F7] hover:underline"
                            >
                              <Globe className="h-4 w-4" />
                              Website
                            </a>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {member.highlights.length > 1 ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {member.highlights.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70"
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {copy.viewExamples}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {member.portfolioImages.slice(0, 6).map((image, index) => (
                  <div
                    key={`${member.id}-${index}`}
                    className="overflow-hidden rounded-2xl bg-white/5"
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`${member.fullName} portfolio sample ${index + 1}`}
                      className="aspect-square w-full object-cover"
                    />
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
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#8DD4F7] transition hover:bg-white/10 hover:text-white"
                >
                  {copy.publicProfile}
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

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="line-clamp-2 text-base font-semibold text-white md:text-xl">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
        {label}
      </p>
    </div>
  );
}
