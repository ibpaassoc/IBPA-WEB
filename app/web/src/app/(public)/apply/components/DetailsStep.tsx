"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { UseFormRegister, UseFormWatch } from "react-hook-form";
import type { MembershipCategory } from "@/lib/membership";
import { ApplicationFileUploadField } from "@/components/forms/ApplicationFileUploadField";
import { PortfolioUploadField } from "@/components/forms/PortfolioUploadField";

type FormData = {
  portfolioImages: string[];
  trainerEducationPlanFiles: string[];
  trainerCertificateFiles: string[];
  trainerExperienceProofFiles: string[];
  dateOfBirth?: string;
  studentSchool?: string;
  studentProgName?: string;
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
  workingJurisdictions: string;
  achievementsYesNo?: "Yes" | "No";
  achievementsDesc?: string;
  competitionsYesNo?: "Yes" | "No";
  competitionName?: string;
  competitionYear?: string;
  competitionResult?: string;
  speakerEducatorJudge?: "Yes" | "No";
  publicationsYesNo?: "Yes" | "No";
  publicationsLinks?: string;
};

type DetailsStepProps = {
  isRu: boolean;
  isUk: boolean;
  headlineClassName: string;
  editorialClassName: string;
  selectedCategory: MembershipCategory;
  detailTitle: string;
  detailDescription: string;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  renderFieldError: (field: any) => ReactNode;
  portfolioImages: string[];
  onPortfolioImagesChange: (urls: string[]) => void;
  trainerEducationPlanFiles: string[];
  onTrainerEducationPlanFilesChange: (urls: string[]) => void;
  trainerCertificateFiles: string[];
  onTrainerCertificateFilesChange: (urls: string[]) => void;
  trainerExperienceProofFiles: string[];
  onTrainerExperienceProofFilesChange: (urls: string[]) => void;
};

export function DetailsStep({
  isRu,
  isUk,
  headlineClassName,
  editorialClassName,
  selectedCategory,
  detailTitle,
  detailDescription,
  register,
  watch,
  renderFieldError,
  portfolioImages,
  onPortfolioImagesChange,
  trainerEducationPlanFiles,
  onTrainerEducationPlanFilesChange,
  trainerCertificateFiles,
  onTrainerCertificateFilesChange,
  trainerExperienceProofFiles,
  onTrainerExperienceProofFilesChange,
}: DetailsStepProps) {
  const t = (en: string, _ru: string, _uk: string) => en;
  const requiresPortfolio = selectedCategory === "Specialist" || selectedCategory === "Professional" || selectedCategory === "Trainer";
  const isProfessionalLike = selectedCategory === "Professional" || selectedCategory === "Trainer" || selectedCategory === "Business";
  const achievementsYesNo = watch("achievementsYesNo");
  const competitionsYesNo = watch("competitionsYesNo");
  const publicationsYesNo = watch("publicationsYesNo");

  const yesNoSelect = (fieldName: "achievementsYesNo" | "competitionsYesNo" | "speakerEducatorJudge" | "publicationsYesNo") => (
    <select {...register(fieldName, { required: true })} className="form-input appearance-none">
      <option value="">{t("Select answer", "Выберите ответ", "Оберіть відповідь")}</option>
      <option value="Yes">{t("Yes", "Да", "Так")}</option>
      <option value="No">{t("No", "Нет", "Ні")}</option>
    </select>
  );

  return (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="space-y-10"
    >
      <div className="space-y-3">
        <h2 className={`text-3xl md:text-4xl uppercase tracking-tight text-slate-900 ${headlineClassName}`}>
          {detailTitle}
        </h2>
        <p className={`text-slate-500 ${editorialClassName}`}>{detailDescription}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {requiresPortfolio && (
          <PortfolioUploadField
            isRu={isRu}
            isUk={isUk}
            value={portfolioImages}
            onChange={onPortfolioImagesChange}
            error={renderFieldError("portfolioImages")}
          />
        )}

        {selectedCategory === "Specialist" && (
          <>
            <div className="space-y-2 md:col-span-2">
              <label className="field-label">{t("Training / Academy", "Школа / академия", "Школа / академія")} *</label>
              <input {...register("studentSchool", { required: true })} className="form-input" />
              {renderFieldError("studentSchool")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Training program", "Название программы", "Назва програми")} *</label>
              <input {...register("studentProgName", { required: true })} className="form-input" />
              {renderFieldError("studentProgName")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Training completion", "Ожидаемая дата окончания", "Очікувана дата завершення")} *</label>
              <input {...register("studentEndDate", { required: true })} className="form-input" placeholder="YYYY-MM-DD" />
              {renderFieldError("studentEndDate")}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="field-label">
                {t("Why are you applying now?", "Почему вы подаете заявку сейчас?", "Чому ви подаєте заявку зараз?")} *
              </label>
              <textarea {...register("studentMotivation", { required: true })} rows={4} className="form-input" />
              {renderFieldError("studentMotivation")}
            </div>
          </>
        )}

        {selectedCategory === "Professional" && (
          <>
            <div className="space-y-2 md:col-span-2">
              <label className="field-label">
                {t("Working jurisdictions", "Где вы работаете", "Де ви працюєте")} *
              </label>
              <input {...register("workingJurisdictions", { required: true })} className="form-input" />
              {renderFieldError("workingJurisdictions")}
            </div>
          </>
        )}

        {selectedCategory === "Trainer" && (
          <>
            <div className="space-y-2">
              <label className="field-label">{t("Educator role", "Роль преподавателя", "Роль викладача")} *</label>
              <input {...register("educatorRole", { required: true })} className="form-input" />
              {renderFieldError("educatorRole")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Subjects taught", "Какие дисциплины вы преподаете", "Які дисципліни ви викладаєте")} *</label>
              <input {...register("educatorSubjects", { required: true })} className="form-input" />
              {renderFieldError("educatorSubjects")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Teaching years", "Опыт преподавания", "Досвід викладання")} *</label>
              <input {...register("educatorYears", { required: true })} className="form-input" />
              {renderFieldError("educatorYears")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Training format", "Формат обучения", "Формат навчання")} *</label>
              <select {...register("educatorFormat", { required: true })} className="form-input">
                <option value="Offline">{t("Offline", "Оффлайн", "Офлайн")}</option>
                <option value="Online">{t("Online", "Онлайн", "Онлайн")}</option>
                <option value="Both">{t("Both", "Оба формата", "Обидва формати")}</option>
              </select>
              {renderFieldError("educatorFormat")}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="field-label">{t("Approximate student count", "Примерное число студентов", "Приблизна кількість студентів")} *</label>
              <input
                {...register("studentCount", {
                  required: true,
                  validate: (value: string) => {
                    const count = Number(String(value || "").match(/\d+/)?.[0] || 0);
                    return count >= 5 || t("Enter at least 5 students.", "Укажите минимум 5 студентов.", "Вкажіть щонайменше 5 студентів.");
                  },
                })}
                className="form-input"
                inputMode="numeric"
                placeholder="5+"
              />
              {renderFieldError("studentCount")}
            </div>
            <ApplicationFileUploadField
              endpoint="trainerEducationPlanUploader"
              label={t("Education Plan / Методичка", "Методичка / план обучения", "Методичка / план навчання")}
              description={t(
                "Upload your education plan, methodology, or training materials as PDF, DOC, or DOCX.",
                "Загрузите методичку, план обучения или учебные материалы в формате PDF, DOC или DOCX.",
                "Завантажте методичку, план навчання або навчальні матеріали у форматі PDF, DOC чи DOCX.",
              )}
              value={trainerEducationPlanFiles}
              onChange={onTrainerEducationPlanFilesChange}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              chooseLabel={t("Choose file", "Выбрать файл", "Обрати файл")}
              error={renderFieldError("trainerEducationPlanFiles")}
            />
            <ApplicationFileUploadField
              endpoint="trainerCertificateUploader"
              label={t("Certificate", "Сертификат", "Сертифікат")}
              description={t(
                "Upload a certificate that supports your educator application. PDF or image files are accepted.",
                "Загрузите сертификат, подтверждающий вашу заявку преподавателя. Принимаются PDF или изображения.",
                "Завантажте сертифікат, що підтверджує вашу заявку викладача. Приймаються PDF або зображення.",
              )}
              value={trainerCertificateFiles}
              onChange={onTrainerCertificateFilesChange}
              accept=".pdf,image/*,application/pdf"
              chooseLabel={t("Choose file", "Выбрать файл", "Обрати файл")}
              error={renderFieldError("trainerCertificateFiles")}
            />
            <ApplicationFileUploadField
              endpoint="trainerProofUploader"
              label={t("Proof of educator experience", "Подтверждение преподавательского опыта", "Підтвердження викладацького досвіду")}
              description={t(
                "Upload at least 5 photos such as student reviews, teaching photos, or training screenshots.",
                "Загрузите минимум 5 фото: отзывы студентов, фото преподавания, скриншоты обучения и другие подтверждения.",
                "Завантажте щонайменше 5 фото: відгуки студентів, фото викладання, скриншоти навчання та інші підтвердження.",
              )}
              value={trainerExperienceProofFiles}
              onChange={onTrainerExperienceProofFilesChange}
              accept="image/*"
              chooseLabel={t("Choose photos", "Выбрать фото", "Обрати фото")}
              multiple
              minFiles={5}
              maxFiles={10}
              imageOnly
              error={renderFieldError("trainerExperienceProofFiles")}
            />
          </>
        )}

        {selectedCategory === "Business" && (
          <>
            <div className="space-y-2">
              <label className="field-label">{t("Business name", "Название бизнеса", "Назва бізнесу")} *</label>
              <input {...register("bizName", { required: true })} className="form-input" />
              {renderFieldError("bizName")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Business type", "Тип бизнеса", "Тип бізнесу")} *</label>
              <input {...register("bizType", { required: true })} className="form-input" />
              {renderFieldError("bizType")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Year established", "Год основания", "Рік заснування")} *</label>
              <input {...register("bizYear", { required: true })} className="form-input" />
              {renderFieldError("bizYear")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Team size", "Размер команды", "Розмір команди")} *</label>
              <input {...register("bizTeamSize", { required: true })} className="form-input" />
              {renderFieldError("bizTeamSize")}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="field-label">{t("Main services", "Основные услуги", "Основні послуги")} *</label>
              <textarea {...register("bizServices", { required: true })} rows={3} className="form-input" />
              {renderFieldError("bizServices")}
            </div>
          </>
        )}

        {selectedCategory === "Brand" && (
          <>
            <div className="space-y-2">
              <label className="field-label">{t("Brand / company name", "Название бренда / компании", "Назва бренду / компанії")} *</label>
              <input {...register("brandName", { required: true })} className="form-input" />
              {renderFieldError("brandName")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Year established", "Год основания", "Рік заснування")} *</label>
              <input {...register("brandYear", { required: true })} className="form-input" />
              {renderFieldError("brandYear")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Market / geography", "Рынок / география", "Ринок / географія")} *</label>
              <input {...register("brandMarket", { required: true })} className="form-input" />
              {renderFieldError("brandMarket")}
            </div>
            <div className="space-y-2">
              <label className="field-label">{t("Brand type", "Тип бренда", "Тип бренду")} *</label>
              <input {...register("brandType", { required: true })} className="form-input" />
              {renderFieldError("brandType")}
            </div>
          </>
        )}

        {isProfessionalLike && (
          <>
            <div className="md:col-span-2 rounded-[24px] border border-[#B9D9EB]/50 bg-white/80 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#708090]">
                {t("Professional achievements", "Профессиональные достижения", "Професійні досягнення")}
              </p>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="field-label">{t("Do you have professional achievements?", "Есть ли у вас профессиональные достижения?", "Чи маєте ви професійні досягнення?")} *</label>
                  {yesNoSelect("achievementsYesNo")}
                  {renderFieldError("achievementsYesNo")}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="field-label">{t("Describe your achievements", "Опишите ваши достижения", "Опишіть ваші досягнення")}</label>
                  <textarea
                    {...register("achievementsDesc", {
                      validate: (value) =>
                        achievementsYesNo !== "Yes" || !!value?.trim() || t("Describe your achievements.", "Опишите ваши достижения.", "Опишіть ваші досягнення."),
                    })}
                    rows={4}
                    className="form-input"
                    placeholder={t(
                      "Awards, competition placements, speaker experience, judging experience, publications, media features, educational contributions, collaborations, industry leadership",
                      "Награды, места в чемпионатах, опыт спикера, судейство, публикации, медиа, образовательный вклад, коллаборации, лидерство в индустрии",
                      "Нагороди, місця в чемпіонатах, досвід спікера, суддівство, публікації, медіа, освітній внесок, колаборації, лідерство в індустрії",
                    )}
                  />
                  {renderFieldError("achievementsDesc")}
                </div>
                <div className="space-y-2">
                  <label className="field-label">{t("Have you participated in competitions?", "Участвовали ли вы в чемпионатах / конкурсах?", "Чи брали ви участь у чемпіонатах / конкурсах?")} *</label>
                  {yesNoSelect("competitionsYesNo")}
                  {renderFieldError("competitionsYesNo")}
                </div>
                <div className="space-y-2">
                  <label className="field-label">{t("Were you a speaker / educator / judge?", "Были ли вы спикером / преподавателем / судьёй?", "Чи були ви спікером / викладачем / суддею?")} *</label>
                  {yesNoSelect("speakerEducatorJudge")}
                  {renderFieldError("speakerEducatorJudge")}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="field-label">{t("Have you been featured in publications or media?", "Есть ли у вас публикации / интервью / статьи / выступления?", "Чи є у вас публікації / інтерв’ю / статті / виступи?")} *</label>
                  {yesNoSelect("publicationsYesNo")}
                  {renderFieldError("publicationsYesNo")}
                </div>
                {competitionsYesNo === "Yes" && (
                  <>
                    <div className="space-y-2">
                      <label className="field-label">{t("Competition name", "Название конкурса", "Назва конкурсу")} *</label>
                      <input
                        {...register("competitionName", {
                          validate: (value) =>
                            competitionsYesNo !== "Yes" || !!value?.trim() || t("Enter the competition name.", "Укажите название конкурса.", "Укажіть назву конкурсу."),
                        })}
                        className="form-input"
                      />
                      {renderFieldError("competitionName")}
                    </div>
                    <div className="space-y-2">
                      <label className="field-label">{t("Competition year", "Год участия", "Рік участі")} *</label>
                      <input
                        {...register("competitionYear", {
                          validate: (value) =>
                            competitionsYesNo !== "Yes" || !!value?.trim() || t("Enter the year of participation.", "Укажите год участия.", "Укажіть рік участі."),
                        })}
                        className="form-input"
                        placeholder="2024"
                      />
                      {renderFieldError("competitionYear")}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="field-label">{t("Competition result", "Результат", "Результат")} *</label>
                      <input
                        {...register("competitionResult", {
                          validate: (value) =>
                            competitionsYesNo !== "Yes" || !!value?.trim() || t("Enter the competition result.", "Укажите результат.", "Укажіть результат."),
                        })}
                        className="form-input"
                      />
                      {renderFieldError("competitionResult")}
                    </div>
                  </>
                )}
                {publicationsYesNo === "Yes" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="field-label">{t("Links to publications / media mentions", "Ссылки на публикации / выступления / media mentions", "Посилання на публікації / виступи / медіа-згадки")} *</label>
                    <textarea
                      {...register("publicationsLinks", {
                        validate: (value) =>
                          publicationsYesNo !== "Yes" || !!value?.trim() || t("Add at least one link.", "Добавьте хотя бы одну ссылку.", "Додайте принаймні одне посилання."),
                      })}
                      rows={3}
                      className="form-input"
                      placeholder="https://..."
                    />
                    {renderFieldError("publicationsLinks")}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
