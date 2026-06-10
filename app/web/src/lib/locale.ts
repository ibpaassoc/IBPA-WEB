export type Locale = "en" | "ru" | "uk";
export type SupportedLocale = "en" | "ru" | "ua";

export function resolveLocale(value?: string | null): Locale {
  if (value === "ru") return "ru";
  if (value === "uk" || value === "ua") return "uk";
  return "en";
}

export function getLocaleCookieValue(locale: Locale): SupportedLocale {
  return locale === "uk" ? "ua" : locale;
}

export function getLocaleNumberFormat(locale: Locale) {
  return locale === "uk" ? "uk-UA" : locale === "ru" ? "ru-RU" : "en-US";
}
