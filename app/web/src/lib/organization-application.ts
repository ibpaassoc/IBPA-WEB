import type { MembershipCategory } from "@/lib/membership";

export type LocalizedApplicationLabel = {
  en: string;
  ru: string;
  uk: string;
};

export const organizationApplicationLabels: Record<string, LocalizedApplicationLabel> = {
  businessProfilePhotoFiles: { en: "Profile photo", ru: "Фото профиля", uk: "Фото профілю" },
  preferredName: { en: "Preferred name", ru: "Предпочитаемое имя", uk: "Бажане ім’я" },
  businessCurrentPosition: { en: "Current position", ru: "Текущая должность", uk: "Поточна посада" },
  businessCurrentPositionOther: { en: "Other position", ru: "Другая должность", uk: "Інша посада" },
  professionalBiography: { en: "Professional biography", ru: "Профессиональная биография", uk: "Професійна біографія" },
  professionalExperience: { en: "Professional experience", ru: "Профессиональный опыт", uk: "Професійний досвід" },
  professionalEducation: { en: "Professional education", ru: "Профессиональное образование", uk: "Професійна освіта" },
  professionalAchievements: { en: "Professional achievements", ru: "Профессиональные достижения", uk: "Професійні досягнення" },
  businessProfessionalCertificationFiles: { en: "Professional certifications", ru: "Профессиональные сертификаты", uk: "Професійні сертифікати" },
  bizTypeOther: { en: "Other business type", ru: "Другой тип бизнеса", uk: "Інший тип бізнесу" },
  businessCountry: { en: "Business country", ru: "Страна бизнеса", uk: "Країна бізнесу" },
  businessCity: { en: "Business city", ru: "Город бизнеса", uk: "Місто бізнесу" },
  businessAddress: { en: "Business address", ru: "Адрес бизнеса", uk: "Адреса бізнесу" },
  businessWebsite: { en: "Business website", ru: "Сайт бизнеса", uk: "Сайт бізнесу" },
  businessInstagram: { en: "Business Instagram", ru: "Instagram бизнеса", uk: "Instagram бізнесу" },
  businessFacebook: { en: "Business Facebook", ru: "Facebook бизнеса", uk: "Facebook бізнесу" },
  businessTikTok: { en: "Business TikTok", ru: "TikTok бизнеса", uk: "TikTok бізнесу" },
  businessLinkedIn: { en: "Business LinkedIn", ru: "LinkedIn бизнеса", uk: "LinkedIn бізнесу" },
  businessYouTube: { en: "Business YouTube", ru: "YouTube бизнеса", uk: "YouTube бізнесу" },
  businessOtherSocial: { en: "Other business social media", ru: "Другие соцсети бизнеса", uk: "Інші соцмережі бізнесу" },
  businessDescription: { en: "Business description", ru: "Описание бизнеса", uk: "Опис бізнесу" },
  businessAchievements: { en: "Business achievements", ru: "Достижения бизнеса", uk: "Досягнення бізнесу" },
  businessMission: { en: "Business mission", ru: "Миссия бизнеса", uk: "Місія бізнесу" },
  businessIndustryContribution: { en: "Business industry contribution", ru: "Вклад бизнеса в индустрию", uk: "Внесок бізнесу в індустрію" },
  businessSupportingDocumentFiles: { en: "Business supporting documents", ru: "Подтверждающие документы бизнеса", uk: "Підтверджувальні документи бізнесу" },
  businessPortfolioImages: { en: "Business portfolio", ru: "Портфолио бизнеса", uk: "Портфоліо бізнесу" },
  businessMediaFeatured: { en: "Featured in media", ru: "Публикации в медиа", uk: "Публікації в медіа" },
  businessMediaDescription: { en: "Media details", ru: "Описание публикаций в медиа", uk: "Опис публікацій у медіа" },
  businessPublications: { en: "Publications", ru: "Публикации", uk: "Публікації" },
  businessSpeakingExperience: { en: "Speaking experience", ru: "Опыт выступлений", uk: "Досвід виступів" },
  businessJudgingExperience: { en: "Judging experience", ru: "Опыт судейства", uk: "Досвід суддівства" },
  businessProfessionalMemberships: { en: "Professional memberships", ru: "Членство в профессиональных ассоциациях", uk: "Членство у професійних асоціаціях" },
  businessClientTestimonialFiles: { en: "Client testimonials", ru: "Отзывы клиентов", uk: "Відгуки клієнтів" },
  brandRegistrationCountry: { en: "Country of registration", ru: "Страна регистрации", uk: "Країна реєстрації" },
  brandTypeOther: { en: "Other company type", ru: "Другой тип компании", uk: "Інший тип компанії" },
  brandCity: { en: "Company city", ru: "Город компании", uk: "Місто компанії" },
  brandAddress: { en: "Company address", ru: "Адрес компании", uk: "Адреса компанії" },
  brandWebsite: { en: "Company website", ru: "Сайт компании", uk: "Сайт компанії" },
  brandInstagram: { en: "Instagram", ru: "Instagram", uk: "Instagram" },
  brandFacebook: { en: "Facebook", ru: "Facebook", uk: "Facebook" },
  brandSocialWebsite: { en: "Social media website", ru: "Сайт в блоке соцсетей", uk: "Сайт у блоці соцмереж" },
  brandTikTok: { en: "TikTok", ru: "TikTok", uk: "TikTok" },
  brandLinkedIn: { en: "LinkedIn", ru: "LinkedIn", uk: "LinkedIn" },
  brandYouTube: { en: "YouTube", ru: "YouTube", uk: "YouTube" },
  brandPinterest: { en: "Pinterest", ru: "Pinterest", uk: "Pinterest" },
  brandOtherSocial: { en: "Other social media", ru: "Другие соцсети", uk: "Інші соцмережі" },
  brandPrimaryContact: { en: "Primary contact person", ru: "Основное контактное лицо", uk: "Основна контактна особа" },
  brandContactPosition: { en: "Contact position", ru: "Должность контактного лица", uk: "Посада контактної особи" },
  brandContactPositionOther: { en: "Other contact position", ru: "Другая должность контактного лица", uk: "Інша посада контактної особи" },
  brandContactEmail: { en: "Contact email", ru: "Контактный email", uk: "Контактний email" },
  brandContactPhone: { en: "Contact phone", ru: "Контактный телефон", uk: "Контактний телефон" },
  brandDescription: { en: "Company description", ru: "Описание компании", uk: "Опис компанії" },
  brandMission: { en: "Mission", ru: "Миссия", uk: "Місія" },
  brandValues: { en: "Brand values", ru: "Ценности бренда", uk: "Цінності бренду" },
  brandProductsServices: { en: "Products / services", ru: "Продукты / услуги", uk: "Продукти / послуги" },
  brandReviewFiles: { en: "Reviews", ru: "Отзывы", uk: "Відгуки" },
  brandProductCategories: { en: "Product categories", ru: "Категории продуктов", uk: "Категорії продуктів" },
  brandProductCategoryOther: { en: "Other product category", ru: "Другая категория продуктов", uk: "Інша категорія продуктів" },
  brandProductFiles: { en: "Product photos / catalog", ru: "Фото продуктов / каталог", uk: "Фото продуктів / каталог" },
  brandCatalogLinks: { en: "Catalog links", ru: "Ссылки на каталог", uk: "Посилання на каталог" },
  brandOperatingCountries: { en: "Countries where the brand operates", ru: "Страны присутствия бренда", uk: "Країни присутності бренду" },
  brandEmployeeCount: { en: "Number of employees", ru: "Количество сотрудников", uk: "Кількість працівників" },
  brandAchievements: { en: "Company achievements", ru: "Достижения компании", uk: "Досягнення компанії" },
  brandAchievementDocumentFiles: { en: "Achievement documents", ru: "Документы о достижениях", uk: "Документи про досягнення" },
  brandCertifications: { en: "Professional certifications", ru: "Профессиональные сертификации", uk: "Професійні сертифікації" },
  brandCertificationOther: { en: "Other certification", ru: "Другая сертификация", uk: "Інша сертифікація" },
  brandPublicationsYesNo: { en: "Publications and media", ru: "Публикации и медиа", uk: "Публікації та медіа" },
  brandPublicationsDetails: { en: "Publication details", ru: "Описание публикаций", uk: "Опис публікацій" },
  brandExhibitionsYesNo: { en: "Exhibitions and events", ru: "Выставки и мероприятия", uk: "Виставки та заходи" },
  brandExhibitionsDetails: { en: "Exhibition and event details", ru: "Описание выставок и мероприятий", uk: "Опис виставок та заходів" },
  brandIndustryContribution: { en: "Industry contribution", ru: "Вклад в индустрию", uk: "Внесок в індустрію" },
  brandCooperationMethods: { en: "Ways to cooperate with IBPA", ru: "Форматы сотрудничества с IBPA", uk: "Формати співпраці з IBPA" },
  brandCooperationOther: { en: "Other cooperation format", ru: "Другой формат сотрудничества", uk: "Інший формат співпраці" },
  brandSupportingDocumentFiles: { en: "Supporting documents", ru: "Подтверждающие документы", uk: "Підтверджувальні документи" },
  brandAdditionalLinks: { en: "Additional links", ru: "Дополнительные ссылки", uk: "Додаткові посилання" },
  brandMemberBenefits: { en: "Benefits for IBPA members", ru: "Преимущества для участников IBPA", uk: "Переваги для учасників IBPA" },
  brandMemberBenefitOther: { en: "Other member benefit", ru: "Другое преимущество", uk: "Інша перевага" },
  additionalDocumentationConsent: { en: "Additional documentation acknowledgement", ru: "Согласие предоставить дополнительные документы", uk: "Згода надати додаткові документи" },
};

const businessStepFields: Record<number, string[]> = {
  1: ["firstName", "lastName", "dateOfBirth", "country", "city", "phone", "email", "businessProfilePhotoFiles"],
  2: [
    "businessCurrentPosition",
    "businessCurrentPositionOther",
    "yearsExperience",
    "professionalBiography",
    "professionalExperience",
    "professionalEducation",
    "professionalAchievements",
    "businessProfessionalCertificationFiles",
  ],
  3: [
    "bizName", "bizType", "bizTypeOther", "bizYear", "businessCountry", "businessCity", "businessAddress",
    "businessWebsite", "businessInstagram", "bizTeamSize", "businessDescription", "bizServices", "businessAchievements",
    "businessMission", "businessIndustryContribution", "businessSupportingDocumentFiles", "businessPortfolioImages",
  ],
  4: [
    "businessMediaFeatured", "businessMediaDescription", "businessPublications", "businessSpeakingExperience",
    "businessJudgingExperience", "businessClientTestimonialFiles",
  ],
  5: ["whyJoin", "contributionDesc"],
  6: ["certifyTrue", "additionalDocumentationConsent", "agreeStandards", "understandReview", "privacyConsent"],
};

const brandStepFields: Record<number, string[]> = {
  1: [
    "brandName", "brandType", "brandTypeOther", "brandYear", "brandRegistrationCountry", "brandCity", "brandAddress", "brandWebsite",
    "brandInstagram", "brandSocialWebsite", "brandPrimaryContact", "brandContactPosition", "brandContactPositionOther",
    "brandContactEmail", "brandContactPhone",
  ],
  2: [
    "brandDescription", "brandMission", "brandValues", "brandProductsServices", "brandReviewFiles", "brandProductCategories",
    "brandProductCategoryOther", "brandProductFiles", "brandOperatingCountries", "brandEmployeeCount",
  ],
  3: [
    "brandAchievements", "brandAchievementDocumentFiles", "brandCertifications", "brandCertificationOther",
    "brandPublicationsYesNo", "brandPublicationsDetails", "brandExhibitionsYesNo", "brandExhibitionsDetails",
    "brandIndustryContribution",
  ],
  4: ["brandSupportingDocumentFiles", "brandMemberBenefits", "brandMemberBenefitOther"],
  5: ["whyJoin", "brandCooperationMethods", "brandCooperationOther"],
  6: ["certifyTrue", "additionalDocumentationConsent", "agreeStandards", "understandReview", "privacyConsent"],
};

export function isOrganizationApplication(category: MembershipCategory) {
  return category === "Business" || category === "Brand";
}

export function getOrganizationStepFields(category: MembershipCategory, step: number) {
  return category === "Business"
    ? businessStepFields[step] ?? []
    : category === "Brand"
      ? brandStepFields[step] ?? []
      : [];
}

export function getOrganizationFields(category: MembershipCategory) {
  const stepFields = category === "Business" ? businessStepFields : category === "Brand" ? brandStepFields : {};
  return Array.from(new Set(Object.values(stepFields).flat()));
}
