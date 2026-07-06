"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

import type { MembersLocale, PublicMember } from "../types";
import { getMembershipBadgeLabel } from "../utils";
import { MemberCard } from "./MemberCard";

type MembersDirectoryProps = {
  members: PublicMember[];
  locale: MembersLocale;
};

function getCopy(locale: MembersLocale) {
  if (locale === "ru") {
    return {
      searchPlaceholder: "Имя, специализация, город",
      allCategories: "Все категории",
      allCountries: "Все страны",
      resultsOne: "участник",
      results: "участников",
      empty: "Профили скоро появятся.",
      noResults: "По текущим фильтрам ничего не найдено.",
    };
  }

  if (locale === "uk") {
    return {
      searchPlaceholder: "Ім'я, спеціалізація, місто",
      allCategories: "Усі категорії",
      allCountries: "Усі країни",
      resultsOne: "учасник",
      results: "учасників",
      empty: "Профілі скоро з'являться.",
      noResults: "За поточними фільтрами нічого не знайдено.",
    };
  }

  return {
    searchPlaceholder: "Name, specialization, city",
    allCategories: "All categories",
    allCountries: "All countries",
    resultsOne: "member",
    results: "members",
    empty: "Member profiles will appear here soon.",
    noResults: "No members match the current filters.",
  };
}

export function MembersDirectory({ members, locale }: MembersDirectoryProps) {
  const copy = getCopy(locale);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [country, setCountry] = useState("all");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(members.map((member) => member.membershipCategory).filter(Boolean)),
      ),
    [members],
  );

  const countries = useMemo(
    () =>
      Array.from(new Set(members.map((member) => member.country).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [members],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesCategory =
        category === "all" || member.membershipCategory === category;
      const matchesCountry = country === "all" || member.country === country;

      if (!matchesCategory || !matchesCountry) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        member.fullName,
        member.title,
        member.specializations?.join(" "),
        member.location,
        member.city,
        member.country,
        member.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [members, search, category, country]);

  if (members.length === 0) {
    return (
      <div className="rounded-[32px] border border-dashed border-[#D4E0F0] bg-white/70 px-6 py-20 text-center text-slate-500">
        <Users className="mx-auto mb-4 h-8 w-8 text-[#72A0C1]" />
        {copy.empty}
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-[28px] border border-[#D4E0F0] bg-white/85 p-4 shadow-[0_18px_45px_rgba(11,31,68,0.07)] backdrop-blur-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchPlaceholder}
              className="h-12 w-full rounded-2xl border border-[#D4E0F0] bg-[#F8FBFF] pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#72A0C1] focus:bg-white focus:ring-4 focus:ring-[#72A0C1]/10"
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label={copy.allCategories}
            className="h-12 w-full rounded-2xl border border-[#D4E0F0] bg-[#F8FBFF] px-4 text-sm text-slate-950 outline-none transition focus:border-[#72A0C1] focus:bg-white focus:ring-4 focus:ring-[#72A0C1]/10"
          >
            <option value="all">{copy.allCategories}</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {getMembershipBadgeLabel(value, locale) ?? value}
              </option>
            ))}
          </select>

          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            aria-label={copy.allCountries}
            className="h-12 w-full rounded-2xl border border-[#D4E0F0] bg-[#F8FBFF] px-4 text-sm text-slate-950 outline-none transition focus:border-[#72A0C1] focus:bg-white focus:ring-4 focus:ring-[#72A0C1]/10"
          >
            <option value="all">{copy.allCountries}</option>
            {countries.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-5 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {filtered.length} {filtered.length === 1 ? copy.resultsOne : copy.results}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-[32px] border border-dashed border-[#D4E0F0] bg-white/70 px-6 py-16 text-center text-slate-500">
          {copy.noResults}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
