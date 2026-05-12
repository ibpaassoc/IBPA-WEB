export type Locale = "en" | "ru" | "uk";

export type PartnerContentItem = {
  id: string;
  title: string;
  body: string;
  coverImage?: string | null;
  ctaUrl?: string | null;
  cta_url?: string | null;
  createdAt?: string;
};

export type PartnerCard = {
  id: string;
  name: string;
  logo: string;
  link?: string;
  description: string;
};

const defaultPartnerCards: Record<Locale, PartnerCard[]> = {
  en: [
    {
      id: "alismia",
      name: "Alismia",
      logo: "/sponsors/partner-secondary.webp",
      link: "https://www.alismia.com/",
      description:
        "Alismia is a partner brand supporting beauty professionals through collaboration and industry-focused initiatives.",
    },
    {
      id: "teora-beauty",
      name: "TEORA beauty",
      logo: "/sponsors/teora-beauty-new.webp",
      link: "https://www.instagram.com/teora_beauty?igsh=NTc4MTIwNjQ2YQ==",
      description:
        "TEORA beauty is a product created by masters for masters. The brand sets new beauty-industry standards by making professionals' work easier and more comfortable, while helping results become safer and better.",
    },
    {
      id: "nepop-radio",
      name: "NePOP Radio",
      logo: "/sponsors/nepop-radio.webp",
      link: "https://nepopradio.com",
      description:
        "NePOP Radio is not background noise. It is the sound of our reality. The music we grew up with. The music we live to. Unfiltered conversations about life, adaptation, and immigration in the United States: honest, sometimes tough, always real.",
    },
  ],
  ru: [
    {
      id: "alismia",
      name: "Alismia",
      logo: "/sponsors/partner-secondary.webp",
      link: "https://www.alismia.com/",
      description: "Alismia - partner brand.",
    },
    {
      id: "teora-beauty",
      name: "TEORA beauty",
      logo: "/sponsors/teora-beauty-new.webp",
      link: "https://www.instagram.com/teora_beauty?igsh=NTc4MTIwNjQ2YQ==",
      description:
        "TEORA beauty is a product created by masters for masters. The brand sets new beauty-industry standards by making professionals' work easier and more comfortable, while helping results become safer and better.",
    },
    {
      id: "nepop-radio",
      name: "NePOP Radio",
      logo: "/sponsors/nepop-radio.webp",
      link: "https://nepopradio.com",
      description:
        "NePOP Radio is not background noise. It is the sound of our reality. The music we grew up with. The music we live to. Unfiltered conversations about life, adaptation, and immigration in the United States: honest, sometimes tough, always real.",
    },
  ],
  uk: [
    {
      id: "alismia",
      name: "Alismia",
      logo: "/sponsors/partner-secondary.webp",
      link: "https://www.alismia.com/",
      description: "Alismia - partner brand.",
    },
    {
      id: "teora-beauty",
      name: "TEORA beauty",
      logo: "/sponsors/teora-beauty-new.webp",
      link: "https://www.instagram.com/teora_beauty?igsh=NTc4MTIwNjQ2YQ==",
      description:
        "TEORA beauty is a product created by masters for masters. The brand sets new beauty-industry standards by making professionals' work easier and more comfortable, while helping results become safer and better.",
    },
    {
      id: "nepop-radio",
      name: "NePOP Radio",
      logo: "/sponsors/nepop-radio.webp",
      link: "https://nepopradio.com",
      description:
        "NePOP Radio is not background noise. It is the sound of our reality. The music we grew up with. The music we live to. Unfiltered conversations about life, adaptation, and immigration in the United States: honest, sometimes tough, always real.",
    },
  ],
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function getDefaultSponsorLinkByName(name: string): string | undefined {
  const normalized = normalizeName(name);
  if (normalized === "alismia") return "https://www.alismia.com/";
  if (normalized === "teora beauty" || normalized === "teora") {
    return "https://www.instagram.com/teora_beauty?igsh=NTc4MTIwNjQ2YQ==";
  }
  if (normalized === "nepop radio" || normalized === "nepop") {
    return "https://nepopradio.com";
  }
  return undefined;
}

export function getDefaultPartnerCards(locale: Locale): PartnerCard[] {
  return defaultPartnerCards[locale];
}

export function mergePartnerCards(locale: Locale, items: PartnerContentItem[] = []): PartnerCard[] {
  const cards = new Map<string, PartnerCard>();

  for (const card of defaultPartnerCards[locale]) {
    cards.set(normalizeName(card.name), card);
  }

  for (const item of items) {
    const logo = item.coverImage?.trim();
    if (!item.title.trim() || !item.body.trim() || !logo) {
      continue;
    }

    cards.set(normalizeName(item.title), {
      id: item.id,
      name: item.title.trim(),
      logo,
      link:
        item.ctaUrl?.trim() ||
        item.cta_url?.trim() ||
        cards.get(normalizeName(item.title))?.link ||
        getDefaultSponsorLinkByName(item.title),
      description: item.body.trim(),
    });
  }

  return Array.from(cards.values());
}
