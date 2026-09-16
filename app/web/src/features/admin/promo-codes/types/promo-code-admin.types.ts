export type AdminPromoCode = {
  id: string;
  /** The word applicants type on the membership application. */
  code: string;
  label: string;
  description: string;
  enabled: boolean;
  /** Name of the environment variable holding the Stripe coupon id. */
  discountEnvKey: string | null;
  /** True only when Stripe will accept the linked coupon right now. */
  discountConfigured: boolean;
  /**
   * linked   — Stripe accepts the coupon.
   * unlinked — no environment variable is chosen for this code.
   * unset    — the chosen variable holds no value on this server.
   * rejected — the variable holds a coupon id Stripe will not accept.
   */
  discountStatus: "linked" | "unlinked" | "unset" | "rejected";
  /** Stripe's own explanation when the coupon cannot be used. */
  discountMessage: string | null;
  applicationCount: number;
  paidCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminPromoCodesResponse = {
  items: AdminPromoCode[];
  /** Stripe discount environment variables an administrator can choose from. */
  discountEnvKeys: string[];
};

export type PromoCodeDraft = {
  code: string;
  label: string;
  description: string;
  enabled: boolean;
  discountEnvKey: string | null;
};

export const PROMO_CODE_NO_DISCOUNT = "__none__";

export const emptyPromoCodeDraft: PromoCodeDraft = {
  code: "",
  description: "",
  discountEnvKey: null,
  enabled: true,
  label: "",
};
