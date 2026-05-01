import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { I18nProvider, type Locale } from "@/lib/i18n";
import { getDashboardUrl } from "@/lib/public-urls";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("ibpa-locale")?.value;
  const initialLocale: Locale =
    localeCookie === "ru" || localeCookie === "uk" ? localeCookie : "en";
  const dashboardHref = getDashboardUrl() || "/";

  return (
    <I18nProvider initialLocale={initialLocale}>
      <Navbar dashboardHref={dashboardHref} />
      <main>{children}</main>
      <Footer />
      <CookieConsentBanner />
    </I18nProvider>
  );
}
