import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { getBackendUrl } from "@/lib/public-urls";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { getDefaultPartnerCards, mergePartnerCards, type Locale, type PartnerContentItem } from "@/lib/partners";

type SponsorsSectionProps = {
  locale: Locale;
};

async function fetchPartners(locale: Locale) {
  const fallback = getDefaultPartnerCards(locale);

  try {
    const response = await fetch(getBackendUrl("/api/content/public?type=partners&target=site"), {
      cache: "no-store",
    });

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json().catch(() => ({}));
    const items = Array.isArray(data.items) ? (data.items as PartnerContentItem[]) : [];
    return mergePartnerCards(locale, items);
  } catch {
    return fallback;
  }
}

export const SponsorsSection = async ({ locale }: SponsorsSectionProps) => {
  const partners = await fetchPartners(locale);
  const useEnglishHomepageTypography = true;
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;

  const content =
    locale === "ru"
      ? {
          title: "OURS PARTNERS",
        }
      : locale === "uk"
        ? {
            title: "OURS PARTNERS",
          }
        : {
            title: "OURS PARTNERS",
          };

  return (
    <section className="bg-[#F1F3F5] px-6 py-14 md:py-20">
      <div className="mx-auto max-w-6xl text-center">
        <a href="/partnership">
            <h2 className={`mx-auto max-w-4xl text-[2.4rem] uppercase leading-[0.92] text-slate-900 md:text-[4rem] ${headlineClassName}`}>
                {content.title}
            </h2>
        </a>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 md:mt-10 md:gap-8">
          {partners.map((partner) => (
            <div key={partner.id} className="flex h-14 items-center justify-center md:h-14">
              {partner.link ? (
                <a
                  href={partner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${partner.name} website`}
                  className="flex h-full items-center"
                >
                  <ImageWithFallback
                    src={partner.logo}
                    alt={partner.name}
                    width={160}
                    height={56}
                    className="h-full w-auto object-contain"
                    sizes="160px"
                  />
                </a>
              ) : (
                <ImageWithFallback
                  src={partner.logo}
                  alt={partner.name}
                  width={160}
                  height={56}
                  className="h-full w-auto object-contain"
                  sizes="160px"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
