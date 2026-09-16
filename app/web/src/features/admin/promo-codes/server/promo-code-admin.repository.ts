import { requestJson } from "../../shared/utils/admin-request";
import type {
  AdminPromoCode,
  AdminPromoCodesResponse,
  PromoCodeDraft,
} from "../types/promo-code-admin.types";

export async function listPromoCodes() {
  return requestJson<AdminPromoCodesResponse>(
    "/api/admin/promo-codes",
    { cache: "no-store" },
    "Could not load promo codes.",
  );
}

export async function createPromoCode(draft: PromoCodeDraft) {
  return requestJson<{ promoCode: AdminPromoCode }>(
    "/api/admin/promo-codes",
    {
      body: JSON.stringify(draft),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not create the promo code.",
  );
}

export async function updatePromoCode(id: string, changes: Partial<PromoCodeDraft>) {
  return requestJson<{ promoCode: AdminPromoCode }>(
    `/api/admin/promo-codes/${encodeURIComponent(id)}`,
    {
      body: JSON.stringify(changes),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
    "Could not save the promo code.",
  );
}

export async function deletePromoCode(id: string) {
  return requestJson<{ success?: boolean }>(
    `/api/admin/promo-codes/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Could not delete the promo code.",
  );
}
