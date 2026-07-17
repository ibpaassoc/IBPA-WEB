"use client";

import React from "react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";

import { ApplicationFileUploadField } from "@/components/forms/ApplicationFileUploadField";
import { countryOptions } from "@/constants/countries";
import type { MembershipCategory } from "@/lib/membership";
import { organizationApplicationLabels } from "@/lib/organization-application";

type LocalizedOption = { value: string; en: string; ru: string; uk: string };

type Props = {
  step: number;
  selectedCategory: MembershipCategory;
  isRu: boolean;
  isUk: boolean;
  headlineClassName: string;
  editorialClassName: string;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  renderFieldError: (field: any) => ReactNode;
};

const businessPositionOptions: LocalizedOption[] = [
  { value: "Owner", en: "Owner", ru: "Владелец", uk: "Власник" },
  { value: "CEO", en: "CEO", ru: "CEO", uk: "CEO" },
  { value: "Founder", en: "Founder", ru: "Основатель", uk: "Засновник" },
  { value: "Co-Founder", en: "Co-Founder", ru: "Сооснователь", uk: "Співзасновник" },
  { value: "Director", en: "Director", ru: "Директор", uk: "Директор" },
  { value: "Educator", en: "Educator", ru: "Преподаватель", uk: "Викладач" },
  { value: "Practitioner", en: "Practitioner", ru: "Практикующий специалист", uk: "Практикуючий фахівець" },
  { value: "Other", en: "Other", ru: "Другое", uk: "Інше" },
];

const businessTypeOptions: LocalizedOption[] = [
  { value: "Salon", en: "Salon", ru: "Салон", uk: "Салон" },
  { value: "Studio", en: "Studio", ru: "Студия", uk: "Студія" },
  { value: "Academy", en: "Academy", ru: "Академия", uk: "Академія" },
  { value: "Clinic", en: "Clinic", ru: "Клиника", uk: "Клініка" },
  { value: "Brand", en: "Brand", ru: "Бренд", uk: "Бренд" },
  { value: "Manufacturer", en: "Manufacturer", ru: "Производитель", uk: "Виробник" },
  { value: "Distributor", en: "Distributor", ru: "Дистрибьютор", uk: "Дистриб’ютор" },
  { value: "Beauty Supply", en: "Beauty Supply", ru: "Поставщик beauty-продукции", uk: "Постачальник beauty-продукції" },
  { value: "Spa", en: "Spa", ru: "Спа", uk: "Спа" },
  { value: "Wellness", en: "Wellness", ru: "Wellness", uk: "Wellness" },
  { value: "Other", en: "Other", ru: "Другое", uk: "Інше" },
];

const brandTypeOptions: LocalizedOption[] = [
  { value: "Beauty Brand", en: "Beauty Brand", ru: "Beauty-бренд", uk: "Beauty-бренд" },
  { value: "Manufacturer", en: "Manufacturer", ru: "Производитель", uk: "Виробник" },
  { value: "Distributor", en: "Distributor", ru: "Дистрибьютор", uk: "Дистриб’ютор" },
  { value: "Supplier", en: "Supplier", ru: "Поставщик", uk: "Постачальник" },
  { value: "Beauty Academy Brand", en: "Beauty Academy Brand", ru: "Бренд beauty-академии", uk: "Бренд beauty-академії" },
  { value: "Beauty Technology Company", en: "Beauty Technology Company", ru: "Beauty-tech компания", uk: "Beauty-tech компанія" },
  { value: "Beauty Equipment Manufacturer", en: "Beauty Equipment Manufacturer", ru: "Производитель beauty-оборудования", uk: "Виробник beauty-обладнання" },
  { value: "Cosmetics Manufacturer", en: "Cosmetics Manufacturer", ru: "Производитель косметики", uk: "Виробник косметики" },
  { value: "Skincare Brand", en: "Skincare Brand", ru: "Бренд ухода за кожей", uk: "Бренд догляду за шкірою" },
  { value: "Haircare Brand", en: "Haircare Brand", ru: "Бренд ухода за волосами", uk: "Бренд догляду за волоссям" },
  { value: "Nail Brand", en: "Nail Brand", ru: "Нейл-бренд", uk: "Нейл-бренд" },
  { value: "Lash & Brow Brand", en: "Lash & Brow Brand", ru: "Бренд для ресниц и бровей", uk: "Бренд для вій і брів" },
  { value: "PMU Brand", en: "PMU Brand", ru: "PMU-бренд", uk: "PMU-бренд" },
  { value: "Wellness Brand", en: "Wellness Brand", ru: "Wellness-бренд", uk: "Wellness-бренд" },
  { value: "Spa Brand", en: "Spa Brand", ru: "Спа-бренд", uk: "Спа-бренд" },
  { value: "Service Provider", en: "Service Provider", ru: "Поставщик услуг", uk: "Постачальник послуг" },
  { value: "Marketing Agency", en: "Marketing Agency", ru: "Маркетинговое агентство", uk: "Маркетингова агенція" },
  { value: "Software / CRM", en: "Software / CRM", ru: "Программное обеспечение / CRM", uk: "Програмне забезпечення / CRM" },
  { value: "Other", en: "Other", ru: "Другое", uk: "Інше" },
];

const brandContactPositionOptions: LocalizedOption[] = [
  { value: "Founder", en: "Founder", ru: "Основатель", uk: "Засновник" },
  { value: "CEO", en: "CEO", ru: "CEO", uk: "CEO" },
  { value: "Owner", en: "Owner", ru: "Владелец", uk: "Власник" },
  { value: "Director", en: "Director", ru: "Директор", uk: "Директор" },
  { value: "Marketing Director", en: "Marketing Director", ru: "Директор по маркетингу", uk: "Директор з маркетингу" },
  { value: "Brand Manager", en: "Brand Manager", ru: "Бренд-менеджер", uk: "Бренд-менеджер" },
  { value: "Sales Manager", en: "Sales Manager", ru: "Менеджер по продажам", uk: "Менеджер з продажу" },
  { value: "Other", en: "Other", ru: "Другое", uk: "Інше" },
];

const productCategories: LocalizedOption[] = [
  { value: "Hair", en: "Hair", ru: "Волосы", uk: "Волосся" },
  { value: "Nails", en: "Nails", ru: "Ногти", uk: "Нігті" },
  { value: "Lash", en: "Lash", ru: "Ресницы", uk: "Вії" },
  { value: "Brows", en: "Brows", ru: "Брови", uk: "Брови" },
  { value: "PMU", en: "PMU", ru: "PMU", uk: "PMU" },
  { value: "Skincare", en: "Skincare", ru: "Уход за кожей", uk: "Догляд за шкірою" },
  { value: "Body", en: "Body", ru: "Тело", uk: "Тіло" },
  { value: "Wellness", en: "Wellness", ru: "Wellness", uk: "Wellness" },
  { value: "Spa", en: "Spa", ru: "Спа", uk: "Спа" },
  { value: "Equipment", en: "Equipment", ru: "Оборудование", uk: "Обладнання" },
  { value: "Furniture", en: "Furniture", ru: "Мебель", uk: "Меблі" },
  { value: "Cosmetics", en: "Cosmetics", ru: "Косметика", uk: "Косметика" },
  { value: "Education", en: "Education", ru: "Образование", uk: "Освіта" },
  { value: "Software", en: "Software", ru: "Программное обеспечение", uk: "Програмне забезпечення" },
  { value: "Other", en: "Other", ru: "Другое", uk: "Інше" },
];

const brandCertifications: LocalizedOption[] = [
  ...["ISO", "GMP", "FDA", "CE"].map((value) => ({ value, en: value, ru: value, uk: value })),
  { value: "Vegan", en: "Vegan", ru: "Веган", uk: "Веган" },
  { value: "Cruelty Free", en: "Cruelty Free", ru: "Не тестируется на животных", uk: "Не тестується на тваринах" },
  { value: "Organic", en: "Organic", ru: "Органическая", uk: "Органічна" },
  { value: "Other", en: "Other", ru: "Другое", uk: "Інше" },
];

const cooperationOptions: LocalizedOption[] = [
  { value: "Sponsorship", en: "Sponsorship", ru: "Спонсорство", uk: "Спонсорство" },
  { value: "Educational Webinars", en: "Educational Webinars", ru: "Образовательные вебинары", uk: "Освітні вебінари" },
  { value: "Speaker", en: "Speaker", ru: "Спикер", uk: "Спікер" },
  { value: "Judge Support", en: "Judge Support", ru: "Поддержка судейства", uk: "Підтримка суддівства" },
  { value: "Product Testing", en: "Product Testing", ru: "Тестирование продуктов", uk: "Тестування продуктів" },
  { value: "Product Gifts", en: "Product Gifts", ru: "Подарки продукции", uk: "Подарунки продукції" },
  { value: "Discounts for Members", en: "Discounts for Members", ru: "Скидки для участников", uk: "Знижки для учасників" },
  { value: "Exhibitions", en: "Exhibitions", ru: "Выставки", uk: "Виставки" },
  { value: "Brand Partnerships", en: "Brand Partnerships", ru: "Партнерства брендов", uk: "Партнерства брендів" },
  { value: "Charity Projects", en: "Charity Projects", ru: "Благотворительные проекты", uk: "Благодійні проєкти" },
  { value: "Research", en: "Research", ru: "Исследования", uk: "Дослідження" },
  { value: "Other", en: "Other", ru: "Другое", uk: "Інше" },
];

const benefitOptions: LocalizedOption[] = [
  { value: "Exclusive Discounts", en: "Exclusive Discounts", ru: "Эксклюзивные скидки", uk: "Ексклюзивні знижки" },
  { value: "Gift Certificates", en: "Gift Certificates", ru: "Подарочные сертификаты", uk: "Подарункові сертифікати" },
  { value: "Product Samples", en: "Product Samples", ru: "Образцы продукции", uk: "Зразки продукції" },
  { value: "Educational Materials", en: "Educational Materials", ru: "Образовательные материалы", uk: "Освітні матеріали" },
  { value: "Free Consultations", en: "Free Consultations", ru: "Бесплатные консультации", uk: "Безкоштовні консультації" },
  { value: "Sponsorship of Events", en: "Sponsorship of Events", ru: "Спонсорство мероприятий", uk: "Спонсорство заходів" },
  { value: "Product Donations for Awards", en: "Product Donations for Awards", ru: "Продукция для награждений", uk: "Продукція для нагороджень" },
  { value: "Webinar Support", en: "Webinar Support", ru: "Поддержка вебинаров", uk: "Підтримка вебінарів" },
  { value: "Other", en: "Other", ru: "Другое", uk: "Інше" },
];

export function OrganizationApplicationStep({
  step,
  selectedCategory,
  isRu,
  isUk,
  headlineClassName,
  editorialClassName,
  register,
  watch,
  setValue,
  renderFieldError,
}: Props) {
  const t = React.useCallback(
    (en: string, ru: string, uk: string) => (isRu ? ru : isUk ? uk : en),
    [isRu, isUk],
  );
  const isBusiness = selectedCategory === "Business";
  const valueOf = (name: string) => watch(name);
  const filesOf = (name: string): string[] => {
    const value = valueOf(name);
    return Array.isArray(value) ? value : [];
  };
  const localizedOption = (option: LocalizedOption) => (isRu ? option.ru : isUk ? option.uk : option.en);
  const label = (name: string) => {
    const item = organizationApplicationLabels[name];
    return item ? (isRu ? item.ru : isUk ? item.uk : item.en) : name;
  };

  React.useEffect(() => {
    const requiredFiles = (name: string, minFiles: number, message: string) => {
      register(name, {
        validate: (value: string[]) =>
          (Array.isArray(value) && value.length >= minFiles) || message,
      });
    };

    if (isBusiness) {
      requiredFiles("businessProfilePhotoFiles", 1, t("Upload a professional profile photo.", "Загрузите профессиональное фото профиля.", "Завантажте професійне фото профілю."));
      requiredFiles("businessProfessionalCertificationFiles", 1, t("Upload at least one certification.", "Загрузите хотя бы один сертификат.", "Завантажте принаймні один сертифікат."));
      requiredFiles("businessSupportingDocumentFiles", 1, t("Upload at least one supporting document.", "Загрузите хотя бы один подтверждающий документ.", "Завантажте принаймні один підтверджувальний документ."));
      requiredFiles("businessPortfolioImages", 5, t("Upload at least 5 portfolio images.", "Загрузите минимум 5 примеров работ.", "Завантажте щонайменше 5 прикладів робіт."));
      requiredFiles("businessClientTestimonialFiles", 5, t("Upload at least 5 client testimonials.", "Загрузите минимум 5 отзывов клиентов.", "Завантажте щонайменше 5 відгуків клієнтів."));
    } else {
      requiredFiles("brandReviewFiles", 5, t("Upload at least 5 reviews.", "Загрузите минимум 5 отзывов.", "Завантажте щонайменше 5 відгуків."));
      requiredFiles("brandProductFiles", 1, t("Upload product photos or a catalog.", "Загрузите фото продуктов или каталог.", "Завантажте фото продуктів або каталог."));
      requiredFiles("brandAchievementDocumentFiles", 5, t("Upload at least 5 achievement documents.", "Загрузите минимум 5 документов о достижениях.", "Завантажте щонайменше 5 документів про досягнення."));
      requiredFiles("brandSupportingDocumentFiles", 1, t("Upload at least one supporting document.", "Загрузите хотя бы один подтверждающий документ.", "Завантажте принаймні один підтверджувальний документ."));
    }
  }, [isBusiness, register, t]);

  const field = (
    name: string,
    fieldLabel: string,
    options: { type?: string; required?: boolean; placeholder?: string; className?: string } = {},
  ) => (
    <div className={`space-y-2 ${options.className ?? ""}`}>
      <label className="field-label">{fieldLabel}{options.required === false ? "" : " *"}</label>
      <input
        type={options.type ?? "text"}
        {...register(name, options.required === false ? {} : { required: true })}
        className="form-input"
        placeholder={options.placeholder}
      />
      {renderFieldError(name)}
    </div>
  );

  const textArea = (
    name: string,
    fieldLabel: string,
    options: { required?: boolean; placeholder?: string; rows?: number; className?: string } = {},
  ) => (
    <div className={`space-y-2 ${options.className ?? "md:col-span-2"}`}>
      <label className="field-label">{fieldLabel}{options.required === false ? "" : " *"}</label>
      <textarea
        {...register(name, options.required === false ? {} : { required: true })}
        rows={options.rows ?? 4}
        className="form-input"
        placeholder={options.placeholder}
      />
      {renderFieldError(name)}
    </div>
  );

  const selectField = (name: string, fieldLabel: string, options: LocalizedOption[]) => (
    <div className="space-y-2">
      <label className="field-label">{fieldLabel} *</label>
      <select {...register(name, { required: true })} className="form-input appearance-none">
        <option value="">{t("Select option", "Выберите вариант", "Оберіть варіант")}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{localizedOption(option)}</option>)}
      </select>
      {renderFieldError(name)}
    </div>
  );

  const yesNo = (name: string, fieldLabel: string) => (
    <div className="space-y-2">
      <label className="field-label">{fieldLabel} *</label>
      <select {...register(name, { required: true })} className="form-input appearance-none">
        <option value="">{t("Select answer", "Выберите ответ", "Оберіть відповідь")}</option>
        <option value="Yes">{t("Yes", "Да", "Так")}</option>
        <option value="No">{t("No", "Нет", "Ні")}</option>
      </select>
      {renderFieldError(name)}
    </div>
  );

  const checkboxGroup = (name: string, fieldLabel: string, options: LocalizedOption[]) => (
    <div className="md:col-span-2 rounded-[24px] border border-[#B9D9EB]/50 bg-white/80 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#708090]">{fieldLabel} *</p>
      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 transition-colors hover:border-[#B9D9EB]">
            <input
              type="checkbox"
              value={option.value}
              {...register(name, {
                validate: (value) =>
                  (Array.isArray(value) && value.length > 0) || t("Select at least one option.", "Выберите хотя бы один вариант.", "Оберіть принаймні один варіант."),
              })}
              className="accent-black"
            />
            <span>{localizedOption(option)}</span>
          </label>
        ))}
      </div>
      {renderFieldError(name)}
    </div>
  );

  const upload = (
    name: string,
    fieldLabel: string,
    description: string,
    options: { imageOnly?: boolean; minFiles?: number; maxFiles?: number } = {},
  ) => (
    <ApplicationFileUploadField
      endpoint={options.imageOnly ? "portfolioUploader" : "applicationDocumentUploader"}
      label={fieldLabel}
      description={description}
      value={filesOf(name)}
      onChange={(urls) => setValue(name, urls, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
      accept={options.imageOnly ? "image/*" : ".pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
      chooseLabel={t("Choose files", "Выбрать файлы", "Обрати файли")}
      multiple={(options.maxFiles ?? 10) > 1}
      minFiles={options.minFiles ?? 1}
      maxFiles={options.maxFiles ?? 10}
      imageOnly={options.imageOnly}
      error={renderFieldError(name)}
      dropLabel={t("Drag files here or choose files", "Перетащите файлы сюда или выберите файлы", "Перетягніть файли сюди або оберіть файли")}
      uploadedLabel={t("Uploaded", "Загружено", "Завантажено")}
      minimumLabel={t("Minimum", "Минимум", "Мінімум")}
      limitReachedLabel={t("Limit reached", "Достигнут лимит", "Досягнуто ліміту")}
    />
  );

  const countryField = (name: string, fieldLabel: string) => (
    <div className="space-y-2">
      <label className="field-label">{fieldLabel} *</label>
      <select {...register(name, { required: true })} className="form-input appearance-none">
        <option value="">{t("Select country", "Выберите страну", "Оберіть країну")}</option>
        {countryOptions.map((country) => <option key={country} value={country}>{country}</option>)}
      </select>
      {renderFieldError(name)}
    </div>
  );

  const businessStep = () => {
    switch (step) {
      case 1:
        return <>
          {field("firstName", t("First name", "Имя", "Ім’я"))}
          {field("lastName", t("Last name", "Фамилия", "Прізвище"))}
          {field("preferredName", label("preferredName"), { required: false })}
          {field("dateOfBirth", t("Date of birth", "Дата рождения", "Дата народження"), { type: "date" })}
          {countryField("country", t("Country", "Страна", "Країна"))}
          {field("city", t("City", "Город", "Місто"))}
          {field("phone", t("Phone number", "Телефон", "Телефон"), { type: "tel" })}
          {field("email", t("Email address", "Email", "Email"), { type: "email" })}
          {upload("businessProfilePhotoFiles", label("businessProfilePhotoFiles"), t("Upload a professional headshot.", "Загрузите профессиональный портрет.", "Завантажте професійний портрет."), { imageOnly: true, maxFiles: 1 })}
        </>;
      case 2:
        return <>
          {selectField("businessCurrentPosition", label("businessCurrentPosition"), businessPositionOptions)}
          {valueOf("businessCurrentPosition") === "Other" && field("businessCurrentPositionOther", label("businessCurrentPositionOther"))}
          {selectField("yearsExperience", t("Years of professional experience", "Лет профессионального опыта", "Років професійного досвіду"), [
            { value: "<1", en: "Less than 1 year", ru: "Менее 1 года", uk: "Менше 1 року" },
            { value: "1-2", en: "1-2 years", ru: "1-2 года", uk: "1-2 роки" },
            { value: "3-5", en: "3-5 years", ru: "3-5 лет", uk: "3-5 років" },
            { value: "5-10", en: "5-10 years", ru: "5-10 лет", uk: "5-10 років" },
            { value: "10+", en: "10+ years", ru: "10+ лет", uk: "10+ років" },
          ])}
          {textArea("professionalBiography", label("professionalBiography"), { placeholder: t("Tell us about yourself.", "Расскажите о себе.", "Розкажіть про себе.") })}
          {textArea("professionalExperience", label("professionalExperience"), { placeholder: t("Describe your professional path.", "Опишите свой профессиональный путь.", "Опишіть свій професійний шлях.") })}
          {textArea("professionalEducation", label("professionalEducation"))}
          {textArea("professionalAchievements", label("professionalAchievements"), { placeholder: t("Awards, championships, publications, judging, teaching, speaking, international projects, and brand collaborations.", "Награды, чемпионаты, публикации, судейство, преподавание, выступления, международные проекты и коллаборации.", "Нагороди, чемпіонати, публікації, суддівство, викладання, виступи, міжнародні проєкти та колаборації.") })}
          {upload("businessProfessionalCertificationFiles", label("businessProfessionalCertificationFiles"), t("Upload diplomas, certificates, and licenses.", "Загрузите дипломы, сертификаты и лицензии.", "Завантажте дипломи, сертифікати та ліцензії."))}
        </>;
      case 3:
        return <>
          {field("bizName", t("Business name", "Название бизнеса", "Назва бізнесу"))}
          {selectField("bizType", t("Business type", "Тип бизнеса", "Тип бізнесу"), businessTypeOptions)}
          {valueOf("bizType") === "Other" && field("bizTypeOther", label("bizTypeOther"))}
          {field("bizYear", t("Year established", "Год основания", "Рік заснування"), { type: "number" })}
          {countryField("businessCountry", label("businessCountry"))}
          {field("businessCity", label("businessCity"))}
          {field("businessAddress", label("businessAddress"), { className: "md:col-span-2" })}
          {field("businessWebsite", label("businessWebsite"), { type: "url" })}
          {field("businessInstagram", label("businessInstagram"), { type: "url" })}
          {field("businessFacebook", label("businessFacebook"), { type: "url", required: false })}
          {field("businessTikTok", label("businessTikTok"), { type: "url", required: false })}
          {field("businessLinkedIn", label("businessLinkedIn"), { type: "url", required: false })}
          {field("businessYouTube", label("businessYouTube"), { type: "url", required: false })}
          {field("businessOtherSocial", label("businessOtherSocial"), { required: false })}
          {field("bizTeamSize", t("Number of employees", "Количество сотрудников", "Кількість працівників"), { type: "number" })}
          {textArea("businessDescription", label("businessDescription"))}
          {textArea("bizServices", t("Services / products", "Услуги / продукты", "Послуги / продукти"))}
          {textArea("businessAchievements", label("businessAchievements"))}
          {textArea("businessMission", label("businessMission"))}
          {textArea("businessIndustryContribution", label("businessIndustryContribution"), { placeholder: t("Education, jobs, events, research, manufacturing, or innovation.", "Обучение, рабочие места, мероприятия, исследования, производство или инновации.", "Навчання, робочі місця, заходи, дослідження, виробництво або інновації.") })}
          {upload("businessSupportingDocumentFiles", label("businessSupportingDocumentFiles"), t("Upload a business license, registration, proof of ownership, studio photos, branding, awards, catalog, or other supporting files.", "Загрузите лицензию, регистрацию, подтверждение владения, фото студии, брендинг, награды, каталог или другие документы.", "Завантажте ліцензію, реєстрацію, підтвердження власності, фото студії, брендинг, нагороди, каталог або інші документи."))}
          {upload("businessPortfolioImages", label("businessPortfolioImages"), t("Upload at least 5 examples of work.", "Загрузите минимум 5 примеров работ.", "Завантажте щонайменше 5 прикладів робіт."), { imageOnly: true, minFiles: 5 })}
        </>;
      case 4:
        return <>
          {yesNo("businessMediaFeatured", t("Have you been featured in media?", "Публиковались ли вы в медиа?", "Чи публікували вас у медіа?"))}
          {valueOf("businessMediaFeatured") === "Yes" && textArea("businessMediaDescription", label("businessMediaDescription"))}
          {yesNo("businessPublications", label("businessPublications"))}
          {yesNo("businessSpeakingExperience", label("businessSpeakingExperience"))}
          {yesNo("businessJudgingExperience", label("businessJudgingExperience"))}
          {textArea("businessProfessionalMemberships", label("businessProfessionalMemberships"), { required: false })}
          {upload("businessClientTestimonialFiles", label("businessClientTestimonialFiles"), t("Upload at least 5 client testimonials as PDF or image files.", "Загрузите минимум 5 отзывов клиентов в PDF или изображениях.", "Завантажте щонайменше 5 відгуків клієнтів у PDF або зображеннях."), { minFiles: 5 })}
        </>;
      case 5:
        return <>
          {textArea("whyJoin", t("Why do you want to join IBPA?", "Почему вы хотите вступить в IBPA?", "Чому ви хочете приєднатися до IBPA?"))}
          {textArea("contributionDesc", t("How would you like to contribute to IBPA?", "Как вы хотели бы участвовать в работе IBPA?", "Як ви хотіли б долучитися до роботи IBPA?"))}
        </>;
      default:
        return null;
    }
  };

  const brandStep = () => {
    switch (step) {
      case 1:
        return <>
          {field("brandName", t("Company / brand name", "Название компании / бренда", "Назва компанії / бренду"))}
          {selectField("brandType", t("Company type", "Тип компании", "Тип компанії"), brandTypeOptions)}
          {valueOf("brandType") === "Other" && field("brandTypeOther", t("Other company type", "Другой тип компании", "Інший тип компанії"))}
          {field("brandYear", t("Year established", "Год основания", "Рік заснування"), { type: "number" })}
          {countryField("brandRegistrationCountry", label("brandRegistrationCountry"))}
          {field("brandCity", label("brandCity"))}
          {field("brandAddress", label("brandAddress"), { className: "md:col-span-2" })}
          {field("brandWebsite", label("brandWebsite"), { type: "url" })}
          {field("brandInstagram", label("brandInstagram"), { type: "url" })}
          {field("brandFacebook", label("brandFacebook"), { type: "url", required: false })}
          {field("brandSocialWebsite", label("brandSocialWebsite"), { type: "url" })}
          {field("brandTikTok", label("brandTikTok"), { type: "url", required: false })}
          {field("brandLinkedIn", label("brandLinkedIn"), { type: "url", required: false })}
          {field("brandYouTube", label("brandYouTube"), { type: "url", required: false })}
          {field("brandPinterest", label("brandPinterest"), { type: "url", required: false })}
          {field("brandOtherSocial", label("brandOtherSocial"), { required: false })}
          {field("brandPrimaryContact", label("brandPrimaryContact"))}
          {selectField("brandContactPosition", label("brandContactPosition"), brandContactPositionOptions)}
          {valueOf("brandContactPosition") === "Other" && field("brandContactPositionOther", label("brandContactPositionOther"))}
          {field("brandContactEmail", label("brandContactEmail"), { type: "email" })}
          {field("brandContactPhone", label("brandContactPhone"), { type: "tel" })}
        </>;
      case 2:
        return <>
          {textArea("brandDescription", label("brandDescription"))}
          {textArea("brandMission", label("brandMission"))}
          {textArea("brandValues", label("brandValues"))}
          {textArea("brandProductsServices", label("brandProductsServices"))}
          {upload("brandReviewFiles", label("brandReviewFiles"), t("Upload at least 5 review files.", "Загрузите минимум 5 файлов с отзывами.", "Завантажте щонайменше 5 файлів із відгуками."), { minFiles: 5 })}
          {checkboxGroup("brandProductCategories", label("brandProductCategories"), productCategories)}
          {Array.isArray(valueOf("brandProductCategories")) && valueOf("brandProductCategories").includes("Other") && field("brandProductCategoryOther", label("brandProductCategoryOther"), { className: "md:col-span-2" })}
          {upload("brandProductFiles", label("brandProductFiles"), t("Upload product photos, a product catalog, or both.", "Загрузите фото продуктов, каталог или оба варианта.", "Завантажте фото продуктів, каталог або обидва варіанти."))}
          {textArea("brandCatalogLinks", label("brandCatalogLinks"), { required: false, placeholder: "https://..." })}
          {textArea("brandOperatingCountries", label("brandOperatingCountries"))}
          {selectField("brandEmployeeCount", label("brandEmployeeCount"), ["1-5", "6-10", "11-20", "21-50", "51-100", "100+"].map((value) => ({ value, en: value, ru: value, uk: value })))}
        </>;
      case 3:
        return <>
          {textArea("brandAchievements", label("brandAchievements"), { placeholder: t("Awards, exhibitions, international projects, certifications, patents, innovations, partnerships, or publications.", "Награды, выставки, международные проекты, сертификаты, патенты, инновации, партнерства или публикации.", "Нагороди, виставки, міжнародні проєкти, сертифікати, патенти, інновації, партнерства або публікації.") })}
          {upload("brandAchievementDocumentFiles", label("brandAchievementDocumentFiles"), t("Upload at least 5 documents supporting company achievements.", "Загрузите минимум 5 документов, подтверждающих достижения компании.", "Завантажте щонайменше 5 документів, що підтверджують досягнення компанії."), { minFiles: 5 })}
          {checkboxGroup("brandCertifications", label("brandCertifications"), brandCertifications)}
          {Array.isArray(valueOf("brandCertifications")) && valueOf("brandCertifications").includes("Other") && field("brandCertificationOther", label("brandCertificationOther"), { className: "md:col-span-2" })}
          {yesNo("brandPublicationsYesNo", label("brandPublicationsYesNo"))}
          {valueOf("brandPublicationsYesNo") === "Yes" && textArea("brandPublicationsDetails", label("brandPublicationsDetails"), { placeholder: t("Publications, interviews, and articles.", "Публикации, интервью и статьи.", "Публікації, інтерв’ю та статті.") })}
          {yesNo("brandExhibitionsYesNo", label("brandExhibitionsYesNo"))}
          {valueOf("brandExhibitionsYesNo") === "Yes" && textArea("brandExhibitionsDetails", label("brandExhibitionsDetails"), { placeholder: t("List international exhibitions and events.", "Перечислите международные выставки и мероприятия.", "Перелічіть міжнародні виставки та заходи.") })}
          {textArea("brandIndustryContribution", label("brandIndustryContribution"), { placeholder: t("Education, innovation, research, manufacturing, charity, or support for professionals.", "Обучение, инновации, исследования, производство, благотворительность или поддержка мастеров.", "Навчання, інновації, дослідження, виробництво, благодійність або підтримка майстрів.") })}
        </>;
      case 4:
        return <>
          {upload("brandSupportingDocumentFiles", label("brandSupportingDocumentFiles"), t("Upload company registration, business license, company profile, brand presentation, product catalog, press kit, certificates, awards, marketing materials, brochures, team photos, product photos, or other supporting documents.", "Загрузите регистрацию компании, лицензию, профиль компании, презентацию бренда, каталог, пресс-кит, сертификаты, награды, маркетинговые материалы, брошюры, фото команды, фото продуктов или другие документы.", "Завантажте реєстрацію компанії, ліцензію, профіль компанії, презентацію бренду, каталог, прескіт, сертифікати, нагороди, маркетингові матеріали, брошури, фото команди, фото продуктів або інші документи."))}
          {textArea("brandAdditionalLinks", label("brandAdditionalLinks"), { required: false, placeholder: t("Publications, interviews, media, marketplace, brand videos, or product reviews.", "Публикации, интервью, медиа, маркетплейс, видео бренда или обзоры продуктов.", "Публікації, інтерв’ю, медіа, маркетплейс, відео бренду або огляди продуктів.") })}
          {checkboxGroup("brandMemberBenefits", label("brandMemberBenefits"), benefitOptions)}
          {Array.isArray(valueOf("brandMemberBenefits")) && valueOf("brandMemberBenefits").includes("Other") && field("brandMemberBenefitOther", label("brandMemberBenefitOther"), { className: "md:col-span-2" })}
        </>;
      case 5:
        return <>
          {textArea("whyJoin", t("Why would you like to join IBPA?", "Почему вы хотите вступить в IBPA?", "Чому ви хочете приєднатися до IBPA?"))}
          {checkboxGroup("brandCooperationMethods", label("brandCooperationMethods"), cooperationOptions)}
          {Array.isArray(valueOf("brandCooperationMethods")) && valueOf("brandCooperationMethods").includes("Other") && field("brandCooperationOther", label("brandCooperationOther"), { className: "md:col-span-2" })}
        </>;
      default:
        return null;
    }
  };

  const stepTitles = isBusiness
    ? ["", t("Applicant information", "Информация о заявителе", "Інформація про заявника"), t("Professional information", "Профессиональная информация", "Професійна інформація"), t("Business information", "Информация о бизнесе", "Інформація про бізнес"), t("Public presence", "Публичное присутствие", "Публічна присутність"), t("Motivation", "Мотивация", "Мотивація")]
    : ["", t("Company information", "Информация о компании", "Інформація про компанію"), t("About the company", "О компании", "Про компанію"), t("Brand achievements", "Достижения бренда", "Досягнення бренду"), t("Documents and member benefits", "Документы и преимущества для участников", "Документи та переваги для учасників"), t("Cooperation with IBPA", "Сотрудничество с IBPA", "Співпраця з IBPA")];

  const stepDescriptions = isBusiness
    ? ["", t("Provide the applicant details required for Business Owner Membership.", "Укажите данные заявителя для членства Business Owner.", "Вкажіть дані заявника для членства Business Owner."), t("Tell us about your professional path, education, and achievements.", "Расскажите о профессиональном пути, образовании и достижениях.", "Розкажіть про професійний шлях, освіту та досягнення."), t("Describe the business, its work, mission, and supporting evidence.", "Опишите бизнес, его работу, миссию и подтверждающие материалы.", "Опишіть бізнес, його роботу, місію та підтверджувальні матеріали."), t("Share your public experience, memberships, and client testimonials.", "Расскажите о публичном опыте, членстве и отзывах клиентов.", "Розкажіть про публічний досвід, членство та відгуки клієнтів."), t("Explain why you want to join and how you would contribute.", "Объясните, почему вы хотите вступить и какой вклад готовы внести.", "Поясніть, чому ви хочете приєднатися та який внесок готові зробити.")]
    : ["", t("Provide the company and primary contact details.", "Укажите данные компании и основного контактного лица.", "Вкажіть дані компанії та основної контактної особи."), t("Describe the company, products, values, and market presence.", "Опишите компанию, продукты, ценности и присутствие на рынке.", "Опишіть компанію, продукти, цінності та присутність на ринку."), t("Share achievements, certifications, media, events, and industry contribution.", "Расскажите о достижениях, сертификациях, медиа, мероприятиях и вкладе в индустрию.", "Розкажіть про досягнення, сертифікації, медіа, заходи та внесок в індустрію."), t("Upload supporting documents and select member benefits.", "Загрузите подтверждающие документы и выберите преимущества для участников.", "Завантажте підтверджувальні документи та оберіть переваги для учасників."), t("Tell us why the brand wants to join and how it can cooperate with IBPA.", "Расскажите, почему бренд хочет вступить и как он может сотрудничать с IBPA.", "Розкажіть, чому бренд хоче приєднатися та як він може співпрацювати з IBPA.")];

  return (
    <motion.div key={`organization-${selectedCategory}-${step}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-10">
      <div className="space-y-3">
        <h2 className={`text-3xl md:text-4xl uppercase tracking-tight text-slate-900 ${headlineClassName}`}>{stepTitles[step]}</h2>
        <p className={`text-slate-500 ${editorialClassName}`}>{stepDescriptions[step]}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">{isBusiness ? businessStep() : brandStep()}</div>
    </motion.div>
  );
}
