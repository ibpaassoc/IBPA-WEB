import type { Metadata } from "next";
import { cyrillicDisplay, cyrillicEditorial } from "@/lib/cyrillic-fonts";
import { getLandingOrigin } from "@/lib/public-urls";
import "../styles/index.css";
import { Inter, Raleway } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });
const raleway = Raleway({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-raleway" });

export const metadata: Metadata = {
  title: "IBPA - International Beauty Professionals Association",
  description: "Global professional community for beauty industry experts supporting growth, standards, and collaboration.",
  metadataBase: new URL(getLandingOrigin()),
  openGraph: {
    title: "IBPA - International Beauty Professionals Association",
    description: "A global professional community for beauty industry experts.",
      url: "https://ibpassociations.org",
    siteName: "IBPA",
    images: [
      {
        url: "@/public/file.svg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IBPA - International Beauty Professionals Association",
    description: "Global professional community for beauty industry experts.",
    images: ["/og-image.png"],
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
