"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Crown, Megaphone, Check } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";
import { fetchPublicContent, type PublicContentItem } from "@/lib/public-content";
import { getDefaultPartnerCards, mergePartnerCards, type PartnerContentItem } from "@/lib/partners";

type SponsorshipTier = "Associate" | "Community" | "Premier";

export default function PartnershipPage() {
  const { locale } = useI18n();
  const isRu = locale === "ru";
  const isUk = locale === "uk";
  const useEnglishTypography = true;
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [honeypot, setHoneypot] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitState, setSubmitState] = React.useState<"idle" | "success" | "error">("idle");
  const [checkoutTier, setCheckoutTier] = React.useState<SponsorshipTier | null>(null);
  const [partnerCards, setPartnerCards] = React.useState(() => getDefaultPartnerCards(locale));

  React.useEffect(() => {
    setPartnerCards(getDefaultPartnerCards(locale));
  }, [locale]);

  React.useEffect(() => {
    let isMounted = true;

    fetchPublicContent("partners", "site")
      .then((items: PublicContentItem[]) => {
        if (!isMounted) return;
        const merged = mergePartnerCards(
          locale,
          items as PartnerContentItem[],
        );
        setPartnerCards(merged);
      })
      .catch(() => {
        if (!isMounted) return;
        setPartnerCards(getDefaultPartnerCards(locale));
      });

    return () => {
      isMounted = false;
    };
  }, [locale]);

  const sponsorshipPackages = [
    {
      tier: "Associate" as const,
      name: "Associate",
      price: "$500/year",
      icon: <Megaphone size={22} />,
      bestFor: isRu
        ? "Для брендов, которые впервые входят в профессиональное сообщество."
        : isUk
          ? "Для брендів, які вперше входять у професійну спільноту."
          : "Best for brands entering the professional community space for the first time.",
      features: [
        isRu ? "размещение логотипа в разделе Partners на сайте IBPA" : isUk ? "розміщення логотипа в розділі Partners на сайті IBPA" : "Logo placement in the Partners section of the IBPA website",
        isRu ? "упоминание бренда в соцсетях IBPA 1 раз в квартал" : isUk ? "згадка бренду в соцмережах IBPA 1 раз на квартал" : "Brand acknowledgment in IBPA social media once per quarter",
        isRu ? "логотип во всех цифровых материалах мероприятий IBPA" : isUk ? "логотип у всіх цифрових матеріалах заходів IBPA" : "Logo included in digital materials for all IBPA events",
      ],
    },
    {
      tier: "Community" as const,
      name: "Community",
      price: "$1,500/year",
      icon: <BadgeCheck size={22} />,
      bestFor: isRu
        ? "Для брендов, которым нужна стабильная видимость во всех точках контакта IBPA."
        : isUk
          ? "Для брендів, яким потрібна стабільна присутність у всіх точках контакту IBPA."
          : "Best for brands seeking consistent presence across IBPA touchpoints.",
      features: [
        isRu ? "все, что входит в Associate" : isUk ? "усе, що входить до Associate" : "Everything included in Associate",
        isRu ? "feature brand spotlight в newsletter IBPA 1 раз в год" : isUk ? "feature brand spotlight у newsletter IBPA 1 раз на рік" : "Featured brand spotlight in the IBPA newsletter once per year",
        isRu ? "логотип на всех event banners и digital event materials" : isUk ? "логотип на всіх event banners і digital event materials" : "Logo on all event banners and digital event materials",
        isRu ? "отдельная страница профиля бренда на сайте IBPA" : isUk ? "окрема сторінка профілю бренду на сайті IBPA" : "Dedicated brand profile page on the IBPA website",
        isRu ? "badge Supporting Partner of IBPA для материалов бренда" : isUk ? "badge Supporting Partner of IBPA для матеріалів бренду" : "Supporting Partner of IBPA badge for use in brand materials",
      ],
    },
    {
      tier: "Premier" as const,
      name: "Premier",
      price: "$3,000/year",
      icon: <Crown size={22} />,
      bestFor: isRu
        ? "Для брендов, которым нужна глубокая интеграция и совместные брендированные возможности."
        : isUk
          ? "Для брендів, яким потрібна глибока інтеграція та спільні брендовані можливості."
          : "Best for brands looking for deep integration and co-branded opportunities.",
      features: [
        isRu ? "все, что входит в Community" : isUk ? "усе, що входить до Community" : "Everything included in Community",
        isRu ? "отдельное email-упоминание для базы IBPA 1 раз в год" : isUk ? "окреме email-визнання для бази IBPA 1 раз на рік" : "Dedicated email acknowledgment to the IBPA member base once per year",
        isRu ? "co-branded content: webinar, article или social campaign" : isUk ? "co-branded content: webinar, article або social campaign" : "Co-branded content opportunity such as a webinar, article, or social campaign",
        isRu ? "слот для выступления или презентации на ежегодном событии IBPA" : isUk ? "слот для виступу або презентації на щорічній події IBPA" : "Speaking or presentation slot at the IBPA annual event",
        isRu ? "badge Official Premier Partner of IBPA для материалов бренда" : isUk ? "badge Official Premier Partner of IBPA для матеріалів бренду" : "Official Premier Partner of IBPA badge for use in brand materials",
        isRu ? "приоритетное размещение во всех цифровых каналах IBPA" : isUk ? "пріоритетне розміщення в усіх цифрових каналах IBPA" : "Priority placement across all IBPA digital channels",
      ],
    },
  ];

  const copy = {
    eyebrow: isRu ? "Партнерство" : isUk ? "Партнерство" : "Partnership",
    title: isRu ? "Партнёрство с IBPA" : isUk ? "Партнерство з IBPA" : "Partner With IBPA",
    subtitle: isRu
      ? "Поддержите профессиональное beauty-сообщество и укрепите узнаваемость бренда среди практикующих специалистов, преподавателей и владельцев бизнеса."
      : isUk
        ? "Підтримайте професійну beauty-спільноту та посильте впізнаваність бренду серед практикуючих фахівців, викладачів і власників бізнесу."
        : "Support the professional beauty community and build brand recognition among working specialists, educators, and business owners.",
    ctaTitle: isRu ? "Станьте спонсором IBPA" : isUk ? "Станьте спонсором IBPA" : "Become an IBPA Sponsor",
    ctaBody: isRu
      ? "Спонсорские пакеты IBPA отделены от Brand Membership. Спонсорство — это маркетинговое соглашение и формат видимости без review-заявки и без membership status."
      : isUk
        ? "Спонсорські пакети IBPA відокремлені від Brand Membership. Спонсорство — це маркетингова угода та формат видимості без review-заявки і без membership status."
        : "IBPA sponsorship packages are separate from Brand Membership. Sponsorship is a marketing and visibility agreement with no application review and no membership status.",
    sponsorshipIntro: isRu
      ? "Этот формат создан для брендов, которым нужна видимость перед профессиональной аудиторией IBPA через упоминания, co-branded content и присутствие на событиях. Уже есть Brand Membership? Спонсорство даёт дополнительную видимость поверх membership benefits."
      : isUk
        ? "Цей формат створено для брендів, яким потрібна видимість перед професійною аудиторією IBPA через згадки, co-branded content і присутність на подіях. Уже маєте Brand Membership? Спонсорство дає додаткову видимість понад membership benefits."
        : "It is designed for brands that want to reach the IBPA professional audience through acknowledgment, co-branded content, and event presence. Already a Brand Member? Sponsorship packages offer additional visibility beyond what membership includes.",
    ctaPrimary: isRu ? "Оставить sponsorship inquiry" : isUk ? "Надіслати sponsorship inquiry" : "Apply for Sponsorship",
    ctaSecondary: isRu ? "Смотреть membership" : isUk ? "Переглянути membership" : "Explore Membership",
    packageEyebrow: isRu ? "Спонсорские пакеты" : isUk ? "Спонсорські пакети" : "Sponsorship Packages",
    packageTitle: isRu ? "Выберите уровень видимости бренда" : isUk ? "Оберіть рівень видимості бренду" : "Choose the Visibility Level That Fits Your Brand",
    packageIntro: isRu
      ? "Названия sponsorship-пакетов намеренно отделены от membership tiers, чтобы различать профессиональный статус и маркетинговую видимость."
      : isUk
        ? "Назви sponsorship-пакетів навмисно відокремлені від membership tiers, щоб розрізняти професійний статус і маркетингову видимість."
        : "These sponsorship tiers are intentionally separate from membership categories so professional standing and marketing visibility stay clearly distinct.",
    partnersEyebrow: isRu ? "Действующие партнёры" : isUk ? "Чинні партнери" : "Current Partners",
    partnersTitle: isRu ? "Кого уже можно увидеть в экосистеме IBPA" : isUk ? "Кого вже можна побачити в екосистемі IBPA" : "Who Is Already Part of the IBPA Ecosystem",
    partnersIntro: isRu
      ? "На этой странице представлены партнёры, которые уже поддерживают ценности ассоциации, её культурный контекст и профессиональное развитие индустрии."
      : isUk
        ? "На цій сторінці представлені партнери, які вже підтримують цінності асоціації, її культурний контекст і професійний розвиток індустрії."
        : "This page highlights partners already supporting the association's values, cultural context, and professional development mission.",
    capabilities: isRu
      ? ["Бренды", "Медиа", "Образование", "Совместные проекты"]
      : isUk
        ? ["Бренди", "Медіа", "Освіта", "Спільні проєкти"]
        : ["Brands", "Media", "Education", "Collaborations"],
    formEyebrow: isRu ? "Заявка на партнерство" : isUk ? "Заявка на партнерство" : "Partnership Inquiry",
    formTitle: isRu ? "Оставьте заявку" : isUk ? "Залиште заявку" : "Send an Inquiry",
    formBody: isRu
      ? "Расскажите о бренде, ваших целях и желаемом sponsorship package. Команда IBPA ответит в течение 3 рабочих дней."
      : isUk
        ? "Розкажіть про бренд, ваші цілі та бажаний sponsorship package. Команда IBPA відповість протягом 3 робочих днів."
        : "Interested in becoming a sponsor? Use the inquiry form below to tell us about your brand and goals. The IBPA team will respond within 3 business days.",
    legalTitle: isRu ? "Важное юридическое примечание" : isUk ? "Важлива юридична примітка" : "Important Legal Note",
    legalBody: isRu
      ? "Спонсорство IBPA означает признание и упоминание бренда в поддержку профессиональной миссии ассоциации. Это не является одобрением какого-либо бренда, продукта или услуги со стороны IBPA."
      : isUk
        ? "Спонсорство IBPA означає визнання та згадку бренду на підтримку професійної місії асоціації. Це не є схваленням будь-якого бренду, продукту чи послуги з боку IBPA."
        : "IBPA sponsorship constitutes brand acknowledgment and recognition in support of the association's professional mission. It does not constitute endorsement of any brand, product, or service by IBPA.",
    name: isRu ? "Имя" : isUk ? "Ім’я" : "Name",
    email: isRu ? "Email" : isUk ? "Email" : "Email",
    phone: isRu ? "Телефон" : isUk ? "Телефон" : "Phone",
    message: isRu ? "Сообщение" : isUk ? "Повідомлення" : "Message",
    submit: isRu ? "Отправить заявку" : isUk ? "Надіслати заявку" : "Send Inquiry",
    buyNow: isRu ? "Оплатить пакет" : isUk ? "Оплатити пакет" : "Purchase package",
    checkoutLoading: isRu ? "Переход к оплате..." : isUk ? "Перехід до оплати..." : "Redirecting to checkout...",
    success: isRu ? "Спасибо! Запрос отправлен команде IBPA." : isUk ? "Дякуємо! Запит надіслано команді IBPA." : "Thank you. Your inquiry has been sent to the IBPA team.",
    error: isRu ? "Не удалось отправить заявку. Попробуйте еще раз." : isUk ? "Не вдалося надіслати заявку. Спробуйте ще раз." : "We couldn't send your inquiry. Please try again.",
    placeholders: {
      name: isRu ? "Ваше имя" : isUk ? "Ваше ім’я" : "Your name",
      email: isRu ? "Ваш email" : isUk ? "Ваш email" : "Your email",
      phone: isRu ? "Ваш телефон" : isUk ? "Ваш телефон" : "Your phone",
      message: isRu ? "Расскажите о бренде, целях и пакете, который хотите обсудить" : isUk ? "Розкажіть про бренд, цілі та пакет, який хочете обговорити" : "Tell us about your brand, goals, and the package you want to discuss",
    },
  };

  const faqItems = [
    {
      question: isRu
        ? "Чем sponsorship отличается от Brand Membership?"
        : isUk
          ? "Чим sponsorship відрізняється від Brand Membership?"
          : "How is sponsorship different from Brand Membership?",
      answer: isRu
        ? "Brand Membership — это подтвержденный профессиональный статус внутри ассоциации. Sponsorship — отдельное маркетинговое и visibility-соглашение без membership status."
        : isUk
          ? "Brand Membership — це підтверджений професійний статус усередині асоціації. Sponsorship — окрема маркетингова й visibility-угода без membership status."
          : "Brand Membership is a verified professional standing within the association. Sponsorship is a separate marketing and visibility agreement with no membership status.",
    },
    {
      question: isRu
        ? "Сколько времени занимает рассмотрение партнёрского запроса?"
        : isUk
          ? "Скільки часу займає розгляд партнерського запиту?"
          : "How long does a partnership inquiry usually take to review?",
      answer: isRu
        ? "Обычно команда отвечает в течение 3 рабочих дней. Если запрос требует дополнительного внутреннего review, срок может быть немного дольше."
        : isUk
          ? "Зазвичай команда відповідає протягом 3 робочих днів. Якщо запит потребує додаткового внутрішнього review, термін може бути трохи довшим."
          : "The team usually responds within 3 business days. If the inquiry needs additional internal review, the timeline can be slightly longer.",
    },
    {
      question: isRu
        ? "Куда идти бренду, если ему нужен статус, а не visibility?"
        : isUk
          ? "Куди йти бренду, якщо йому потрібен статус, а не visibility?"
          : "Looking for membership status instead of sponsorship visibility?",
      answer: isRu
        ? "Если бренду важен подтвержденный профессиональный статус внутри ассоциации, лучше начать со страницы membership и пакета Brand Member."
        : isUk
          ? "Якщо бренду важливий підтверджений професійний статус усередині асоціації, краще почати зі сторінки membership і пакета Brand Member."
          : "If your brand needs verified professional standing inside the association, start with the Brand Member option on the membership page.",
    },
  ];

  const handleChange = (field: "name" | "email" | "phone" | "message") =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: "Partnership page",
          honeypot,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setForm({ name: "", email: "", phone: "", message: "" });
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startCheckout = async (tier: SponsorshipTier) => {
    try {
      setCheckoutTier(tier);
      setSubmitState("idle");

      const response = await fetch("/api/orders/sponsorship/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        throw new Error("Checkout request failed");
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("Missing checkout URL");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setCheckoutTier(null);
      setSubmitState("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F5] pt-36 pb-24 md:pt-44">
      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="space-y-8">
              <p className={`text-[10px] font-bold uppercase tracking-[0.42em] text-[#72A0C1] ${uiClassName}`}>{copy.eyebrow}</p>
              <h1 className={`max-w-5xl text-6xl sm:text-7xl md:text-9xl uppercase leading-[0.92] text-slate-900 ${headlineClassName}`}>
                {copy.title}
              </h1>
              <p className={`max-w-3xl text-lg leading-relaxed text-slate-600 md:text-2xl ${bodyClassName}`}>{copy.subtitle}</p>
              <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                <Link
                  href="#partnership-inquiry"
                  className={`inline-flex items-center justify-center gap-3 rounded-full bg-black px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-white transition-transform hover:scale-[1.02] ${uiClassName}`}
                >
                  {copy.ctaPrimary}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/membership"
                  className={`inline-flex items-center justify-center rounded-full border border-slate-300 px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-slate-900 ${uiClassName}`}
                >
                  {copy.ctaSecondary}
                </Link>
              </div>
              <div className="rounded-[28px] border border-[#D8E4EC] bg-white/70 p-6">
                <p className={`text-sm leading-relaxed text-slate-600 ${bodyClassName}`}>{copy.sponsorshipIntro}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {copy.capabilities.map((item) => (
                <div key={item} className="border-b border-slate-300/60 py-4 last:border-b-0">
                  <p className={`text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 ${uiClassName}`}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12 pt-20 md:pb-20 md:pt-28">
        <div className="mx-auto mb-12 max-w-7xl rounded-[40px] bg-white px-8 py-8 shadow-[0_18px_54px_rgba(15,23,42,0.08)] md:px-10">
          <div className="max-w-4xl space-y-4">
            <p className={`text-[10px] font-bold uppercase tracking-[0.42em] text-[#72A0C1] ${uiClassName}`}>{copy.packageEyebrow}</p>
            <h2 className={`text-4xl uppercase leading-none text-slate-900 md:text-6xl ${headlineClassName}`}>{copy.packageTitle}</h2>
            <p className={`text-lg leading-relaxed text-slate-600 md:text-xl ${bodyClassName}`}>{copy.packageIntro}</p>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {sponsorshipPackages.map((pkg) => (
              <article key={pkg.name} className="rounded-[32px] border border-[#DCE7EE] bg-[#F8FBFD] p-8 shadow-sm">
                <div className="flex items-center gap-3 text-[#72A0C1]">
                  {pkg.icon}
                  <p className={`text-[10px] font-bold uppercase tracking-[0.36em] text-slate-400 ${uiClassName}`}>{copy.packageEyebrow}</p>
                </div>
                <h3 className={`mt-5 text-3xl uppercase text-slate-900 ${headlineClassName}`}>{pkg.name}</h3>
                <p className={`mt-3 text-3xl text-[#7A98AF] ${headlineClassName}`}>{pkg.price}</p>
                <p className={`mt-4 text-base leading-relaxed text-slate-600 ${bodyClassName}`}>{pkg.bestFor}</p>
                <div className="mt-6 space-y-4">
                  {pkg.features.map((feature) => (
                    <div key={feature} className={`flex items-start gap-3 text-slate-600 ${bodyClassName}`}>
                      <Check className="mt-1 flex-shrink-0 text-[#72A0C1]" size={16} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => startCheckout(pkg.tier)}
                  disabled={checkoutTier !== null}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-black px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-white transition-transform hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70 ${uiClassName}`}
                >
                  {checkoutTier === pkg.tier ? copy.checkoutLoading : copy.buyNow}
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="max-w-4xl space-y-5">
            <p className={`text-[10px] font-bold uppercase tracking-[0.42em] text-[#72A0C1] ${uiClassName}`}>{copy.partnersEyebrow}</p>
            <h2 className={`text-4xl uppercase leading-none text-slate-900 md:text-6xl ${headlineClassName}`}>
              {copy.partnersTitle}
            </h2>
            <p className={`text-lg leading-relaxed text-slate-600 md:text-xl ${bodyClassName}`}>{copy.partnersIntro}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {partnerCards.map((partner) => (
              <motion.article
                key={partner.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_18px_54px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-center gap-5 p-6 md:gap-6 md:p-8">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-slate-100 bg-[#F8FAFC] md:h-24 md:w-24">
                    <ImageWithFallback
                      src={partner.logo}
                      alt={partner.name}
                      className="h-10 w-auto max-w-[70px] object-contain md:h-12 md:max-w-[88px]"
                    />
                  </div>

                  <div className="min-w-0 space-y-3">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.36em] text-slate-400 ${uiClassName}`}>{copy.eyebrow}</p>
                    <h3 className={`text-2xl uppercase leading-none text-slate-900 md:text-4xl ${headlineClassName}`}>
                      {partner.name}
                    </h3>
                    <p className={`max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base ${bodyClassName}`}>
                      {partner.description}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="partnership-inquiry" className="px-6 pb-14 md:pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 rounded-[34px] border border-[#DCE7EE] bg-[#EEF3F6] px-8 py-7 shadow-sm">
            <p className={`text-[10px] font-bold uppercase tracking-[0.42em] text-[#72A0C1] ${uiClassName}`}>{copy.legalTitle}</p>
            <p className={`mt-3 max-w-5xl text-base leading-relaxed text-slate-600 ${bodyClassName}`}>{copy.legalBody}</p>
          </div>
          <div className="grid gap-10 rounded-[44px] bg-white px-8 py-10 shadow-[0_18px_54px_rgba(15,23,42,0.08)] md:px-12 md:py-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="space-y-6">
              <p className={`text-[10px] font-bold uppercase tracking-[0.42em] text-[#72A0C1] ${uiClassName}`}>{copy.formEyebrow}</p>
              <h2 className={`max-w-3xl text-4xl uppercase leading-none text-slate-900 md:text-6xl ${headlineClassName}`}>
                {copy.formTitle}
              </h2>
              <p className={`max-w-2xl text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>{copy.formBody}</p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="hidden" aria-hidden="true">
                <label htmlFor="partnership-company-website">Company website</label>
                <input
                  id="partnership-company-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </div>
              <label className="space-y-2">
                <span className={`text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 ${uiClassName}`}>{copy.name}</span>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder={copy.placeholders.name}
                  className="w-full rounded-[22px] border border-slate-200 bg-[#F8FBFD] px-5 py-4 text-slate-900 outline-none transition-all focus:border-[#72A0C1]"
                />
              </label>
              <label className="space-y-2">
                <span className={`text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 ${uiClassName}`}>{copy.email}</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder={copy.placeholders.email}
                  className="w-full rounded-[22px] border border-slate-200 bg-[#F8FBFD] px-5 py-4 text-slate-900 outline-none transition-all focus:border-[#72A0C1]"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className={`text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 ${uiClassName}`}>{copy.phone}</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder={copy.placeholders.phone}
                  className="w-full rounded-[22px] border border-slate-200 bg-[#F8FBFD] px-5 py-4 text-slate-900 outline-none transition-all focus:border-[#72A0C1]"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className={`text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 ${uiClassName}`}>{copy.message}</span>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={handleChange("message")}
                  placeholder={copy.placeholders.message}
                  className="w-full resize-none rounded-[26px] border border-slate-200 bg-[#F8FBFD] px-5 py-4 text-slate-900 outline-none transition-all focus:border-[#72A0C1]"
                />
              </label>
              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center justify-center gap-3 rounded-full bg-black px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition-transform hover:scale-[1.02] ${uiClassName}`}
                >
                  {isSubmitting ? "Sending..." : copy.submit}
                  <ArrowRight size={16} />
                </button>
                {submitState === "success" && <p className={`mt-3 text-sm text-emerald-600 ${bodyClassName}`}>{copy.success}</p>}
                {submitState === "error" && <p className={`mt-3 text-sm text-red-500 ${bodyClassName}`}>{copy.error}</p>}
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10 md:pb-16">
        <div className="mx-auto max-w-7xl rounded-[44px] bg-[#EEF3F6] px-8 py-10 md:px-12 md:py-12">
          <div className="max-w-3xl space-y-4">
            <p className={`text-[10px] font-bold uppercase tracking-[0.42em] text-[#72A0C1] ${uiClassName}`}>FAQ</p>
            <h2 className={`text-4xl uppercase leading-none text-slate-900 md:text-6xl ${headlineClassName}`}>
              {isRu ? "Частые вопросы о партнёрстве" : isUk ? "Часті запитання про партнерство" : "Partnership FAQ"}
            </h2>
          </div>
          <div className="mt-10 grid gap-4">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-[28px] border border-white/70 bg-white px-6 py-6 shadow-sm">
                <h3 className={`text-lg uppercase text-slate-900 md:text-2xl ${headlineClassName}`}>{item.question}</h3>
                <p className={`mt-3 max-w-4xl text-base leading-relaxed text-slate-600 ${bodyClassName}`}>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
