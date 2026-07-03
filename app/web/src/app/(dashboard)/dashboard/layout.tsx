import { cookies } from "next/headers";

import { AppClerkProvider } from "@/lib/clerk-provider";
import { DashboardI18nProvider } from "@/lib/dashboard-i18n-provider";
import { resolveLocale } from "@/lib/locale";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLocale = resolveLocale(cookieStore.get("ibpa-locale")?.value);

  return (
    <AppClerkProvider>
      <DashboardI18nProvider initialLocale={initialLocale}>
        {children}
      </DashboardI18nProvider>
    </AppClerkProvider>
  );
}
