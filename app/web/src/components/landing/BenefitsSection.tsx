import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Books, Medal, SealCheck, Ticket, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";

type BenefitsSectionProps = {
  locale: "en" | "ru" | "uk";
};

export const BenefitsSection = ({ locale }: BenefitsSectionProps) => {
  const copy =
    locale === "ru"
      ? {
          eyebrow: "Преимущества сообщества",
          title: "Почему IBPA",
          detailsCta: "Все тарифы и пакеты",
          description:
            "Членство в ассоциации создано для того, чтобы усиливать вашу профессиональную репутацию, видимость и доступ к международному beauty-сообществу.",
          imageAlt: "Преимущества сообщества IBPA",
          items: [
            {
              title: "Образование",
              desc: "Доступ к образовательным программам, вебинарам, ресурсам и материалам для профессионального развития.",
              icon: <Books weight="thin" size={40} className="text-current" />,
            },
            {
              title: "Стандарты",
              desc: "Профессиональные стандарты, лучшие практики и этические принципы работы в индустрии красоты.",
              icon: <SealCheck weight="thin" size={40} className="text-current" />,
            },
            {
              title: "Сообщество",
              desc: "Глобальная профессиональная сеть, объединяющая экспертов индустрии красоты со всего мира.",
              icon: <UsersThree weight="thin" size={40} className="text-current" />,
            },
            {
              title: "Признание",
              desc: "Профессиональное признание через сертификат участника, размещение в каталоге участников и официальные подтверждения ассоциации.",
              icon: <Medal weight="thin" size={40} className="text-current" />,
            },
            {
              title: "События",
              desc: "Доступ к конференциям, мастер-классам, нетворкинг-событиям, профессиональным форумам и соревнованиям.",
              icon: <Ticket weight="thin" size={40} className="text-current" />,
            },
          ],
        }
      : locale === "uk"
        ? {
            eyebrow: "Переваги спільноти",
            title: "Чому IBPA",
            detailsCta: "Усі тарифи та пакети",
            description:
              "Членство створене для того, щоб посилювати вашу професійну репутацію, видимість і доступ до міжнародної beauty-спільноти.",
            imageAlt: "Переваги спільноти IBPA",
            items: [
              {
                title: "Освіта",
                desc: "Доступ до освітніх програм, вебінарів, ресурсів і матеріалів для професійного розвитку.",
                icon: <Books weight="thin" size={40} className="text-current" />,
              },
              {
                title: "Стандарти",
                desc: "Професійні стандарти, найкращі практики та етичні принципи роботи в beauty-індустрії.",
                icon: <SealCheck weight="thin" size={40} className="text-current" />,
              },
              {
                title: "Спільнота",
                desc: "Глобальна професійна мережа, що об’єднує експертів індустрії краси з усього світу.",
                icon: <UsersThree weight="thin" size={40} className="text-current" />,
              },
              {
                title: "Визнання",
                desc: "Професійне визнання через сертифікат учасника, каталог учасників і офіційні підтвердження асоціації.",
                icon: <Medal weight="thin" size={40} className="text-current" />,
              },
              {
                title: "Події",
                desc: "Доступ до конференцій, майстер-класів, нетворкінг-подій, професійних форумів і змагань.",
                icon: <Ticket weight="thin" size={40} className="text-current" />,
              },
            ],
          }
        : {
            eyebrow: "Membership Benefits",
            title: "Why Join IBPA",
            detailsCta: "All Membership Details",
            description:
              "Membership is designed to build credibility, visibility, and meaningful access across the international beauty industry.",
            imageAlt: "Benefits of the IBPA community",
            items: [
              {
                title: "Education",
                desc: "Access to educational programs, webinars, resources, and professional development materials.",
                icon: <Books weight="thin" size={40} className="text-current" />,
              },
              {
                title: "Standards",
                desc: "Professional standards, best practices, and ethical guidelines for working in the beauty industry.",
                icon: <SealCheck weight="thin" size={40} className="text-current" />,
              },
              {
                title: "Community",
                desc: "A global professional network connecting beauty experts from around the world.",
                icon: <UsersThree weight="thin" size={40} className="text-current" />,
              },
              {
                title: "Recognition",
                desc: "Professional recognition through membership certification, member directory listings, and official association credentials.",
                icon: <Medal weight="thin" size={40} className="text-current" />,
              },
              {
                title: "Events",
                desc: "Access to conferences, workshops, networking events, industry forums, and professional competitions.",
                icon: <Ticket weight="thin" size={40} className="text-current" />,
              },
            ],
          };

  const useEnglishHomepageTypography = true;
  const headlineClassName = useEnglishHomepageTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";

  return (
    <section className="relative overflow-hidden bg-[#EFF3F7] py-20 md:py-40">
      <div className="absolute inset-0 overflow-hidden lg:hidden">
        <ImageWithFallback
          src="/home/clients-33.webp"
          alt={copy.imageAlt}
          className="h-full w-full object-cover object-[24%_center]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>
      <div className="absolute inset-y-0 right-0 hidden w-[48%] overflow-hidden lg:block">
        <ImageWithFallback
          src="/home/clients-33.webp"
          alt={copy.imageAlt}
          className="absolute inset-0 h-full w-full object-cover object-left"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-y-0 left-0 w-[42%] bg-[linear-gradient(90deg,#EFF3F7_0%,#EFF3F7_12%,rgba(239,243,247,0.98)_28%,rgba(239,243,247,0.82)_46%,rgba(239,243,247,0.48)_66%,rgba(239,243,247,0.16)_84%,rgba(239,243,247,0)_100%)]" />
      </div>
      <div className="absolute inset-y-0 left-0 hidden w-[40%] bg-[#EFF3F7] lg:block" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="lg:max-w-[48rem]">
          <div className="max-w-3xl space-y-6 px-0 py-4 md:hidden">
            <p className={`text-sm uppercase tracking-[0.4em] text-white ${uiClassName}`}>{copy.eyebrow}</p>
            <h2 className={`max-w-4xl text-[2.75rem] uppercase leading-[0.94] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] ${headlineClassName}`}>
              {copy.title}
            </h2>
            <p className={`max-w-2xl text-[1.1rem] leading-relaxed text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] ${bodyClassName}`}>
              {copy.description}
            </p>
            <Link
              href="/membership"
              className={`group inline-flex items-center gap-4 border-b-2 border-white pb-2 text-sm uppercase tracking-[0.14em] text-white transition-all hover:border-white/80 hover:text-white ${uiClassName}`}
            >
              {copy.detailsCta}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
            </Link>
          </div>

          <div className="hidden max-w-3xl space-y-6 px-0 py-4 md:block">
            <p className={`text-sm uppercase tracking-[0.4em] text-[#708090] ${uiClassName}`}>{copy.eyebrow}</p>
            <h2 className={`max-w-4xl text-[2.75rem] uppercase leading-[0.94] !text-slate-900 md:text-[4.85rem] ${headlineClassName}`}>
              {copy.title}
            </h2>
            <p className={`max-w-2xl text-[1.32rem] leading-relaxed !text-slate-700 ${bodyClassName}`}>
              {copy.description}
            </p>
            <Link
              href="/membership"
              className={`group inline-flex items-center gap-4 border-b-2 border-black pb-2 text-sm uppercase tracking-[0.14em] !text-slate-900 transition-all hover:border-[#72A0C1] hover:!text-[#72A0C1] ${uiClassName}`}
            >
              {copy.detailsCta}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
            </Link>
          </div>

          <div className="mt-8 flex max-w-[34rem] flex-col gap-1 md:hidden">
            {copy.items.map((benefit) => (
              <div key={benefit.title} className="group border-b border-slate-400/25 py-4 last:border-b-0 md:py-4">
                <div className="flex gap-4 md:gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
                    <div className="scale-[0.92] md:scale-100">{benefit.icon}</div>
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <h3 className={`text-[1.05rem] font-bold uppercase tracking-[0.04em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] ${headlineClassName}`}>
                      {benefit.title}
                    </h3>
                    <p className={`max-w-[28rem] text-[0.95rem] leading-relaxed text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] ${bodyClassName}`}>
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 hidden max-w-[34rem] flex-col gap-2 md:flex">
            {copy.items.map((benefit) => (
              <div key={benefit.title} className="group border-b border-slate-400/25 py-4 last:border-b-0">
                <div className="flex gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center text-[#72A0C1]">
                    <div>{benefit.icon}</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-[1.12rem] font-bold uppercase tracking-[0.04em] text-slate-900 ${headlineClassName}`}>
                      {benefit.title}
                    </h3>
                    <p className={`max-w-[28rem] text-[0.98rem] leading-relaxed text-slate-700 ${bodyClassName}`}>
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
