import Script from "next/script";
import { cookies } from "next/headers";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { I18nProvider } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const localeCookie = cookieStore.get("ibpa-locale")?.value;

  const initialLocale = resolveLocale(localeCookie);

  const dashboardHref = "/dashboard";

  return (
    <I18nProvider initialLocale={initialLocale}>
      {/* Meta Domain Verification */}
      <meta
        name="facebook-domain-verification"
        content="1oij9v4q95qd0cudvfkr5tnmmgr2yw"
      />

      {/* Google Analytics — public pages only, keeps admin/dashboard free of tracking JS */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-LZH8FD9QR6"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-LZH8FD9QR6');
        `}
      </Script>

      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');

          fbq('init', '1312423774195049');
          fbq('track', 'PageView');
        `}
      </Script>

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1312423774195049&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>

      <Navbar dashboardHref={dashboardHref} />

      <main>{children}</main>

      <Footer />

      <CookieConsentBanner />
    </I18nProvider>
  );
}
