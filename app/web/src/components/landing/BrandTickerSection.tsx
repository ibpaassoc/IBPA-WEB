import React from "react";

type BrandTickerSectionProps = {
  locale: "en" | "ru" | "uk";
};

export const BrandTickerSection = ({ locale }: BrandTickerSectionProps) => {
  const items =
    locale === "ru"
      ? [
          "Эксклюзивные ресурсы",
          "Профессиональный рост",
          "Глобальный нетворкинг",
          "Признание в индустрии",
        ]
      : locale === "uk"
        ? [
            "Ексклюзивні ресурси",
            "Професійне зростання",
            "Глобальний нетворкінг",
            "Визнання в індустрії",
          ]
        : [
            "Exclusive Resources",
            "Professional Growth",
            "Global Networking",
            "Industry Recognition",
          ];

  return (
    <section className="relative overflow-hidden bg-[#6E9AB8] py-5 text-white md:py-6">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.12),transparent_18%,transparent_82%,rgba(255,255,255,0.12))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/20" />

      <div className="relative overflow-hidden">
        <div className="ibpa-marquee flex items-center whitespace-nowrap text-xs font-bold uppercase tracking-[0.18em] md:text-sm">
          {items.concat(items).map((item, index) => (
            <React.Fragment key={`${item}-${index}`}>
              <span className="px-5 md:px-7">{item}</span>
              <span className="inline-flex items-center gap-3 px-1 text-white/70">
                <span className="h-[7px] w-[7px] rotate-45 rounded-[1px] border border-white/75" />
                <span className="h-px w-8 bg-white/35" />
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
