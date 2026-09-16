"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  PROMO_CODE_NO_DISCOUNT,
  emptyPromoCodeDraft,
  type AdminPromoCode,
  type PromoCodeDraft,
} from "../types/promo-code-admin.types";

type PromoCodeDialogProps = {
  open: boolean;
  promoCode: AdminPromoCode | null;
  discountEnvKeys: string[];
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: PromoCodeDraft) => Promise<boolean>;
};

const inputClassName =
  "h-11 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] px-4 text-[#10203B] focus-visible:border-[#21466D]";

export function PromoCodeDialog({
  discountEnvKeys,
  isSaving,
  onOpenChange,
  onSave,
  open,
  promoCode,
}: PromoCodeDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[28px]">
        {/* Keyed so each code opens with its own draft, with no reset effect. */}
        <PromoCodeForm
          discountEnvKeys={discountEnvKeys}
          isSaving={isSaving}
          key={promoCode?.id ?? "new"}
          onCancel={() => onOpenChange(false)}
          onSave={(draft) =>
            onSave(draft).then((saved) => {
              if (saved) onOpenChange(false);
              return saved;
            })
          }
          promoCode={promoCode}
        />
      </DialogContent>
    </Dialog>
  );
}

type PromoCodeFormProps = {
  promoCode: AdminPromoCode | null;
  discountEnvKeys: string[];
  isSaving: boolean;
  onCancel: () => void;
  onSave: (draft: PromoCodeDraft) => Promise<boolean>;
};

function PromoCodeForm({
  discountEnvKeys,
  isSaving,
  onCancel,
  onSave,
  promoCode,
}: PromoCodeFormProps) {
  const [draft, setDraft] = useState<PromoCodeDraft>(() =>
    promoCode
      ? {
          code: promoCode.code,
          description: promoCode.description,
          discountEnvKey: promoCode.discountEnvKey,
          enabled: promoCode.enabled,
          label: promoCode.label,
        }
      : { ...emptyPromoCodeDraft, discountEnvKey: discountEnvKeys[0] ?? null },
  );

  const setField = <TKey extends keyof PromoCodeDraft>(key: TKey, value: PromoCodeDraft[TKey]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const trimmedCode = draft.code.trim();
  const canSave = trimmedCode.length >= 3 && !isSaving;

  return (
    <>
      <DialogTitle className="text-lg font-semibold text-[#10203B]">
        {promoCode ? "Edit promo code" : "New promo code"}
      </DialogTitle>
      <DialogDescription className="text-sm leading-6 text-[#6C7F95]">
        Applicants enter this code on the membership application. The Stripe coupon is attached
        to their invoice when you approve the application for payment.
      </DialogDescription>

      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6C7F95]"
            htmlFor="promo-code-word"
          >
            Code
          </FieldLabel>
          <Input
            autoCapitalize="characters"
            autoComplete="off"
            className={`${inputClassName} font-semibold uppercase tracking-[0.18em]`}
            id="promo-code-word"
            maxLength={40}
            onChange={(event) =>
              setField("code", event.target.value.toUpperCase().replace(/\s+/g, ""))
            }
            placeholder="BBFMEMBER2026"
            value={draft.code}
          />
          <FieldDescription className="text-xs text-[#8AA2BD]">
            Letters and numbers, no spaces. Applicants are not case-sensitive.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6C7F95]"
            htmlFor="promo-code-label"
          >
            Name
          </FieldLabel>
          <Input
            className={inputClassName}
            id="promo-code-label"
            maxLength={120}
            onChange={(event) => setField("label", event.target.value)}
            placeholder="Beauty Business Forum 2026"
            value={draft.label}
          />
          <FieldDescription className="text-xs text-[#8AA2BD]">
            Shown here in the admin, not to applicants.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6C7F95]"
            htmlFor="promo-code-description"
          >
            Note for applicants
          </FieldLabel>
          <Textarea
            className="min-h-24 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] p-3 text-[#10203B]"
            id="promo-code-description"
            maxLength={400}
            onChange={(event) => setField("description", event.target.value)}
            placeholder="Forum attendee rate. Applied to your membership invoice once your application is approved."
            value={draft.description}
          />
          <FieldDescription className="text-xs text-[#8AA2BD]">
            Appears on the application form once the code is accepted.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6C7F95]">
            Stripe coupon
          </FieldLabel>
          <Select
            onValueChange={(value) =>
              setField("discountEnvKey", value === PROMO_CODE_NO_DISCOUNT ? null : value)
            }
            value={draft.discountEnvKey ?? PROMO_CODE_NO_DISCOUNT}
          >
            <SelectTrigger className="h-11 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B]">
              <SelectValue placeholder="Select a coupon" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={PROMO_CODE_NO_DISCOUNT}>Not linked</SelectItem>
                {discountEnvKeys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription className="text-xs text-[#8AA2BD]">
            The coupon id lives in the server environment. A code with no linked coupon is never
            accepted on the application form.
          </FieldDescription>
        </Field>

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#D7E5F4] bg-[#F8FBFF] p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#10203B]" id="promo-code-enabled-label">
              Accept this code
            </p>
            <p
              className="mt-0.5 text-xs leading-5 text-[#6C7F95]"
              id="promo-code-enabled-description"
            >
              When off, applicants cannot enter the code and approvals stop discounting it.
            </p>
          </div>
          <button
            aria-checked={draft.enabled}
            aria-describedby="promo-code-enabled-description"
            aria-labelledby="promo-code-enabled-label"
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] focus-visible:ring-offset-2 ${
              draft.enabled ? "border-[#21466D] bg-[#21466D]" : "border-[#C8D6E6] bg-[#E7EEF6]"
            }`}
            onClick={() => setField("enabled", !draft.enabled)}
            role="switch"
            type="button"
          >
            <span
              aria-hidden
              className={`inline-block size-4.5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${
                draft.enabled ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-3">
        <Button
          className="h-10 rounded-2xl"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          className="h-10 rounded-2xl bg-[#1F5D8F] text-white hover:bg-[#10203B]"
          disabled={!canSave}
          onClick={() => {
            void onSave({ ...draft, code: trimmedCode });
          }}
          type="button"
        >
          {isSaving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
          {promoCode ? "Save changes" : "Create promo code"}
        </Button>
      </div>
    </>
  );
}
