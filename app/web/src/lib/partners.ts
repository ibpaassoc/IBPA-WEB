export type Locale = "en" | "ru" | "uk";

export type PartnerContentItem = {
  id: string;
  title: string;
  body: string;
  coverImage?: string | null;
  createdAt?: string;
};

export type PartnerCard = {
  id: string;
  name: string;
  logo: string;
  description: string;
};

const defaultPartnerCards: Record<Locale, PartnerCard[]> = {
  en: [
    {
      id: "teora-beauty",
      name: "TEORA beauty",
      logo: "/sponsors/teora-beauty-new.webp",
      description:
        "TEORA beauty is a product created by masters for masters. The brand sets new beauty-industry standards by making professionals' work easier and more comfortable, while helping results become safer and better.",
    },
    {
      id: "nepop-radio",
      name: "NePOP Radio",
      logo: "/sponsors/nepop-radio.webp",
      description:
        "NePOP Radio is not background noise. It is the sound of our reality. The music we grew up with. The music we live to. Unfiltered conversations about life, adaptation, and immigration in the United States: honest, sometimes tough, always real.",
    },
  ],
  ru: [
    {
      id: "teora-beauty",
      name: "TEORA beauty",
      logo: "/sponsors/teora-beauty-new.webp",
      description:
        "Бренд TEORA beauty — продукт, созданный мастерами для мастеров. Мы задаем новые стандарты в бьюти, делая работу мастеров легче и комфортнее, а результат безопаснее и лучше.",
    },
    {
      id: "nepop-radio",
      name: "NePOP Radio",
      logo: "/sponsors/nepop-radio.webp",
      description:
        "NePOP Radio — это не фон. Это звук нашей реальности. Музыка, на которой выросли. Музыка, под которую живем. Разговоры без фильтров — про жизнь, адаптацию и иммиграцию в США: честно, местами жестко, всегда по делу.",
    },
  ],
  uk: [
    {
      id: "teora-beauty",
      name: "TEORA beauty",
      logo: "/sponsors/teora-beauty-new.webp",
      description:
        "Бренд TEORA beauty — продукт, створений майстрами для майстрів. Ми задаємо нові стандарти в beauty, роблячи роботу майстрів легшою й комфортнішою, а результат — безпечнішим і кращим.",
    },
    {
      id: "nepop-radio",
      name: "NePOP Radio",
      logo: "/sponsors/nepop-radio.webp",
      description:
        "NePOP Radio — це не фон. Це звук нашої реальності. Музика, на якій ми виросли. Музика, під яку живемо. Розмови без фільтрів — про життя, адаптацію та імміграцію у США: чесно, місцями жорстко, завжди по суті.",
    },
  ],
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
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
      description: item.body.trim(),
    });
  }

  return Array.from(cards.values());
}
