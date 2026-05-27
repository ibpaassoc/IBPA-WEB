"use client";
import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Globe, ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateAccent, homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

export default function Contact() {
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
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 }
  };

  const contactInfo = [
    { 
      label: isRu ? "Позвоните нам" : isUk ? "Зателефонуйте нам" : "Call Us", 
      value: "+1 (279) 230-2804", 
      icon: <Phone size={24} strokeWidth={1.8} />, 
      link: "tel:+12792302804", 
      color: "#B9D9EB" 
    },
    { 
      label: isRu ? "Напишите нам" : isUk ? "Напишіть нам" : "Email Us", 
      value: "support@ibpassociations.org",
      icon: <Mail size={24} strokeWidth={1.8} />, 
      link: "mailto:support@ibpassociations.org", 
      color: "#708090" 
    },
    { 
      label: isRu ? "Посетите нас" : isUk ? "Завітайте до нас" : "Visit Us", 
      value: "1220 Melody Ln, Suite 110, Roseville, CA 95678", 
      icon: <MapPin size={22} strokeWidth={1.8} />, 
      link: "https://maps.google.com/?q=1220+Melody+Ln+Suite+110,+Roseville,+CA+95678", 
      color: "#B9D9EB" 
    }
  ];

  const copy = {
    formEyebrow: isRu ? "Форма обратной связи" : isUk ? "Форма зворотного зв’язку" : "Feedback Form",
    formTitle: isRu ? "Оставьте сообщение" : isUk ? "Залиште повідомлення" : "Send a Message",
    formBody: isRu
      ? "Если вы хотите обсудить членство, партнерство, участие в событиях или корпоративный запрос, заполните форму и мы свяжемся с вами по email."
      : isUk
        ? "Якщо ви хочете обговорити членство, партнерство, участь у подіях або корпоративний запит, заповніть форму і ми зв’яжемося з вами електронною поштою."
        : "If you want to discuss membership, partnership, event participation, or a corporate request, send us a short message and our team will reply by email.",
    name: isRu ? "Имя" : isUk ? "Ім’я" : "Name",
    email: "Email",
    phone: isRu ? "Телефон" : isUk ? "Телефон" : "Phone",
    message: isRu ? "Сообщение" : isUk ? "Повідомлення" : "Message",
    submit: isRu ? "Отправить" : isUk ? "Надіслати" : "Send",
    success: isRu ? "Спасибо! Ваш запрос отправлен." : isUk ? "Дякуємо! Ваш запит надіслано." : "Thank you. Your inquiry has been sent.",
    error: isRu ? "Не удалось отправить форму. Попробуйте еще раз." : isUk ? "Не вдалося надіслати форму. Спробуйте ще раз." : "We couldn't send your inquiry. Please try again.",
    placeholders: {
      name: isRu ? "Ваше имя" : isUk ? "Ваше ім’я" : "Your name",
      email: isRu ? "Ваш email" : isUk ? "Ваш email" : "Your email",
      phone: isRu ? "Ваш телефон" : isUk ? "Ваш телефон" : "Your phone",
      message: isRu ? "Коротко расскажите, чем мы можем помочь" : isUk ? "Коротко розкажіть, чим ми можемо допомогти" : "Tell us briefly how we can help",
    },
  };

  const handleChange =
    (field: "name" | "email" | "phone" | "message") =>
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
          source: "Contact page",
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

  return (
    <div className="min-h-screen bg-white selection:bg-[#72A0C1] selection:text-white">
      {/* Hero Section */}
      <section className="relative flex h-[calc(60vh+70px)] items-center justify-center overflow-hidden bg-[#F1F3F5]">
        <div className="absolute inset-0">
          <ImageWithFallback 
            src="/home/website-1.webp"
            className="h-full w-full object-cover md:object-[center_28%]"
            alt={isRu ? "Контакты IBPA" : isUk ? "Контакти IBPA" : "Contact"}
          />
        </div>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 text-left text-slate-900">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-6xl sm:text-7xl md:text-9xl uppercase leading-[0.92] ${headlineClassName}`}
          >
            <span className="text-[#B9D9EB]">{isRu ? "Контакты" : isUk ? "Контакти" : "Contact"}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-2 text-3xl lowercase text-slate-400 md:-mt-6 md:text-5xl ${homeTemplateAccent.className}`}
          >
            {isRu ? "СВЯЖИТЕСЬ С НАМИ" : isUk ? "ЗВ’ЯЖІТЬСЯ З НАМИ" : "GET IN TOUCH"}
          </motion.p>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-start">
        <motion.div {...fadeInUp} className="space-y-16">
          <div className="space-y-6">
            <h2 className={`text-[2.75rem] uppercase leading-[0.94] md:text-[4.85rem] ${headlineClassName}`}>
              {isRu ? <>Мы всегда <span className="text-[#B9D9EB]">на связи</span></> : isUk ? <>Ми завжди <span className="text-[#B9D9EB]">на зв’язку</span></> : <>We&apos;re always <span className="text-[#B9D9EB]">available</span></>}
            </h2>
            <p className={`text-[1.1rem] leading-relaxed text-slate-600 md:text-[1.32rem] ${bodyClassName}`}>
              {isRu
                ? "Есть вопросы о сообществе, партнерстве или наших стандартах? Наша команда готова помочь вам на каждом этапе профессионального пути."
                : isUk
                  ? "Є запитання про спільноту, партнерство або наші стандарти? Наша команда готова допомогти вам на кожному етапі професійного шляху."
                : "Have questions about membership, partnership, or our standards? Our team is ready to support you at every step of your professional journey."}
            </p>
          </div>

          <div className="grid gap-12">
            {contactInfo.map((info, i) => (
              <a 
                key={i} 
                href={info.link}
                target={info.link.startsWith("https://") ? "_blank" : undefined}
                rel={info.link.startsWith("https://") ? "noopener noreferrer" : undefined}
                className="flex gap-8 group"
              >
                <div 
                  className="w-16 h-16 rounded-[24px] flex items-center justify-center text-black group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: info.color }}
                >
                  {info.icon}
                </div>
                <div className="space-y-1">
                  <p className={`text-[10px] uppercase tracking-[0.3em] text-[#708090] ${uiClassName}`}>{info.label}</p>
                  <p className={`flex items-center gap-2 text-2xl font-semibold transition-colors group-hover:text-[#B9D9EB] ${bodyClassName}`}>
                    {info.value}
                    <ArrowUpRight size={20} className="opacity-0 group-hover:opacity-100 transition-all" />
                  </p>
                </div>
              </a>
            ))}
          </div>

          <div className="space-y-6 pt-12 border-t border-[#F0F8FF]">
             <p className={`text-[10px] uppercase tracking-[0.3em] text-[#708090] ${uiClassName}`}>{isRu ? "Коммуникация" : isUk ? "Комунікація" : "Communication"}</p>
             <div className="grid sm:grid-cols-2 gap-4">
                <Link href="/membership#packages" className={`px-6 py-4 rounded-[24px] bg-[#F0F8FF] text-[#708090] text-sm uppercase tracking-[0.14em] text-center hover:bg-[#B9D9EB] hover:text-black transition-all shadow-sm ${uiClassName}`}>
                  {isRu ? "Смотреть тарифы и пакеты" : isUk ? "Переглянути тарифи та пакети" : "View Membership"}
                </Link>
                <Link href="/apply" className={`px-6 py-4 rounded-[24px] bg-black text-white text-sm uppercase tracking-[0.14em] text-center hover:opacity-90 transition-all shadow-sm ${uiClassName}`}>
                  {isRu ? "Подать заявку" : isUk ? "Подати заявку" : "Start Application"}
                </Link>
             </div>
          </div>
        </motion.div>

        <motion.div {...fadeInUp} className="relative aspect-[4/5] rounded-[100px] overflow-hidden shadow-2xl">
          <ImageWithFallback src="/home/img-5512.webp" alt={isRu ? "Офис IBPA" : isUk ? "Офіс IBPA" : "Office"} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-16">
             <div className="p-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[50px] w-full text-white">
                <p className={`mb-2 text-3xl font-bold uppercase ${headlineClassName}`}>{isRu ? "Сакраменто, Калифорния" : isUk ? "Сакраменто, Каліфорнія" : "Sacramento, CA"}</p>
                <p className={`text-sm opacity-70 ${bodyClassName}`}>{isRu ? "Штаб-квартира и управление" : isUk ? "Штаб-квартира та управління" : "Headquarters & Governance"}</p>
             </div>
          </div>
        </motion.div>
      </section>

      <section className="pb-8 pt-4 max-w-7xl mx-auto px-6">
        <motion.div {...fadeInUp} className="grid gap-10 rounded-[44px] bg-[#F8FBFD] px-8 py-10 shadow-[0_18px_54px_rgba(15,23,42,0.08)] md:px-12 md:py-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="space-y-6">
            <p className={`text-[10px] font-bold uppercase tracking-[0.42em] text-[#72A0C1] ${uiClassName}`}>{copy.formEyebrow}</p>
            <h2 className={`max-w-3xl text-4xl uppercase leading-none text-slate-900 md:text-6xl ${headlineClassName}`}>
              {copy.formTitle}
            </h2>
            <p className={`max-w-2xl text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>{copy.formBody}</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="hidden" aria-hidden="true">
              <label htmlFor="contact-company-website">Company website</label>
              <input
                id="contact-company-website"
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
                className="w-full rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none transition-all focus:border-[#72A0C1]"
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
                className="w-full rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none transition-all focus:border-[#72A0C1]"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className={`text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 ${uiClassName}`}>{copy.phone}</span>
              <input
                type="tel"
                value={form.phone}
                onChange={handleChange("phone")}
                placeholder={copy.placeholders.phone}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none transition-all focus:border-[#72A0C1]"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className={`text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 ${uiClassName}`}>{copy.message}</span>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={handleChange("message")}
                placeholder={copy.placeholders.message}
                className="w-full resize-none rounded-[26px] border border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none transition-all focus:border-[#72A0C1]"
              />
            </label>
            <div className="md:col-span-2 space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center justify-center rounded-full bg-black px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition-transform hover:scale-[1.02] disabled:opacity-60 ${uiClassName}`}
              >
                {isSubmitting ? "Sending..." : copy.submit}
              </button>
              {submitState === "success" && <p className={`text-sm text-emerald-600 ${bodyClassName}`}>{copy.success}</p>}
              {submitState === "error" && <p className={`text-sm text-red-500 ${bodyClassName}`}>{copy.error}</p>}
            </div>
          </form>
        </motion.div>
      </section>

      {/* Map */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="overflow-hidden rounded-[60px] border border-[#B9D9EB]/20 bg-[#F0F8FF] shadow-[0_18px_54px_rgba(15,23,42,0.08)]">
          <div className="h-[400px] w-full">
            <iframe
              title={isRu ? "Карта офиса IBPA" : isUk ? "Мапа офісу IBPA" : "IBPA office map"}
              src="https://maps.google.com/maps?q=1220%20Melody%20Ln%2C%20Suite%20110%2C%20Roseville%2C%20CA%2095678&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href="https://maps.google.com/?q=1220+Melody+Ln+Suite+110,+Roseville,+CA+95678"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-4 px-6 py-8 text-center group"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#708090] shadow-xl transition-transform group-hover:scale-110">
              <MapPin size={32} />
            </div>
            <div className="space-y-2">
              <p className={`text-2xl font-bold uppercase tracking-tight ${headlineClassName}`}>{isRu ? "Офис в Розвилле" : isUk ? "Офіс у Розвіллі" : "Roseville Office"}</p>
              <p className={`text-[#708090] ${bodyClassName}`}>1220 Melody Ln, Suite 110, Roseville, CA 95678</p>
              <p className={`pt-2 text-[10px] uppercase tracking-[0.3em] text-slate-400 ${uiClassName}`}>{isRu ? "Открыть в Google Maps" : isUk ? "Відкрити в Google Maps" : "Open in Google Maps"}</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
