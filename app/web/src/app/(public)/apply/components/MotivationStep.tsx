"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { UseFormRegister, UseFormWatch } from "react-hook-form";
import type { MembershipCategory } from "@/lib/membership";

type FormData = {
  instagramLink: string;
  websiteLink?: string;
  linkedinLink?: string;
  portfolioLink?: string;
  whyJoin: string;
  contributionDesc: string;
  professionalCommunityYesNo?: "Yes" | "No";
  otherOrganizationsYesNo?: "Yes" | "No";
  otherOrganizationName?: string;
  otherOrganizationStatus?: string;
  otherOrganizationYears?: string;
};

type MotivationStepProps = {
  isRu: boolean;
  isUk: boolean;
  headlineClassName: string;
  editorialClassName: string;
  selectedCategory: MembershipCategory;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  renderFieldError: (field: any) => ReactNode;
};

export function MotivationStep({
  isRu,
  isUk,
  headlineClassName,
  editorialClassName,
  selectedCategory,
  register,
  watch,
  renderFieldError,
}: MotivationStepProps) {
  const t = (en: string, ru: string, uk: string) => (isRu ? ru : isUk ? uk : en);
  const isBusinessOrBrand = selectedCategory === "Business" || selectedCategory === "Brand";
  const isProfessionalLike = selectedCategory === "Professional" || selectedCategory === "Trainer" || selectedCategory === "Business";
  const otherOrganizationsYesNo = watch("otherOrganizationsYesNo");

  const yesNoSelect = (fieldName: "professionalCommunityYesNo" | "otherOrganizationsYesNo") => (
    <select {...register(fieldName, { required: true })} className="form-input appearance-none">
      <option value="">{t("Select answer", "Выберите ответ", "Оберіть відповідь")}</option>
      <option value="Yes">{t("Yes", "Да", "Так")}</option>
      <option value="No">{t("No", "Нет", "Ні")}</option>
    </select>
  );

  return (
    <motion.div
      key="motivation"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="space-y-10"
    >
      <div className="space-y-3">
        <h2 className={`text-3xl md:text-4xl uppercase tracking-tight text-slate-900 ${headlineClassName}`}>
          {t("Visibility and motivation", "Публичные ссылки и мотивация", "Публічні посилання та мотивація")}
        </h2>
        <p className={`text-slate-500 ${editorialClassName}`}>
          {t(
            "Add the links and context that help the board understand your profile and contribution.",
            "Добавьте ссылки и контекст, которые помогут комиссии лучше понять ваш профиль и вклад.",
            "Додайте посилання та контекст, які допоможуть комісії краще зрозуміти ваш профіль і внесок.",
          )}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="field-label">{t("Instagram / social profile", "Instagram / соцсети", "Instagram / соцмережі")} *</label>
          <input {...register("instagramLink", { required: true })} className="form-input" placeholder="https://instagram.com/..." />
          {renderFieldError("instagramLink")}
        </div>
        <div className="space-y-2">
          <label className="field-label">
            {isBusinessOrBrand
              ? t("Website link", "Ссылка на сайт", "Посилання на сайт")
              : t("Portfolio link", "Ссылка на портфолио", "Посилання на портфоліо")}{" "}
            *
          </label>
          {isBusinessOrBrand ? (
            <>
              <input {...register("websiteLink", { required: true })} className="form-input" placeholder="https://..." />
              {renderFieldError("websiteLink")}
            </>
          ) : (
            <>
              <input {...register("portfolioLink", { required: true })} className="form-input" placeholder="https://..." />
              {renderFieldError("portfolioLink")}
            </>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="field-label">{t("LinkedIn profile (optional)", "Профиль LinkedIn (необязательно)", "Профіль LinkedIn (необов’язково)")}</label>
          <input {...register("linkedinLink")} className="form-input" placeholder="https://linkedin.com/in/..." />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="field-label">{t("Why do you want to join IBPA?", "Почему вы хотите вступить в IBPA?", "Чому ви хочете приєднатися до IBPA?")} *</label>
          <textarea {...register("whyJoin", { required: true })} rows={4} className="form-input" />
          {renderFieldError("whyJoin")}
        </div>
        {isProfessionalLike && (
          <div className="md:col-span-2 rounded-[24px] border border-[#B9D9EB]/50 bg-white/80 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#708090]">
              {t("Industry contribution", "Вклад в индустрию", "Внесок в індустрію")}
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="field-label">{t("How do you contribute to the beauty industry?", "Какой вклад вы вносите в развитие beauty-индустрии?", "Який внесок ви робите в розвиток beauty-індустрії?")} *</label>
                <textarea
                  {...register("contributionDesc", { required: true })}
                  rows={4}
                  className="form-input"
                  placeholder={t(
                    "Teaching other specialists, mentorship, industry events, publications, standards development, educational products, business growth, community involvement",
                    "Обучение специалистов, наставничество, участие в мероприятиях, публикации, развитие стандартов, образовательные продукты, развитие бизнеса, участие в сообществе",
                    "Навчання спеціалістів, наставництво, участь у заходах, публікації, розвиток стандартів, освітні продукти, розвиток бізнесу, участь у спільноті",
                  )}
                />
                {renderFieldError("contributionDesc")}
              </div>
              <div className="space-y-2">
                <label className="field-label">{t("Do you participate in a professional community?", "Участвуете ли вы в профессиональном сообществе?", "Чи берете ви участь у професійній спільноті?")} *</label>
                {yesNoSelect("professionalCommunityYesNo")}
                {renderFieldError("professionalCommunityYesNo")}
              </div>
              <div className="space-y-2">
                <label className="field-label">{t("Are you a member of other professional organizations?", "Являетесь ли вы членом других профессиональных организаций?", "Чи є ви членом інших професійних організацій?")} *</label>
                {yesNoSelect("otherOrganizationsYesNo")}
                {renderFieldError("otherOrganizationsYesNo")}
              </div>
              {otherOrganizationsYesNo === "Yes" && (
                <>
                  <div className="space-y-2">
                    <label className="field-label">{t("Organization name", "Название организации", "Назва організації")} *</label>
                    <input
                      {...register("otherOrganizationName", {
                        validate: (value) =>
                          otherOrganizationsYesNo !== "Yes" || !!value?.trim() || t("Enter the organization name.", "Укажите название организации.", "Укажіть назву організації."),
                      })}
                      className="form-input"
                    />
                    {renderFieldError("otherOrganizationName")}
                  </div>
                  <div className="space-y-2">
                    <label className="field-label">{t("Membership status", "Статус членства", "Статус членства")} *</label>
                    <input
                      {...register("otherOrganizationStatus", {
                        validate: (value) =>
                          otherOrganizationsYesNo !== "Yes" || !!value?.trim() || t("Enter the membership status.", "Укажите статус членства.", "Укажіть статус членства."),
                      })}
                      className="form-input"
                      placeholder={t("Member, fellow, board member...", "Участник, член, советник...", "Учасник, член, радник...")}
                    />
                    {renderFieldError("otherOrganizationStatus")}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="field-label">{t("Membership years", "Годы членства", "Роки членства")} *</label>
                    <input
                      {...register("otherOrganizationYears", {
                        validate: (value) =>
                          otherOrganizationsYesNo !== "Yes" || !!value?.trim() || t("Enter the membership years.", "Укажите годы членства.", "Укажіть роки членства."),
                      })}
                      className="form-input"
                      placeholder={t("2021–2024", "2021–2024", "2021–2024")}
                    />
                    {renderFieldError("otherOrganizationYears")}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
