import type { Metadata } from "next";
import { cyrillicDisplay, cyrillicEditorial } from "@/lib/cyrillic-fonts";
import { SITE_DISPLAY_NAME } from "@/lib/seo/organization";
import { DEFAULT_OG_IMAGE, getSeoOrigin } from "@/lib/seo/site";
import "../styles/index.css";
import { Inter, Raleway } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });
const raleway = Raleway({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-raleway" });

// Routes that need to be found in search export their own metadata through
// `buildPageMetadata` (lib/seo/metadata.ts); this is the fallback for the rest.
export const metadata: Metadata = {
  metadataBase: new URL(getSeoOrigin()),
  title: "IBPA - International Beauty Professionals Association",
  description: "Global professional community for beauty industry experts supporting growth, standards, and collaboration.",
  applicationName: "IBPA",
  openGraph: {
    title: "IBPA - International Beauty Professionals Association",
    description: "A global professional community for beauty industry experts.",
    siteName: SITE_DISPLAY_NAME,
    images: [DEFAULT_OG_IMAGE],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IBPA - International Beauty Professionals Association",
    description: "Global professional community for beauty industry experts.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ClerkProvider intentionally lives in the route groups that use Clerk on the
  // client (dashboard, sign-in, checkout success, admin) so public landing
  // pages never download clerk-js.
  return (
    <html lang="en" className={cn("font-sans", inter.variable, cyrillicDisplay.variable, cyrillicEditorial.variable, raleway.variable)}>
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
