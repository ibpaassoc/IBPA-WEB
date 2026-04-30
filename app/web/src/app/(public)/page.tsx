import { cookies } from "next/headers";
import { Hero } from "@/components/landing/Hero";
import { AboutSection } from "@/components/landing/AboutSection";
import { BrandTickerSection } from "@/components/landing/BrandTickerSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { EventsSection } from "@/components/landing/EventsSection";
import { NewsSection } from "@/components/landing/NewsSection";
import { MembersSpotlightSection } from "@/components/landing/MembersSpotlightSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { GovernancePreviewSection } from "@/components/landing/GovernancePreviewSection";
import { SponsorsSection } from "@/components/landing/SponsorsSection";
import { CTASection } from "@/components/landing/CTASection";
import { getPublicMembers } from "@/lib/public-members";

export default async function Home() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("ibpa-locale")?.value;
  const locale = localeCookie === "ru" || localeCookie === "uk" ? localeCookie : "en";
  const publicMembers = await getPublicMembers(locale);

  return (
    <div className="overflow-x-hidden bg-white selection:bg-[#72A0C1] selection:text-white">
      <Hero locale={locale} />
      <AboutSection />
      <BrandTickerSection locale={locale} />
      
      <AudienceSection />
      
      <BenefitsSection locale={locale} />
      
      <EventsSection locale={locale} />
      
      <NewsSection locale={locale} />

      <MembersSpotlightSection locale={locale} items={publicMembers} />
      
      <CommunitySection locale={locale} />

      <GovernancePreviewSection locale={locale} />

      <SponsorsSection locale={locale} />
      
      <CTASection locale={locale} />
    </div>
  );
}
