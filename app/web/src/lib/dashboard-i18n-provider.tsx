"use client";

import { dashboardDictionaries } from "@/lib/dashboard-i18n";
import { I18nProvider, type Locale } from "@/lib/i18n";

/**
 * I18nProvider variant that also loads the (large) dashboard dictionary.
 * Only the dashboard route group uses this, keeping the dictionary out of
 * the public pages' client bundle.
 */
export function DashboardI18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return (
    <I18nProvider
      initialLocale={initialLocale}
      dashboardDictionaries={dashboardDictionaries}
    >
      {children}
    </I18nProvider>
  );
}
