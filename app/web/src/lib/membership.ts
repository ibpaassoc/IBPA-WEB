export type MembershipCategory = "Specialist" | "Professional" | "Trainer" | "Business" | "Brand";
export type ApplicantType = "Individual" | "Business" | "School" | "Brand";

export type MembershipConfig = {
  id: MembershipCategory;
  title: string;
  titleRu: string;
  titleUk: string;
  shortTitle: string;
  shortTitleRu: string;
  shortTitleUk: string;
  price: string;
  applicantType: ApplicantType;
  audienceAliases: string[];
  summary: string;
  summaryRu: string;
  summaryUk: string;
  detailTitle: string;
  detailDescription: string;
  detailTitleRu: string;
  detailDescriptionRu: string;
  detailTitleUk: string;
  detailDescriptionUk: string;
};

export const membershipConfigs: MembershipConfig[] = [
  {
    id: "Specialist",
    title: "Specialist",
    titleRu: "Специалист",
    titleUk: "Спеціаліст",
    shortTitle: "Specialist",
    shortTitleRu: "Специалист",
    shortTitleUk: "Спеціаліст",
    price: "$49",
    applicantType: "Individual",
    audienceAliases: ["Students", "Student", "Specialists"],
    summary: "For current beauty specialists building early experience and professional direction.",
    summaryRu: "Для специалистов beauty-индустрии, которые находятся в начале профессионального пути и формируют своё направление развития.",
    summaryUk: "Для спеціалістів beauty-індустрії, які перебувають на початку професійного шляху та формують свій напрям розвитку.",
    detailTitle: "Specialist details",
    detailDescription: "Tell us about your training, early experience, and what you want to build next.",
    detailTitleRu: "Детали специалиста",
    detailDescriptionRu: "Расскажите о вашей школе, программе обучения и о том, что вы хотите развивать дальше.",
    detailTitleUk: "Деталі спеціаліста",
    detailDescriptionUk: "Розкажіть про вашу школу, програму навчання та про те, що ви хочете розвивати далі.",
  },
  {
    id: "Professional",
    title: "Professional",
    titleRu: "Профессионал",
    titleUk: "Професіонал",
    shortTitle: "Professional",
    shortTitleRu: "Мастер",
    shortTitleUk: "Майстер",
    price: "$199",
    applicantType: "Individual",
    audienceAliases: ["Beauty Professionals"],
    summary: "For active beauty practitioners who want recognition, standards, and industry visibility.",
    summaryRu: "Для действующих beauty-специалистов, которым важны признание, профессиональные стандарты и видимость в индустрии.",
    summaryUk: "Для діючих beauty-специалістів, яким важливі визнання, професійні стандарти та видимість в індустрії.",
    detailTitle: "Professional details",
    detailDescription: "Show your specialization, service areas, and current working jurisdiction.",
    detailTitleRu: "Профессиональные детали",
    detailDescriptionRu: "Покажите вашу специализацию, направления работы и текущую географию профессиональной деятельности.",
    detailTitleUk: "Професійні деталі",
    detailDescriptionUk: "Покажіть вашу спеціалізацію, напрями роботи та поточну географію професійної діяльності.",
  },
  {
    id: "Trainer",
    title: "Trainer / Educator",
    titleRu: "Тренер / Преподаватель",
    titleUk: "Тренер / Викладач",
    shortTitle: "Trainer",
    shortTitleRu: "Тренер",
    shortTitleUk: "Тренер",
    price: "$399",
    applicantType: "School",
    audienceAliases: ["Educators & Trainers"],
    summary: "For instructors, academies, and educators shaping professional beauty education.",
    summaryRu: "Для преподавателей, академий и тренеров, которые формируют профессиональное beauty-образование.",
    summaryUk: "Для викладачів, академій і тренерів, які формують професійну beauty-освіту.",
    detailTitle: "Educator details",
    detailDescription: "Describe your teaching format, subject areas, and learner reach.",
    detailTitleRu: "Детали преподавателя",
    detailDescriptionRu: "Опишите ваш формат преподавания, направления обучения и охват учащихся.",
    detailTitleUk: "Деталі викладача",
    detailDescriptionUk: "Опишіть ваш формат викладання, напрями навчання та охоплення учнів.",
  },
  {
    id: "Business",
    title: "Business Owner",
    titleRu: "Владелец салона",
    titleUk: "Власник салону",
    shortTitle: "Business",
    shortTitleRu: "Салон",
    shortTitleUk: "Салон",
    price: "$599",
    applicantType: "Business",
    audienceAliases: ["Business Owners"],
    summary: "For salon, studio, and beauty-space owners building reputable businesses.",
    summaryRu: "Для владельцев салонов, студий и beauty-пространств, развивающих устойчивый и репутационный бизнес.",
    summaryUk: "Для власників салонів, студій і beauty-просторів, які розвивають стійкий і репутаційний бізнес.",
    detailTitle: "Business details",
    detailDescription: "Share your business profile, team, and main service directions.",
    detailTitleRu: "Детали бизнеса",
    detailDescriptionRu: "Расскажите о вашем бизнесе, команде и ключевых направлениях услуг.",
    detailTitleUk: "Деталі бізнесу",
    detailDescriptionUk: "Розкажіть про ваш бізнес, команду та ключові напрями послуг.",
  },
  {
    id: "Brand",
    title: "Brand Member",
    titleRu: "Бренд-участник",
    titleUk: "Бренд-учасник",
    shortTitle: "Brand Member",
    shortTitleRu: "Бренд-участник",
    shortTitleUk: "Бренд-учасник",
    price: "$1,299",
    applicantType: "Brand",
    audienceAliases: ["Brands & Companies"],
    summary: "For beauty brands, manufacturers, distributors, and suppliers seeking verified professional standing in the IBPA community.",
    summaryRu: "Для beauty-брендов, производителей, дистрибьюторов и поставщиков, которым важен подтвержденный профессиональный статус в сообществе IBPA.",
    summaryUk: "Для beauty-брендів, виробників, дистриб'юторів і постачальників, яким важливий підтверджений професійний статус у спільноті IBPA.",
    detailTitle: "Brand details",
    detailDescription: "Tell us about your company, market presence, and brand category.",
    detailTitleRu: "Детали бренда",
    detailDescriptionRu: "Расскажите о вашей компании, присутствии на рынке и категории бренда.",
    detailTitleUk: "Деталі бренду",
    detailDescriptionUk: "Розкажіть про вашу компанію, присутність на ринку та категорію бренду.",
  },
];

export const membershipConfigById = Object.fromEntries(
  membershipConfigs.map((config) => [config.id, config]),
) as Record<MembershipCategory, MembershipConfig>;

export function getMembershipCategory(value?: string | null): MembershipCategory | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const match = membershipConfigs.find((config) => {
    return (
      config.id.toLowerCase() === normalized ||
      config.title.toLowerCase() === normalized ||
      config.shortTitle.toLowerCase() === normalized ||
      config.audienceAliases.some((alias) => alias.toLowerCase() === normalized)
    );
  });

  return match?.id ?? null;
}

export function buildApplyHref(category?: MembershipCategory | null) {
  if (!category) {
    return "/apply";
  }

  return `/apply?category=${category}`;
}
