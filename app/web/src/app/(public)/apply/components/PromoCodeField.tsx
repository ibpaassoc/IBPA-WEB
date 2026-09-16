"use client";

import { Check, Loader2, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AppliedPromoCode = {
  code: string;
  label: string;
  description: string;
};

type PromoCodeFieldProps = {
  isRu: boolean;
  isUk: boolean;
  editorialClassName: string;
  value: string;
  onApplied: (code: string) => void;
  onCleared: () => void;
};

const INPUT_CLASSNAME =
  "w-full rounded-[1.25rem] border border-[rgba(185,217,235,0.22)] bg-white px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-900 outline-none transition-all placeholder:font-normal placeholder:tracking-[0.12em] placeholder:text-slate-300 focus:border-[#B9D9EB] focus:shadow-[0_0_0_4px_rgba(185,217,235,0.12)]";

/**
 * Resolves to the promo code when it can be redeemed, and to null when the
 * server says it cannot. It throws only when the check itself could not run —
 * the caller tells an applicant "we don't recognize that code" for a null and
 * "we couldn't check it" for a throw, so a service outage never reads as a
 * typo.
 */
async function checkPromoCode(code: string): Promise<AppliedPromoCode | null> {
  const response = await fetch("/api/promo-codes/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (response.status >= 500) {
    throw new Error("Promo code check is unavailable.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.valid || !payload?.promoCode) {
    return null;
  }

  return payload.promoCode as AppliedPromoCode;
}

export function PromoCodeField({
  editorialClassName,
  isRu,
  isUk,
  onApplied,
  onCleared,
  value,
}: PromoCodeFieldProps) {
  const t = (en: string, ru: string, uk: string) => (isRu ? ru : isUk ? uk : en);
  const [draft, setDraft] = useState("");
  const [applied, setApplied] = useState<AppliedPromoCode | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const checkedValueRef = useRef<string | null>(null);

  // A saved draft or a returning applicant can arrive with a code already on
  // the form. Re-check it so the accepted state is never stale: a code that has
  // since been turned off is removed instead of quietly promising a discount.
  useEffect(() => {
    if (!value || applied || checkedValueRef.current === value) return;

    let cancelled = false;
    setIsChecking(true);

    void checkPromoCode(value)
      .then((promoCode) => {
        // A cancelled run must not mark the value as checked, or a remount
        // (React Strict Mode runs effects twice) would skip the real check and
        // leave the field stuck on "Checking".
        if (cancelled) return;
        checkedValueRef.current = value;

        if (promoCode) {
          setApplied(promoCode);
          return;
        }

        onCleared();
        setError(
          t(
            "That promo code is no longer available.",
            "Этот промокод больше недоступен.",
            "Цей промокод більше недоступний.",
          ),
        );
      })
      .catch(() => {
        // The check could not run. Keep the code on the form — the server
        // verifies it again on submit — and say why the note is missing.
        if (cancelled) return;
        setError(
          t(
            "We couldn't confirm your promo code right now. It stays on your application and will be checked when you submit.",
            "Сейчас не удалось подтвердить промокод. Он останется в заявке и будет проверен при отправке.",
            "Зараз не вдалося підтвердити промокод. Він залишиться в заявці й буде перевірений під час надсилання.",
          ),
        );
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, value]);

  const apply = async () => {
    const code = draft.trim().toUpperCase();
    if (!code || isChecking) return;

    setIsChecking(true);
    setError("");

    try {
      const promoCode = await checkPromoCode(code);
      if (!promoCode) {
        setError(
          t(
            "We don't recognize that promo code. Check the spelling and try again.",
            "Мы не распознали этот промокод. Проверьте написание и попробуйте снова.",
            "Ми не розпізнали цей промокод. Перевірте написання та спробуйте ще раз.",
          ),
        );
        return;
      }

      setApplied(promoCode);
      setDraft("");
      onApplied(promoCode.code);
    } catch {
      setError(
        t(
          "We couldn't check that promo code. Please try again.",
          "Не удалось проверить промокод. Попробуйте ещё раз.",
          "Не вдалося перевірити промокод. Спробуйте ще раз.",
        ),
      );
    } finally {
      setIsChecking(false);
    }
  };

  const remove = () => {
    setApplied(null);
    setDraft("");
    setError("");
    onCleared();
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <Tag className="text-[#708090]" size={13} />
        <p className="text-[10px] uppercase tracking-widest text-slate-400">
          {t("Promo code", "Промокод", "Промокод")}
        </p>
      </div>

      <p className={`mt-2 text-sm text-slate-500 ${editorialClassName}`}>
        {t(
          "Have a promo code? Add it now and it will be applied to your membership invoice once IBPA approves your application.",
          "Есть промокод? Добавьте его сейчас — он будет применён к счёту за членство после одобрения вашей заявки IBPA.",
          "Маєте промокод? Додайте його зараз — його буде застосовано до рахунку за членство після схвалення вашої заявки IBPA.",
        )}
      </p>

      {applied ? (
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-dashed border-[#B9D9EB] bg-[#F7FBFD] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#B9D9EB] text-black">
              <Check size={13} strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-900">
                {applied.code}
              </p>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
                {applied.description
                  || t(
                    "Applied to your membership invoice after approval.",
                    "Будет применён к счёту за членство после одобрения.",
                    "Буде застосовано до рахунку за членство після схвалення.",
                  )}
              </p>
            </div>
          </div>

          <button
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
            onClick={remove}
            type="button"
          >
            {t("Remove", "Убрать", "Прибрати")}
          </button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            aria-label={t("Promo code", "Промокод", "Промокод")}
            autoComplete="off"
            className={`${INPUT_CLASSNAME} sm:flex-1`}
            disabled={isChecking}
            maxLength={40}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError("");
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              void apply();
            }}
            placeholder={t("Enter your code", "Введите код", "Введіть код")}
            value={draft}
          />
          <button
            className="flex items-center justify-center gap-2 rounded-full border border-slate-900 px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-900 transition-all hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-900"
            disabled={isChecking || draft.trim().length === 0}
            onClick={() => void apply()}
            type="button"
          >
            {isChecking ? <Loader2 className="animate-spin" size={13} /> : null}
            {isChecking
              ? t("Checking", "Проверяем", "Перевіряємо")
              : t("Apply", "Применить", "Застосувати")}
          </button>
        </div>
      )}

      {error ? <p className="field-error mt-3">{error}</p> : null}
    </div>
  );
}
