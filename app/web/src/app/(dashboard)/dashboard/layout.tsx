import { cookies } from "next/headers";

import { I18nProvider, resolveLocale } from "@/lib/i18n";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLocale = resolveLocale(cookieStore.get("ibpa-locale")?.value);

  return <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>;
}
