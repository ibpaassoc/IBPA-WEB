"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Globe,
  GraduationCap,
  Link as LinkIcon,
  Send,
  ShieldCheck,
  Star,
  User,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { countryOptions } from "@/constants/countries";
import { cyrillicDisplay, cyrillicEditorial } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import {
  buildApplyHref,
  getMembershipCategory,
  membershipConfigById,
  membershipConfigs,
  MembershipCategory,
} from "@/lib/membership";
import { getBackendUrl } from "@/lib/public-urls";
import { useI18n } from "@/lib/i18n";

type FormData = {
  portfolioImages: string[];
  membershipCategory: MembershipCategory;
  applicantType: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  phone: string;
  citizenship: string;
  streetAddress?: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  currentPosition: string;
  yearsExperience: string;
  professionalDesc: string;
  workSetting: string;
  placeOfWork?: string;
  workingJurisdictions: string;
  educationDesc: string;
  schoolName?: string;
  educationDates?: string;
  hasLicense: "Yes" | "No" | "Not required";
  licenseNumber?: string;
  additionalEducation?: string;
  specialization: string[];
  studentSchool?: string;
  studentProgName?: string;
  studentStartDate?: string;
  studentEndDate?: string;
  studentMotivation?: string;
  educatorRole?: string;
  educatorSubjects?: string;
  educatorYears?: string;
  educatorFormat?: "Offline" | "Online" | "Both";
  studentCount?: string;
  bizName?: string;
  bizType?: string;
  bizYear?: string;
  bizTeamSize?: string;
  bizServices?: string;
  brandName?: string;
  brandYear?: string;
  brandMarket?: string;
  brandType?: string;
  achievementsYesNo?: "Yes" | "No";
  achievementsDesc?: string;
  competitionsYesNo?: "Yes" | "No";
  competitionName?: string;
  competitionYear?: string;
  competitionResult?: string;
  speakerEducatorJudge?: "Yes" | "No";
  publicationsYesNo?: "Yes" | "No";
  publicationsLinks?: string;
  professionalCommunityYesNo?: "Yes" | "No";
  otherOrganizationsYesNo?: "Yes" | "No";
  otherOrganizationName?: string;
  otherOrganizationStatus?: string;
  otherOrganizationYears?: string;
  instagramLink: string;
  websiteLink?: string;
  linkedinLink?: string;
  portfolioLink?: string;
  whyJoin: string;
  contributionDesc: string;
  certifyTrue: boolean;
  understandReview: boolean;
  agreeStandards: boolean;
  privacyConsent: boolean;
  legalName: string;
  signature: string;
};

const STEPS = [
  { id: "category", title: { en: "Category", ru: "Категория", uk: "Категорія" }, icon: <Star size={18} /> },
  { id: "contact", title: { en: "Contact", ru: "Контакты", uk: "Контакти" }, icon: <User size={18} /> },
  { id: "profile", title: { en: "Profile", ru: "Профиль", uk: "Профіль" }, icon: <Briefcase size={18} /> },
  { id: "credentials", title: { en: "Credentials", ru: "Квалификация", uk: "Кваліфікація" }, icon: <GraduationCap size={18} /> },
  { id: "details", title: { en: "Details", ru: "Детали", uk: "Деталі" }, icon: <Globe size={18} /> },
  { id: "motivation", title: { en: "Motivation", ru: "Мотивация", uk: "Мотивація" }, icon: <LinkIcon size={18} /> },
  { id: "confirm", title: { en: "Confirm", ru: "Подтверждение", uk: "Підтвердження" }, icon: <FileCheck size={18} /> },
];

const specializationOptions = [
  { value: "Brow Artist", en: "Brow Artist", ru: "Бровист", uk: "Бровіст" },
  { value: "Lash Artist", en: "Lash Artist", ru: "Лэшмейкер", uk: "Лешмейкер" },
  { value: "Makeup Artist", en: "Makeup Artist", ru: "Визажист", uk: "Візажист" },
  { value: "Esthetician", en: "Esthetician", ru: "Эстетист", uk: "Естетист" },
  { value: "PMU Artist", en: "PMU Artist", ru: "PMU-специалист", uk: "PMU-фахівець" },
  { value: "Nail Technician", en: "Nail Technician", ru: "Нейл-специалист", uk: "Нейл-фахівець" },
  { value: "Hair Professional", en: "Hair Professional", ru: "Парикмахер", uk: "Перукар" },
  { value: "Cosmetologist", en: "Cosmetologist", ru: "Косметолог", uk: "Косметолог" },
  { value: "Salon Owner", en: "Salon Owner", ru: "Владелец салона", uk: "Власник салону" },
  { value: "Educator", en: "Educator", ru: "Преподаватель", uk: "Викладач" },
  { value: "Other", en: "Other", ru: "Другое", uk: "Інше" },
];

const APPLY_DRAFT_KEY = "ibpa-application-draft";
const SubmittedState = dynamic(
  () => import("./components/SubmittedState").then((mod) => mod.SubmittedState),
  { ssr: false },
);
const DetailsStep = dynamic(
  () => import("./components/DetailsStep").then((mod) => mod.DetailsStep),
  { ssr: false },
);
const MotivationStep = dynamic(
  () => import("./components/MotivationStep").then((mod) => mod.MotivationStep),
  { ssr: false },
);
const ConfirmStep = dynamic(
  () => import("./components/ConfirmStep").then((mod) => mod.ConfirmStep),
  { ssr: false },
);

const fieldLabels: Record<keyof FormData, { en: string; ru: string; uk: string }> = {
  portfolioImages: { en: "Portfolio images", ru: "Фото работ", uk: "Фото робіт" },
  membershipCategory: { en: "Membership category", ru: "Категория участия", uk: "Категорія участі" },
  applicantType: { en: "Applicant type", ru: "Тип заявителя", uk: "Тип заявника" },
  firstName: { en: "First name", ru: "Имя", uk: "Ім’я" },
  lastName: { en: "Last name", ru: "Фамилия", uk: "Прізвище" },
  dateOfBirth: { en: "Date of birth", ru: "Дата рождения", uk: "Дата народження" },
  email: { en: "Email", ru: "Email", uk: "Email" },
  phone: { en: "Phone number", ru: "Телефон", uk: "Телефон" },
  citizenship: { en: "Citizenship", ru: "Гражданство", uk: "Громадянство" },
  streetAddress: { en: "Street address", ru: "Улица и адрес", uk: "Вулиця та адреса" },
  city: { en: "City", ru: "Город", uk: "Місто" },
  state: { en: "State / Region", ru: "Штат / регион", uk: "Штат / регіон" },
  zipCode: { en: "ZIP / Postal code", ru: "ZIP / индекс", uk: "ZIP / індекс" },
  country: { en: "Country", ru: "Страна", uk: "Країна" },
  currentPosition: { en: "Expert role in the industry", ru: "Экспертная роль в индустрии", uk: "Експертна роль в індустрії" },
  yearsExperience: { en: "Years of experience", ru: "Опыт работы", uk: "Досвід роботи" },
  professionalDesc: { en: "Professional description", ru: "Профессиональное описание", uk: "Професійний опис" },
  workSetting: { en: "Work setting", ru: "Формат работы", uk: "Формат роботи" },
  placeOfWork: { en: "Place of work", ru: "Место работы", uk: "Місце роботи" },
  workingJurisdictions: { en: "Working jurisdictions", ru: "Где вы работаете", uk: "Де ви працюєте" },
  educationDesc: { en: "Professional training and qualifications", ru: "Профессиональная подготовка и полученные квалификации", uk: "Професійна підготовка та отримані кваліфікації" },
  schoolName: { en: "Key educational program / lead educator", ru: "Ключевая образовательная программа / ведущий преподаватель", uk: "Ключова освітня програма / провідний викладач" },
  educationDates: { en: "Education dates", ru: "Даты обучения", uk: "Дати навчання" },
  hasLicense: { en: "Professional license", ru: "Профессиональная лицензия", uk: "Професійна ліцензія" },
  licenseNumber: { en: "License number", ru: "Номер лицензии", uk: "Номер ліцензії" },
  additionalEducation: { en: "Additional professional qualifications", ru: "Дополнительные профессиональные квалификации", uk: "Додаткові професійні кваліфікації" },
  specialization: { en: "Specialization", ru: "Специализация", uk: "Спеціалізація" },
  studentSchool: { en: "School / Academy", ru: "Школа / академия", uk: "Школа / академія" },
  studentProgName: { en: "Program name", ru: "Название программы", uk: "Назва програми" },
  studentStartDate: { en: "Start date", ru: "Дата начала", uk: "Дата початку" },
  studentEndDate: { en: "Expected graduation", ru: "Ожидаемая дата окончания", uk: "Очікувана дата завершення" },
  studentMotivation: { en: "Specialist motivation", ru: "Почему вы подаете заявку сейчас?", uk: "Чому ви подаєте заявку зараз?" },
  educatorRole: { en: "Educator role", ru: "Роль преподавателя", uk: "Роль викладача" },
  educatorSubjects: { en: "Subjects taught", ru: "Какие дисциплины вы преподаете", uk: "Які дисципліни ви викладаєте" },
  educatorYears: { en: "Teaching years", ru: "Опыт преподавания", uk: "Досвід викладання" },
  educatorFormat: { en: "Training format", ru: "Формат обучения", uk: "Формат навчання" },
  studentCount: { en: "Approximate student count", ru: "Примерное число студентов", uk: "Приблизна кількість студентів" },
  bizName: { en: "Business name", ru: "Название бизнеса", uk: "Назва бізнесу" },
  bizType: { en: "Business type", ru: "Тип бизнеса", uk: "Тип бізнесу" },
  bizYear: { en: "Year established", ru: "Год основания", uk: "Рік заснування" },
  bizTeamSize: { en: "Team size", ru: "Размер команды", uk: "Розмір команди" },
  bizServices: { en: "Main services", ru: "Основные услуги", uk: "Основні послуги" },
  brandName: { en: "Brand / company name", ru: "Название бренда / компании", uk: "Назва бренду / компанії" },
  brandYear: { en: "Year established", ru: "Год основания", uk: "Рік заснування" },
  brandMarket: { en: "Market / geography", ru: "Рынок / география", uk: "Ринок / географія" },
  brandType: { en: "Brand type", ru: "Тип бренда", uk: "Тип бренду" },
  achievementsYesNo: { en: "Professional achievements", ru: "Профессиональные достижения", uk: "Професійні досягнення" },
  achievementsDesc: { en: "Describe your achievements", ru: "Опишите ваши достижения", uk: "Опишіть ваші досягнення" },
  competitionsYesNo: { en: "Competition participation", ru: "Участие в чемпионатах / конкурсах", uk: "Участь у чемпіонатах / конкурсах" },
  competitionName: { en: "Competition name", ru: "Название конкурса", uk: "Назва конкурсу" },
  competitionYear: { en: "Competition year", ru: "Год участия", uk: "Рік участі" },
  competitionResult: { en: "Competition result", ru: "Результат", uk: "Результат" },
  speakerEducatorJudge: { en: "Speaker / educator / judge", ru: "Спикер / преподаватель / судья", uk: "Спікер / викладач / суддя" },
  publicationsYesNo: { en: "Publications and media", ru: "Публикации и медиа", uk: "Публікації та медіа" },
  publicationsLinks: { en: "Publication links", ru: "Ссылки на публикации", uk: "Посилання на публікації" },
  professionalCommunityYesNo: { en: "Professional community participation", ru: "Участие в профессиональном сообществе", uk: "Участь у професійній спільноті" },
  otherOrganizationsYesNo: { en: "Other professional organizations", ru: "Другие профессиональные организации", uk: "Інші професійні організації" },
  otherOrganizationName: { en: "Organization name", ru: "Название организации", uk: "Назва організації" },
  otherOrganizationStatus: { en: "Membership status", ru: "Статус членства", uk: "Статус членства" },
  otherOrganizationYears: { en: "Membership years", ru: "Годы членства", uk: "Роки членства" },
  instagramLink: { en: "Instagram / social profile", ru: "Instagram / соцсети", uk: "Instagram / соцмережі" },
  websiteLink: { en: "Website link", ru: "Ссылка на сайт", uk: "Посилання на сайт" },
  linkedinLink: { en: "LinkedIn profile", ru: "Профиль LinkedIn", uk: "Профіль LinkedIn" },
  portfolioLink: { en: "Portfolio link", ru: "Ссылка на портфолио", uk: "Посилання на портфоліо" },
  whyJoin: { en: "Why join IBPA", ru: "Почему вы хотите вступить в IBPA?", uk: "Чому ви хочете приєднатися до IBPA?" },
  contributionDesc: { en: "Industry contribution", ru: "Вклад в индустрию", uk: "Внесок в індустрію" },
  certifyTrue: { en: "Accuracy confirmation", ru: "Подтверждение точности", uk: "Підтвердження точності" },
  understandReview: { en: "Review acknowledgement", ru: "Подтверждение понимания этапа рассмотрения", uk: "Підтвердження розуміння етапу розгляду" },
  agreeStandards: { en: "Standards agreement", ru: "Согласие со стандартами", uk: "Згода зі стандартами" },
  privacyConsent: { en: "Privacy consent", ru: "Согласие на обработку данных", uk: "Згода на обробку даних" },
  legalName: { en: "Full legal name", ru: "Полное юридическое имя", uk: "Повне юридичне ім’я" },
  signature: { en: "Electronic signature", ru: "Электронная подпись", uk: "Електронний підпис" },
};

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (!digits) return "";

  if (digits[0] === "1") {
    const country = digits.slice(0, 1);
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7, 11);

    if (digits.length <= 1) return `+${country}`;
    if (digits.length <= 4) return `+${country} (${area}`;
    if (digits.length <= 7) return `+${country} (${area}) ${prefix}`;
    return `+${country} (${area}) ${prefix}-${line}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function getPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

const professionalAchievementFields: (keyof FormData)[] = [
  "achievementsYesNo",
  "achievementsDesc",
  "competitionsYesNo",
  "competitionName",
  "competitionYear",
  "competitionResult",
  "speakerEducatorJudge",
  "publicationsYesNo",
  "publicationsLinks",
];

const industryContributionFields: (keyof FormData)[] = [
  "professionalCommunityYesNo",
  "otherOrganizationsYesNo",
  "otherOrganizationName",
  "otherOrganizationStatus",
  "otherOrganizationYears",
];

function getCategorySpecificFields(category: MembershipCategory): (keyof FormData)[] {
  switch (category) {
    case "Specialist":
      return ["portfolioImages", "studentSchool", "studentProgName", "studentEndDate", "studentMotivation"];
    case "Professional":
      return ["portfolioImages", "workingJurisdictions", ...professionalAchievementFields];
    case "Trainer":
      return ["portfolioImages", "educatorRole", "educatorSubjects", "educatorYears", "educatorFormat", "studentCount", ...professionalAchievementFields];
    case "Business":
      return ["bizName", "bizType", "bizYear", "bizTeamSize", "bizServices", ...professionalAchievementFields];
    case "Brand":
      return ["brandName", "brandYear", "brandMarket", "brandType"];
    default:
      return [];
  }
}

function requiresLicenseNumber(category: MembershipCategory) {
  return category !== "Specialist";
}

function getStepFields(step: number, category: MembershipCategory): (keyof FormData)[] {
  switch (step) {
    case 0:
      return ["membershipCategory"];
    case 1:
      return category === "Specialist" || category === "Professional" || category === "Trainer"
        ? ["firstName", "lastName", "dateOfBirth", "email", "phone", "citizenship", "city", "country"]
        : ["firstName", "lastName", "email", "phone", "citizenship", "city", "country"];
    case 2:
      return ["currentPosition", "yearsExperience", "professionalDesc", "workSetting"];
    case 3:
      return requiresLicenseNumber(category) ? ["educationDesc", "hasLicense", "licenseNumber"] : ["educationDesc", "hasLicense"];
    case 4:
      return getCategorySpecificFields(category);
    case 5:
      return category === "Professional" || category === "Trainer" || category === "Business"
        ? category === "Business"
          ? ["instagramLink", "websiteLink", "whyJoin", "contributionDesc", ...industryContributionFields]
          : ["instagramLink", "portfolioLink", "whyJoin", "contributionDesc", ...industryContributionFields]
        : category === "Brand"
          ? ["instagramLink", "websiteLink", "whyJoin", "contributionDesc"]
          : ["instagramLink", "portfolioLink", "whyJoin", "contributionDesc"];
    case 6:
      return ["certifyTrue", "understandReview", "agreeStandards", "privacyConsent", "legalName", "signature"];
    default:
      return [];
  }
}

export default function ApplyPage() {
  const { locale } = useI18n();
  const isRu = locale === "ru";
  const isUk = locale === "uk";
  const useEnglishTypography = true;
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const editorialClassName = useEnglishTypography ? "font-sans italic" : `${cyrillicEditorial.className} italic`;
  const [currentStep, setCurrentStep] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [honeypot, setHoneypot] = React.useState("");
  const isFinalStep = currentStep === STEPS.length - 1;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    getFieldState,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      membershipCategory: "Specialist",
      applicantType: membershipConfigById.Specialist.applicantType,
      portfolioImages: [],
      specialization: [],
      hasLicense: "Yes",
    },
  });

  const selectedCategory = watch("membershipCategory");
  const selectedConfig = membershipConfigById[selectedCategory] || membershipConfigById.Specialist;
  const selectedConfigTitle = isRu ? selectedConfig.titleRu : isUk ? selectedConfig.titleUk : selectedConfig.title;
  const selectedConfigShortTitle = isRu ? selectedConfig.shortTitleRu : isUk ? selectedConfig.shortTitleUk : selectedConfig.shortTitle;
  const selectedConfigSummary = isRu ? selectedConfig.summaryRu : isUk ? selectedConfig.summaryUk : selectedConfig.summary;
  const localizedApplicantType =
    selectedConfig.applicantType === "Individual"
      ? isRu
        ? "Частное лицо"
        : isUk
          ? "Приватна особа"
        : "Individual"
      : selectedConfig.applicantType === "Business"
        ? isRu
          ? "Бизнес"
          : isUk
            ? "Бізнес"
          : "Business"
        : selectedConfig.applicantType === "School"
          ? isRu
            ? "Школа"
            : isUk
              ? "Школа"
            : "School"
          : isRu
            ? "Бренд"
            : isUk
              ? "Бренд"
            : "Brand";

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedDraft = window.localStorage.getItem(APPLY_DRAFT_KEY);
    if (!savedDraft) {
      return;
    }

    try {
      const parsedDraft = JSON.parse(savedDraft) as Partial<FormData>;
      const draftCategory = getMembershipCategory(parsedDraft.membershipCategory);
      reset(
        {
          applicantType: membershipConfigById.Specialist.applicantType,
          portfolioImages: [],
          specialization: [],
          hasLicense: "Yes",
          ...parsedDraft,
          membershipCategory: draftCategory || "Specialist",
        },
        { keepDefaultValues: true },
      );
    } catch {
      window.localStorage.removeItem(APPLY_DRAFT_KEY);
    }
  }, [reset]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = getMembershipCategory(params.get("category"));
    if (!category) {
      return;
    }

    setValue("membershipCategory", category, { shouldDirty: false, shouldTouch: false });
  }, [setValue]);

  React.useEffect(() => {
    setValue("applicantType", (membershipConfigById[selectedCategory] || membershipConfigById.Specialist).applicantType, {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [selectedCategory, setValue]);

  React.useEffect(() => {
    const subscription = watch((value) => {
      if (typeof window === "undefined" || submitted) {
        return;
      }

      window.localStorage.setItem(APPLY_DRAFT_KEY, JSON.stringify(value));
    });

    return () => subscription.unsubscribe();
  }, [submitted, watch]);

  const portfolioImages = watch("portfolioImages") || [];

  React.useEffect(() => {
    register("portfolioImages", {
      validate: (value: string[]) => {
        const requiresPortfolio =
          selectedCategory === "Specialist" ||
          selectedCategory === "Professional" ||
          selectedCategory === "Trainer";

        if (!requiresPortfolio) {
          return true;
        }

        if (!Array.isArray(value) || value.length < 5) {
          return isRu
            ? "Загрузите минимум 5 изображений примеров работ."
            : isUk
              ? "Завантажте щонайменше 5 зображень прикладів робіт."
              : "Upload at least 5 sample work images.";
        }

        if (value.length > 10) {
          return isRu
            ? "Можно загрузить максимум 10 изображений."
            : isUk
              ? "Можна завантажити максимум 10 зображень."
              : "You can upload up to 10 images.";
        }

        return true;
      },
    });
  }, [isRu, isUk, register, selectedCategory]);

  const getFieldLabel = React.useCallback(
    (field: keyof FormData) => (isRu ? fieldLabels[field].ru : isUk ? fieldLabels[field].uk : fieldLabels[field].en),
    [isRu, isUk],
  );

  const renderFieldError = React.useCallback(
    (field: keyof FormData) => {
      const message =
        errors[field]?.message ||
        (errors[field]?.type === "required"
          ? isRu
            ? "Это поле обязательно."
            : isUk
              ? "Це поле обов’язкове."
              : "This field is required."
          : undefined);
      if (!message) {
        return null;
      }

      return <p className="field-error">{message}</p>;
    },
    [errors, isRu, isUk],
  );

  const nextStep = async () => {
    const fields = getStepFields(currentStep, selectedCategory);
    const isValid = await trigger(fields, { shouldFocus: true });

    if (!isValid) {
      const missingFields = fields.filter((field) => getFieldState(field).invalid);
      const missingLabelList = missingFields.map(getFieldLabel).join(", ");

      toast.error(
        isRu
          ? `Заполните обязательные поля: ${missingLabelList}.`
          : isUk
            ? `Заповніть обов’язкові поля: ${missingLabelList}.`
          : `Please complete the required fields: ${missingLabelList}.`,
      );
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: FormData) => {
    if (!isFinalStep) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          package: data.membershipCategory,
          applicantType: data.applicantType,
          application: data,
          honeypot,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit application");
      }

      const { default: confetti } = await import("canvas-confetti");
      confetti({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#B9D9EB", "#708090", "#FFFFFF"],
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(APPLY_DRAFT_KEY);
      }
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error(
        isRu
          ? "Не удалось отправить заявку. Пожалуйста, попробуйте еще раз."
          : isUk
            ? "Не вдалося надіслати заявку. Будь ласка, спробуйте ще раз."
            : "We couldn't submit your application. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SubmittedState
        isRu={isRu}
        isUk={isUk}
        headlineClassName={headlineClassName}
        editorialClassName={editorialClassName}
        selectedConfigShortTitle={selectedConfigShortTitle}
        selectedConfigTitle={selectedConfigTitle}
        localizedApplicantType={localizedApplicantType}
        selectedPrice={selectedConfig.price}
      />
    );
  }

  return (
    <div className="bg-white min-h-screen selection:bg-[#B9D9EB] selection:text-black pb-24">
      <section className="relative min-h-[44vh] flex items-center justify-center overflow-hidden bg-[#F1F3F5]">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1733222013409-fdf64cae08de?q=80&w=2000"
            className="w-full h-full object-cover grayscale-[0.4] opacity-20 mix-blend-multiply"
            alt="Application background"
          />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16 text-center space-y-6">
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#708090]">{isRu ? "Заявка в сообщество" : isUk ? "Заявка до спільноти" : "Membership application"}</p>
          <h1 className={`text-6xl sm:text-7xl md:text-9xl uppercase leading-[0.92] text-slate-900 ${headlineClassName}`}>
            {isRu ? <>Подать заявку в <span className="text-[#72A0C1]">IBPA</span></> : isUk ? <>Подати заявку до <span className="text-[#72A0C1]">IBPA</span></> : <>Apply for <span className="text-[#72A0C1]">IBPA</span></>}
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 font-light leading-relaxed">
            {isRu
              ? "Выберите тариф или пакет участия, пройдите соответствующие этапы рассмотрения и отправьте профиль, который соответствует вашей роли в бьюти-индустрии."
              : isUk
                ? "Оберіть тариф або пакет участі, пройдіть відповідні етапи розгляду й надішліть профіль, що відповідає вашій ролі в б’юті-індустрії."
              : "Choose your membership category, complete the relevant review steps, and submit a profile that matches your role in the beauty industry."}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[40px] shadow-2xl p-4 md:p-8 flex justify-between gap-3 overflow-x-auto no-scrollbar">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center gap-2 min-w-20">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index === currentStep
                    ? "bg-black text-white scale-110 shadow-lg"
                    : index < currentStep
                      ? "bg-[#B9D9EB] text-white"
                      : "bg-slate-100 text-slate-300"
                }`}
              >
                {index < currentStep ? <CheckCircle2 size={18} /> : step.icon}
              </div>
              <span className={`hidden md:block text-[10px] font-bold uppercase tracking-widest ${index === currentStep ? "text-black" : "text-slate-400"}`}>
                {isRu ? step.title.ru : isUk ? step.title.uk : step.title.en}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12 md:mt-20 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !(event.target instanceof HTMLTextAreaElement)
            ) {
              event.preventDefault();
            }
          }}
          className="space-y-12 bg-[#F1F3F5] p-8 md:p-14 rounded-[56px] border border-slate-200 shadow-sm"
        >
          <div className="hidden" aria-hidden="true">
            <label htmlFor="company-website">Company website</label>
            <input
              id="company-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div key="category" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-10">
                <div className="space-y-3">
                  <h2 className={`text-3xl md:text-4xl uppercase tracking-tight text-slate-900 ${headlineClassName}`}>{isRu ? "Выберите тариф или пакет" : isUk ? "Оберіть тариф або пакет" : "Choose your membership path"}</h2>
                  <p className={`text-slate-500 ${editorialClassName}`}>
                    {isRu
                      ? "Начните с категории, которая лучше всего отражает вашу текущую роль. Мы адаптируем следующие шаги заявки под нее."
                      : isUk
                        ? "Почніть із категорії, яка найкраще відображає вашу поточну роль. Ми адаптуємо наступні кроки заявки під неї."
                      : "Start with the category that best reflects your current role. We will adapt the next steps of the application accordingly."}
                  </p>
                </div>

                <div className="grid gap-3">
                  {membershipConfigs.map((config) => (
                    <label
                      key={config.id}
                      className={`block rounded-[26px] border-2 p-4 md:p-5 cursor-pointer transition-all ${
                        selectedCategory === config.id
                          ? "bg-white border-[#B9D9EB] shadow-lg"
                          : "border-slate-200 bg-transparent hover:border-[#B9D9EB]/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <input
                            type="radio"
                            value={config.id}
                            {...register("membershipCategory", { required: true })}
                            className="mt-1 w-4 h-4 accent-black"
                          />
                          <div className="space-y-1.5">
                            <p className={`text-xl md:text-2xl uppercase leading-none text-slate-900 ${headlineClassName}`}>{isRu ? config.titleRu : isUk ? config.titleUk : config.title}</p>
                            <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-2xl">{isRu ? config.summaryRu : isUk ? config.summaryUk : config.summary}</p>
                            <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                              {isRu ? "Тип заявки" : isUk ? "Тип заявки" : "Application type"}: {config.applicantType === "Individual" ? (isRu ? "Частное лицо" : isUk ? "Приватна особа" : "Individual") : config.applicantType === "Business" ? (isRu ? "Бизнес" : isUk ? "Бізнес" : "Business") : config.applicantType === "School" ? (isRu ? "Школа" : isUk ? "Школа" : "School") : (isRu ? "Бренд" : isUk ? "Бренд" : "Brand")}
                            </p>
                          </div>
                        </div>
                            <p className={`shrink-0 text-2xl leading-none text-[#72A0C1] md:text-3xl ${headlineClassName}`}>{config.price}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="rounded-[32px] bg-white p-6 border border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#708090]">{isRu ? "Что происходит после отправки" : isUk ? "Що відбувається після надсилання" : "What happens after submission"}</p>
                  <p className="mt-3 text-slate-600 leading-relaxed">
                    {isRu
                      ? "Вашу заявку рассматривает комиссия по отбору. Если она будет одобрена, мы отправим вам инструкции по оплате и активации на электронную почту. В этом процессе нет лишних промежуточных шагов."
                      : isUk
                        ? "Вашу заявку розглядає комісія з відбору. Якщо її буде схвалено, ми надішлемо вам інструкції щодо оплати та активації електронною поштою. У цьому процесі немає зайвих проміжних кроків."
                      : "Your application is reviewed by the Membership Review Board. If approved, we email you the next activation and payment instructions. There are no extra detours in this flow."}
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div key="contact" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-10">
                <div className="space-y-3">
                  <h2 className={`text-3xl md:text-4xl uppercase tracking-tight text-slate-900 ${headlineClassName}`}>{isRu ? "Контактные данные заявителя" : isUk ? "Контактні дані заявника" : "Applicant contact details"}</h2>
                  <p className={`text-slate-500 ${editorialClassName}`}>{isRu ? "Используйте контактные данные человека или компании, которые должны получать обновления по заявке." : isUk ? "Використовуйте контактні дані людини або компанії, які мають отримувати оновлення щодо заявки." : "Use the person or company contact details that should receive review updates."}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Имя" : isUk ? "Ім’я" : "First Name"} *</label>
                    <input {...register("firstName", { required: isRu ? "Введите имя." : isUk ? "Введіть ім’я." : "Enter your first name." })} className="form-input" placeholder={isRu ? "Имя" : isUk ? "Ім’я" : "First name"} />
                    {renderFieldError("firstName")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Фамилия" : isUk ? "Прізвище" : "Last Name"} *</label>
                    <input {...register("lastName", { required: isRu ? "Введите фамилию." : isUk ? "Введіть прізвище." : "Enter your last name." })} className="form-input" placeholder={isRu ? "Фамилия" : isUk ? "Прізвище" : "Last name"} />
                    {renderFieldError("lastName")}
                  </div>
                  {(selectedCategory === "Specialist" || selectedCategory === "Professional" || selectedCategory === "Trainer") && (
                    <div className="space-y-2">
                      <label className="field-label">{isRu ? "Дата рождения" : isUk ? "Дата народження" : "Date of Birth"} *</label>
                      <input
                        type="date"
                        {...register("dateOfBirth", {
                          required: isRu ? "Введите дату рождения." : isUk ? "Введіть дату народження." : "Enter your date of birth.",
                        })}
                        className="form-input"
                      />
                      {renderFieldError("dateOfBirth")}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Email" : isUk ? "Email" : "Email Address"} *</label>
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      {...register("email", {
                        required: isRu ? "Введите email." : isUk ? "Введіть email." : "Enter your email.",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: isRu ? "Введите корректный email." : isUk ? "Введіть коректний email." : "Enter a valid email address.",
                        },
                        setValueAs: (value: string) => value.trim().toLowerCase(),
                      })}
                      className="form-input"
                      placeholder="email@example.com"
                    />
                    {renderFieldError("email")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Телефон" : isUk ? "Телефон" : "Phone Number"} *</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      {...register("phone", {
                        required: isRu ? "Введите номер телефона." : isUk ? "Введіть номер телефону." : "Enter your phone number.",
                        validate: (value) =>
                          getPhoneDigits(value).length >= 10 || (isRu ? "Введите корректный номер телефона." : isUk ? "Введіть коректний номер телефону." : "Enter a valid phone number."),
                        onChange: (event) => {
                          event.target.value = formatPhoneNumber(event.target.value);
                        },
                      })}
                      className="form-input"
                      placeholder="+1 (234) 567-8901"
                    />
                    {renderFieldError("phone")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Гражданство" : isUk ? "Громадянство" : "Citizenship"} *</label>
                    <select {...register("citizenship", { required: isRu ? "Выберите гражданство." : isUk ? "Оберіть громадянство." : "Select your citizenship." })} className="form-input appearance-none">
                      <option value="">{isRu ? "Выберите страну" : isUk ? "Оберіть країну" : "Select country"}</option>
                      {countryOptions.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {renderFieldError("citizenship")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Страна" : isUk ? "Країна" : "Country"} *</label>
                    <select {...register("country", { required: isRu ? "Выберите страну проживания." : isUk ? "Оберіть країну проживання." : "Select your country of residence." })} className="form-input appearance-none">
                      <option value="">{isRu ? "Выберите страну" : isUk ? "Оберіть країну" : "Select country"}</option>
                      {countryOptions.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {renderFieldError("country")}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="field-label">{isRu ? "Улица и адрес" : isUk ? "Вулиця та адреса" : "Street Address"}</label>
                    <input {...register("streetAddress")} className="form-input" placeholder={isRu ? "Улица и адрес" : isUk ? "Вулиця та адреса" : "Street address"} />
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Город" : isUk ? "Місто" : "City"} *</label>
                    <input {...register("city", { required: isRu ? "Введите город." : isUk ? "Введіть місто." : "Enter your city." })} className="form-input" placeholder={isRu ? "Город" : isUk ? "Місто" : "City"} />
                    {renderFieldError("city")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Штат / регион" : isUk ? "Штат / регіон" : "State / Region"}</label>
                    <input {...register("state")} className="form-input" placeholder={isRu ? "Штат / регион" : isUk ? "Штат / регіон" : "State / region"} />
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "ZIP / индекс" : isUk ? "ZIP / індекс" : "ZIP / Postal Code"}</label>
                    <input {...register("zipCode")} className="form-input" placeholder={isRu ? "ZIP / индекс" : isUk ? "ZIP / індекс" : "ZIP / postal code"} />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="profile" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-10">
                <div className="space-y-3">
                  <h2 className={`text-3xl md:text-4xl uppercase tracking-tight text-slate-900 ${headlineClassName}`}>{isRu ? "Профессиональный профиль" : isUk ? "Професійний профіль" : "Professional snapshot"}</h2>
                  <p className={`text-slate-500 ${editorialClassName}`}>{isRu ? "Этот блок помогает комиссии быстро понять вашу текущую роль и уровень профессиональной активности." : isUk ? "Цей блок допомагає комісії швидко зрозуміти вашу поточну роль і рівень професійної активності." : "This gives the board a quick picture of your current role and level of activity."}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Экспертная роль в индустрии" : isUk ? "Експертна роль в індустрії" : "Expert role in the industry"} *</label>
                    <select {...register("currentPosition", { required: isRu ? "Выберите экспертную роль." : isUk ? "Оберіть експертну роль." : "Select your expert role." })} className="form-input appearance-none">
                      <option value="">{isRu ? "Выберите роль" : isUk ? "Оберіть роль" : "Select role"}</option>
                      <option value="Expert">{isRu ? "Эксперт" : isUk ? "Експерт" : "Expert"}</option>
                      <option value="Educator">{isRu ? "Преподаватель" : isUk ? "Викладач" : "Educator"}</option>
                      <option value="Specialist">{isRu ? "Специалист" : isUk ? "Фахівець" : "Specialist"}</option>
                    </select>
                    {renderFieldError("currentPosition")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Опыт работы" : isUk ? "Досвід роботи" : "Years of Experience"} *</label>
                    <select {...register("yearsExperience", { required: true })} className="form-input appearance-none">
                      <option value="">{isRu ? "Выберите диапазон" : isUk ? "Оберіть діапазон" : "Select range"}</option>
                      <option value="<1">{isRu ? "Менее 1 года" : isUk ? "Менше 1 року" : "Less than 1 year"}</option>
                      <option value="1-2">{isRu ? "1–2 года" : isUk ? "1–2 роки" : "1–2 years"}</option>
                      <option value="3-5">{isRu ? "3–5 лет" : isUk ? "3–5 років" : "3–5 years"}</option>
                      <option value="5-10">{isRu ? "5–10 лет" : isUk ? "5–10 років" : "5–10 years"}</option>
                      <option value="10+">{isRu ? "10+ лет" : isUk ? "10+ років" : "10+ years"}</option>
                    </select>
                    {renderFieldError("yearsExperience")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Формат работы" : isUk ? "Формат роботи" : "Work Setting"} *</label>
                    <select {...register("workSetting", { required: true })} className="form-input appearance-none">
                      <option value="">{isRu ? "Выберите формат" : isUk ? "Оберіть формат" : "Select setting"}</option>
                      <option value="Independent">{isRu ? "Частная практика" : isUk ? "Приватна практика" : "Independent"}</option>
                      <option value="Salon / Studio">{isRu ? "Салон / студия" : isUk ? "Салон / студія" : "Salon / Studio"}</option>
                      <option value="Academy / School">{isRu ? "Академия / школа" : isUk ? "Академія / школа" : "Academy / School"}</option>
                      <option value="Brand / Company">{isRu ? "Бренд / компания" : isUk ? "Бренд / компанія" : "Brand / Company"}</option>
                      <option value="Other">{isRu ? "Другое" : isUk ? "Інше" : "Other"}</option>
                    </select>
                    {renderFieldError("workSetting")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Место работы" : isUk ? "Місце роботи" : "Place of Work"}</label>
                    <input {...register("placeOfWork")} className="form-input" placeholder={isRu ? "Название салона, академии или компании" : isUk ? "Назва салону, академії або компанії" : "Salon, academy, or company name"} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="field-label">{isRu ? "Профессиональное описание" : isUk ? "Професійний опис" : "Professional Description"} *</label>
                    <textarea
                      {...register("professionalDesc", { required: isRu ? "Добавьте профессиональное описание." : isUk ? "Додайте професійний опис." : "Add your professional description." })}
                      rows={4}
                      className="form-input"
                      placeholder={isRu ? "Опишите вашу деятельность, специализацию, обучение (если есть) и вклад в развитие индустрии" : isUk ? "Опишіть вашу діяльність, спеціалізацію, навчання (якщо є) та внесок у розвиток індустрії" : "Describe your activity, specialization, training (if any), and contribution to the development of the industry"}
                    />
                    {renderFieldError("professionalDesc")}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="field-label">{isRu ? "Где вы работаете" : isUk ? "Де ви працюєте" : "Working Jurisdictions"} *</label>
                    <input {...register("workingJurisdictions", { required: true })} className="form-input" placeholder={isRu ? "Страны, штаты или рынки, где вы активно работаете" : isUk ? "Країни, штати або ринки, де ви активно працюєте" : "Countries, states, or markets where you actively work"} />
                    {renderFieldError("workingJurisdictions")}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="credentials" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-10">
                <div className="space-y-3">
                  <h2 className={`text-3xl md:text-4xl uppercase tracking-tight text-slate-900 ${headlineClassName}`}>{isRu ? "Образование и квалификация" : isUk ? "Освіта та кваліфікація" : "Education and qualifications"}</h2>
                  <p className={`text-slate-500 ${editorialClassName}`}>{isRu ? "Укажите образование и квалификации, которые подтверждают вашу заявку." : isUk ? "Укажіть освіту та кваліфікації, які підтверджують вашу заявку." : "Share the education or credentials that support your application."}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2 md:col-span-2">
                    <label className="field-label">{isRu ? "Профессиональная подготовка и полученные квалификации" : isUk ? "Професійна підготовка та отримані кваліфікації" : "Professional training and qualifications earned"} *</label>
                    <textarea
                      {...register("educationDesc", { required: isRu ? "Добавьте сведения о подготовке и квалификациях." : isUk ? "Додайте відомості про підготовку та кваліфікації." : "Add your professional training and qualifications." })}
                      rows={4}
                      className="form-input"
                      placeholder={isRu ? "Укажите образовательные программы, курсы, обучение у преподавателей, а также полученные сертификаты и квалификации" : isUk ? "Укажіть освітні програми, курси, навчання у викладачів, а також отримані сертифікати й кваліфікації" : "List educational programs, courses, training with educators, and any certificates or qualifications you have earned"}
                    />
                    {renderFieldError("educationDesc")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Ключевая образовательная программа / ведущий преподаватель" : isUk ? "Ключова освітня програма / провідний викладач" : "Key educational program / lead educator"}</label>
                    <input
                      {...register("schoolName")}
                      className="form-input"
                      placeholder={isRu ? "Укажите наиболее значимую программу обучения, академию или преподавателя, оказавшего влияние на вашу профессиональную подготовку" : isUk ? "Укажіть найзначнішу програму навчання, академію або викладача, які вплинули на вашу професійну підготовку" : "Name the most influential training program, academy, or educator in your professional development"}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Даты обучения" : isUk ? "Дати навчання" : "Education Dates"}</label>
                    <input {...register("educationDates")} className="form-input" placeholder={isRu ? "Например: 2021-2023" : isUk ? "Наприклад: 2021-2023" : "Example: 2021-2023"} />
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Профессиональная лицензия" : isUk ? "Професійна ліцензія" : "Professional License"} *</label>
                    <select {...register("hasLicense", { required: true })} className="form-input appearance-none">
                      <option value="Yes">{isRu ? "Да, есть лицензия" : isUk ? "Так, є ліцензія" : "Yes, licensed"}</option>
                      <option value="No">{isRu ? "Нет, лицензии нет" : isUk ? "Ні, ліцензії немає" : "No, not licensed"}</option>
                      <option value="Not required">{isRu ? "Не требуется в моей юрисдикции" : isUk ? "Не вимагається в моїй юрисдикції" : "Not required in my jurisdiction"}</option>
                    </select>
                    {renderFieldError("hasLicense")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{isRu ? "Номер лицензии" : isUk ? "Номер ліцензії" : "License Number"}{requiresLicenseNumber(selectedCategory) ? " *" : ""}</label>
                    <input
                      {...register("licenseNumber", {
                        validate: (value) =>
                          !requiresLicenseNumber(selectedCategory) ||
                          !!value?.trim() ||
                          (isRu ? "Укажите номер лицензии." : isUk ? "Вкажіть номер ліцензії." : "Enter your license number."),
                      })}
                      className="form-input"
                      placeholder={isRu ? "Номер лицензии, если применимо" : isUk ? "Номер ліцензії, якщо застосовно" : "License number if applicable"}
                    />
                    {renderFieldError("licenseNumber")}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="field-label">{isRu ? "Дополнительные профессиональные квалификации" : isUk ? "Додаткові професійні кваліфікації" : "Additional professional qualifications"}</label>
                    <textarea
                      {...register("additionalEducation")}
                      rows={3}
                      className="form-input"
                      placeholder={isRu ? "Укажите дополнительные курсы, мастер-классы, обучения, сертификации и профессиональные программы, направленные на развитие ваших навыков" : isUk ? "Укажіть додаткові курси, майстер-класи, навчання, сертифікації та професійні програми, спрямовані на розвиток ваших навичок" : "List any additional courses, masterclasses, training, certifications, and professional programs that strengthened your skills"}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <DetailsStep
                isRu={isRu}
                isUk={isUk}
                headlineClassName={headlineClassName}
                editorialClassName={editorialClassName}
                selectedCategory={selectedCategory}
                detailTitle={isRu ? selectedConfig.detailTitleRu : isUk ? selectedConfig.detailTitleUk : selectedConfig.detailTitle}
                detailDescription={isRu ? selectedConfig.detailDescriptionRu : isUk ? selectedConfig.detailDescriptionUk : selectedConfig.detailDescription}
                specializationOptions={specializationOptions}
                register={register}
                watch={watch}
                renderFieldError={renderFieldError}
                portfolioImages={portfolioImages}
                onPortfolioImagesChange={(urls) => {
                  setValue("portfolioImages", urls, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
              />
            )}

            {currentStep === 5 && (
              <MotivationStep
                isRu={isRu}
                isUk={isUk}
                headlineClassName={headlineClassName}
                editorialClassName={editorialClassName}
                selectedCategory={selectedCategory}
                register={register}
                watch={watch}
                renderFieldError={renderFieldError}
              />
            )}

            {currentStep === 6 && (
              <ConfirmStep
                isRu={isRu}
                isUk={isUk}
                headlineClassName={headlineClassName}
                editorialClassName={editorialClassName}
                selectedConfigTitle={selectedConfigTitle}
                localizedApplicantType={localizedApplicantType}
                selectedPrice={selectedConfig.price}
                register={register}
                renderFieldError={renderFieldError}
              />
            )}
          </AnimatePresence>

          <div className="flex justify-between gap-4 pt-10 border-t border-slate-200">
            {currentStep > 0 ? (
              <button type="button" onClick={prevStep} className="px-8 py-4 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-3 hover:bg-white transition-all">
                <ChevronLeft size={16} /> {isRu ? "Назад" : isUk ? "Назад" : "Back"}
              </button>
            ) : (
              <Link href="/membership" className="px-8 py-4 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-widest text-slate-900">
                {isRu ? "Назад к сообществу" : isUk ? "Назад до спільноти" : "Back to Membership"}
              </Link>
            )}

            {!isFinalStep ? (
              <button type="button" onClick={nextStep} className="ml-auto px-10 py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl">
                {isRu ? "Продолжить" : isUk ? "Продовжити" : "Continue"} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  void handleSubmit(onSubmit)();
                }}
                className="ml-auto px-12 py-6 bg-[#B9D9EB] text-black rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-4 hover:scale-105 transition-all shadow-2xl disabled:opacity-60"
              >
                {isSubmitting ? (isRu ? "Отправка..." : isUk ? "Надсилання..." : "Submitting...") : (isRu ? "Отправить заявку" : isUk ? "Надіслати заявку" : "Submit Application")} <Send size={18} />
              </button>
            )}
          </div>
        </form>

        <aside className="space-y-6 sticky top-28">
          <div className="rounded-[36px] bg-white border border-slate-100 p-8 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#708090]">{isRu ? "Выбранный тариф" : isUk ? "Обраний тариф" : "Selected membership"}</p>
            <h3 className={`mt-4 text-3xl uppercase text-slate-900 ${headlineClassName}`}>{selectedConfigTitle}</h3>
            <p className={`mt-3 text-lg text-[#72A0C1] ${headlineClassName}`}>{selectedConfig.price}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{selectedConfigSummary}</p>
            <p className="mt-5 text-[10px] uppercase tracking-widest font-bold text-slate-400">{isRu ? "Тип заявки" : isUk ? "Тип заявки" : "Applicant type"}: {localizedApplicantType}</p>
          </div>

          <div className="rounded-[36px] bg-white border border-slate-100 p-8 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#708090]">{isRu ? "Нужна другая категория?" : isUk ? "Потрібна інша категорія?" : "Need another category?"}</p>
            <div className="mt-5 space-y-3">
              {membershipConfigs.filter((config) => config.id !== selectedCategory).map((config) => (
                <Link key={config.id} href={buildApplyHref(config.id)} className="block text-sm font-medium text-slate-500 hover:text-black transition-colors">
                  {isRu ? config.titleRu : isUk ? config.titleUk : config.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] bg-[#F8FBFD] border border-slate-100 p-8">
            <div className="flex items-start gap-4">
              <ShieldCheck size={24} className="text-[#72A0C1] shrink-0 mt-1" />
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-900">{isRu ? "Процесс рассмотрения" : isUk ? "Процес розгляду" : "Review process"}</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {isRu
                    ? "Вы отправляете анкету один раз. Мы рассматриваем её один раз. Если заявка одобрена, следующий шаг — оплата и активация по электронной почте. Без лишней цепочки редиректов и без дублирующих форм."
                    : isUk
                      ? "Ви надсилаєте анкету один раз. Ми розглядаємо її один раз. Якщо заявку схвалено, наступний крок — оплата й активація електронною поштою. Без зайвого ланцюжка редиректів і без дублюючих форм."
                    : "Submit once. We review once. If approved, the next step is payment and activation by email. No extra redirect chain, no duplicate form."}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .field-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-weight: 700;
          color: rgb(100 116 139);
        }

        .form-input {
          width: 100%;
          background-color: white;
          padding: 1rem 1.25rem;
          border-radius: 1.25rem;
          border: 1px solid rgba(185, 217, 235, 0.22);
          font-family: serif;
          font-style: italic;
          transition: all 0.25s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: #B9D9EB;
          box-shadow: 0 0 0 4px rgba(185, 217, 235, 0.12);
        }

        .space-y-2:has(.field-error) .field-label {
          color: rgb(220 38 38);
        }

        .space-y-2:has(.field-error) .form-input {
          border-color: rgba(220, 38, 38, 0.45);
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.08);
          background-color: rgba(254, 242, 242, 0.9);
        }

        .field-error {
          font-size: 12px;
          color: rgb(220 38 38);
          line-height: 1.4;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
