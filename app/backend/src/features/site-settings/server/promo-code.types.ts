/**
 * A promo code an applicant can enter on the membership application. The code
 * never discounts anything on its own: an administrator reviews the
 * application first, and the linked Stripe coupon is attached to the checkout
 * session at the moment the application is approved for payment.
 */
export type PromoCode = {
  /** Stable identity, so renaming the code keeps its history and settings. */
  id: string;
  /** The word applicants type, stored uppercase. */
  code: string;
  /** Internal name shown in the admin list. */
  label: string;
  /** Shown to the applicant once the code is accepted on the form. */
  description: string;
  enabled: boolean;
  /**
   * Name of the environment variable holding the Stripe coupon id. Only the
   * name is ever stored or sent to the browser — never the value.
   */
  discountEnvKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PromoCodeSettings = {
  items: PromoCode[];
};

export type PromoCodeDiscountStatus = "linked" | "unlinked" | "unset" | "rejected";

/** Admin-facing view: adds the live state of the linked Stripe coupon. */
export type AdminPromoCode = PromoCode & {
  /** True only when Stripe will accept the coupon right now. */
  discountConfigured: boolean;
  discountStatus: PromoCodeDiscountStatus;
  /** Stripe's own explanation when the coupon cannot be used. */
  discountMessage: string | null;
  applicationCount: number;
  paidCount: number;
};

/** What the applicant sees after entering a code on the form. */
export type PublicPromoCode = {
  code: string;
  label: string;
  description: string;
};
