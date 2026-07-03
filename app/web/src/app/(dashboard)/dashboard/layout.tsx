import { cookies } from "next/headers";

import { AppClerkProvider } from "@/lib/clerk-provider";
import { I18nProvider } from "@/lib/i18n";
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
      <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
    </AppClerkProvider>
  );
}
