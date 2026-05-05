"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { UseFormRegister } from "react-hook-form";

type ConfirmStepProps = {
  isRu: boolean;
  isUk: boolean;
  headlineClassName: string;
  editorialClassName: string;
  selectedConfigTitle: string;
  localizedApplicantType: string;
  selectedPrice: string;
  register: UseFormRegister<any>;
  renderFieldError: (field: any) => ReactNode;
};

export function ConfirmStep({
  isRu,
  isUk,
  headlineClassName,
  editorialClassName,
  selectedConfigTitle,
  localizedApplicantType,
  selectedPrice,
  register,
  renderFieldError,
}: ConfirmStepProps) {
  const t = (en: string, _ru: string, _uk: string) => en;

  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="space-y-10"
    >
      <div className="space-y-3">
        <h2 className={`text-3xl md:text-4xl uppercase tracking-tight text-slate-900 ${headlineClassName}`}>
          {t("Final confirmation", "Финальное подтверждение", "Фінальне підтвердження")}
        </h2>
        <p className={`text-slate-500 ${editorialClassName}`}>
          {t(
            "Please verify your application details and accept required confirmations.",
            "Пожалуйста, проверьте данные заявки и подтвердите обязательные пункты.",
            "Будь ласка, перевірте дані заявки й підтвердьте обов’язкові пункти.",
          )}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-[10px] uppercase tracking-widest text-slate-400">
          {t("Summary", "Сводка", "Підсумок")}
        </p>
        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
          <p>{selectedConfigTitle}</p>
          <p>{localizedApplicantType}</p>
          <p>{selectedPrice}</p>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" {...register("certifyTrue", { required: true })} className="mt-1 accent-black" />
          <span>{t("I confirm that all information provided is accurate.", "Подтверждаю, что вся информация верна.", "Підтверджую, що вся надана інформація є достовірною.")}</span>
        </label>
        {renderFieldError("certifyTrue")}

        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" {...register("understandReview", { required: true })} className="mt-1 accent-black" />
          <span>{t("I understand the application review process.", "Я понимаю процесс рассмотрения заявки.", "Я розумію процес розгляду заявки.")}</span>
        </label>
        {renderFieldError("understandReview")}

        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" {...register("agreeStandards", { required: true })} className="mt-1 accent-black" />
          <span>{t("I agree to comply with IBPA professional standards.", "Я согласен(а) соблюдать профессиональные стандарты IBPA.", "Я погоджуюся дотримуватися професійних стандартів IBPA.")}</span>
        </label>
        {renderFieldError("agreeStandards")}

        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" {...register("privacyConsent", { required: true })} className="mt-1 accent-black" />
          <span>{t("I consent to personal data processing for membership review.", "Я даю согласие на обработку персональных данных для рассмотрения заявки.", "Я надаю згоду на обробку персональних даних для розгляду заявки.")}</span>
        </label>
        {renderFieldError("privacyConsent")}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="field-label">{t("Full legal name", "Полное юридическое имя", "Повне юридичне ім’я")} *</label>
          <input {...register("legalName", { required: true })} className="form-input" />
          {renderFieldError("legalName")}
        </div>
        <div className="space-y-2">
          <label className="field-label">{t("Electronic signature", "Электронная подпись", "Електронний підпис")} *</label>
          <input {...register("signature", { required: true })} className="form-input" />
          {renderFieldError("signature")}
        </div>
      </div>
    </motion.div>
  );
}
