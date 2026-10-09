import { cookies } from "next/headers";
import { JsonLd } from "@/components/seo/JsonLd";
import { Hero } from "@/components/landing/Hero";
import { AboutSection } from "@/components/landing/AboutSection";
import { AssociationOverviewSection } from "@/components/landing/AssociationOverviewSection";
import { BrandTickerSection } from "@/components/landing/BrandTickerSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { EventsSection } from "@/components/landing/EventsSection";
import { NewsSection } from "@/components/landing/NewsSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { MembersPreviewSection } from "@/features/members/components/MembersPreviewSection";
import { GovernancePreviewSection } from "@/components/landing/GovernancePreviewSection";
import { SponsorsSection } from "@/components/landing/SponsorsSection";
import { CTASection } from "@/components/landing/CTASection";
import { resolveLocale } from "@/lib/locale";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata({ ...PAGE_SEO.home, absoluteTitle: true });

export default async function Home() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("ibpa-locale")?.value;
  const locale = resolveLocale(localeCookie);

  return (
    <div className="overflow-x-hidden bg-white selection:bg-[#72A0C1] selection:text-white">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <Hero locale={locale} />
      <AboutSection />
      <BrandTickerSection locale={locale} />

      <AssociationOverviewSection locale={locale} />
      
      <AudienceSection />
      
      <BenefitsSection locale={locale} />
      
      <EventsSection locale={locale} />
      
      <NewsSection locale={locale} />

      <MembersPreviewSection locale={locale} />

      <CommunitySection locale={locale} />

      <GovernancePreviewSection locale={locale} />

      <SponsorsSection locale={locale} />
      
      <CTASection locale={locale} />
    </div>
  );
}
