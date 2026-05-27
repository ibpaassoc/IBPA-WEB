"use client";
import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ShieldAlert, CreditCard, Mail, MapPin, Info, XCircle, FileText, Scale } from "lucide-react";
import { cyrillicDisplay, cyrillicEditorial } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

export default function CancellationPolicy() {
  const { locale } = useI18n();
  const isRu = locale === "ru";
  const useEnglishTypography = true;
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`
    : cyrillicDisplay.className;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const editorialClassName = useEnglishTypography ? "font-sans italic" : `${cyrillicEditorial.className} italic`;
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 }
  };

  const sections = [
    {
      id: "1",
      title: "General Provisions",
      icon: <Info className="w-6 h-6" />,
      content: "This Cancellation and Membership Termination Policy outlines the rules governing the cancellation of membership, termination of participation in the association, and refund conditions for members of International Beauty Professionals Association, Inc. By submitting a membership application, paying a membership fee, or participating in the association, the applicant or member confirms that they have read, understood, and agreed to this policy."
    },
    {
      id: "2",
      title: "Membership Cancellation",
      icon: <XCircle className="w-6 h-6" />,
      content: "Members of the International Beauty Professionals Association, Inc. may cancel their membership at any time at their own discretion. Cancellation may be completed through the member's personal account (Member Area) on the association's website, or by sending a written request to the official email address.",
      details: [
        "Full name of the member",
        "Membership category",
        "Email address used during registration",
        "A clear request to cancel membership"
      ]
    },
    {
      id: "3",
      title: "Effective Date",
      icon: <ShieldAlert className="w-6 h-6" />,
      content: "Upon processing the cancellation request, the individual's membership status will be terminated. Access to membership benefits, services, and resources will be restricted, and the member's profile will be removed from internal or public association directories."
    },
    {
      id: "4",
      title: "Refund Policy",
      icon: <CreditCard className="w-6 h-6" />,
      content: "All membership fees paid to International Beauty Professionals Association, Inc. are non-refundable. This applies regardless of the timing of the cancellation request, the amount of time since activation, or whether the member has used any benefits. Fees are considered a contribution toward participation and organizational support."
    },
    {
      id: "5",
      title: "Application Review",
      icon: <FileText className="w-6 h-6" />,
      content: "All membership applications are subject to review by the Membership Review Board. Submitting an application does not guarantee acceptance. If an application is not approved, no payment obligation exists unless payment was submitted before the review, in which case terms follow the application page conditions."
    },
    {
      id: "6",
      title: "Termination by Association",
      icon: <Scale className="w-6 h-6" />,
      content: "The Association reserves the right to suspend or terminate membership if a member violates professional standards, the Code of Ethics, provides false information, or engages in conduct harming the reputation of the association. In such cases, fees remain non-refundable."
    }
  ];

  return (
    <div className="bg-white min-h-screen selection:bg-[#B9D9EB] selection:text-black">
      {/* Hero Section */}
      <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden bg-[#F1F3F5]">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-[#B9D9EB] to-transparent opacity-30" />
        </div>
        <div className="relative z-10 text-center px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-5xl uppercase leading-none text-slate-900 md:text-8xl ${headlineClassName}`}
          >
            Cancellation <br /> <span className="text-[#B9D9EB]">Policy</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-4 text-lg uppercase tracking-[0.2em] text-slate-400 md:text-2xl ${uiClassName}`}
          >
            Membership Termination Rules
          </motion.p>
        </div>
      </section>

      {/* Intro Text */}
      <section className="py-20 md:py-32 max-w-4xl mx-auto px-6">
        <motion.div {...fadeInUp} className="text-center space-y-8">
          <p className={`text-2xl leading-relaxed text-slate-500 md:text-3xl ${editorialClassName}`}>
            &ldquo;We value transparency and professional integrity. This policy ensures a clear understanding of membership commitments and the termination process.&rdquo;
          </p>
          <div className="w-24 h-px bg-[#B9D9EB] mx-auto" />
        </motion.div>
      </section>

      {/* Sections Grid */}
      <section className="pb-32 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {sections.map((section, idx) => (
            <motion.div 
              key={section.id}
              {...fadeInUp}
              transition={{ delay: idx * 0.1 }}
              className="p-8 md:p-12 bg-[#F1F3F5] rounded-[40px] md:rounded-[60px] border border-white hover:shadow-2xl hover:-translate-y-2 transition-all group"
            >
              <div className="flex items-center gap-6 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#B9D9EB] group-hover:bg-[#B9D9EB] group-hover:text-white transition-all shadow-sm">
                  {section.icon}
                </div>
                <h2 className={`text-2xl uppercase leading-none tracking-tight text-slate-900 md:text-3xl ${headlineClassName}`}>
                  {section.title}
                </h2>
              </div>
              
              <div className="space-y-6">
                <p className={`text-lg leading-relaxed text-slate-500 ${bodyClassName}`}>
                  {section.content}
                </p>
                {section.details && (
                  <ul className="space-y-3 pt-4 border-t border-slate-200">
                    <p className={`mb-2 text-[10px] uppercase text-slate-400 ${uiClassName}`}>{isRu ? "Обязательная информация:" : "Required Information:"}</p>
                    {section.details.map((detail, dIdx) => (
                      <li key={dIdx} className={`flex items-center gap-3 text-sm text-slate-600 ${bodyClassName}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#B9D9EB]" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Errors & Contact */}
      <section className="py-24 bg-slate-900 text-white rounded-t-[100px] md:rounded-t-[200px]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div {...fadeInUp} className="space-y-12">
              <div className="space-y-6">
                <h2 className={`text-4xl uppercase leading-none md:text-6xl ${headlineClassName}`}>
                  Administrative <br /> <span className="text-[#B9D9EB]">Errors</span>
                </h2>
                <p className={`text-xl leading-relaxed text-white/40 ${editorialClassName}`}>
                  {isRu ? "Если участник считает, что произошла ошибка оплаты, двойное списание или техническая проблема, ему следует как можно скорее связаться с ассоциацией. Такие случаи рассматриваются индивидуально." : "If a member believes that a payment error, duplicate charge, or technical issue has occurred, they should contact the association as soon as possible. Such cases will be reviewed individually."}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8 pt-12 border-t border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-[#B9D9EB]">
                    <Mail size={20} />
                    <span className={`text-[10px] uppercase ${uiClassName}`}>{isRu ? "Поддержка по email" : "Email Support"}</span>
                  </div>
                  <p className={`text-lg ${bodyClassName}`}>support@ibpassociations.org</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-[#B9D9EB]">
                    <MapPin size={20} />
                    <span className={`text-[10px] uppercase ${uiClassName}`}>{isRu ? "Юридический адрес" : "Registered Address"}</span>
                  </div>
                  <p className={`text-lg opacity-60 ${bodyClassName}`}>
                    1220 Melody Ln, Suite 110, <br />
                    Roseville, CA 95678
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              {...fadeInUp}
              className="aspect-square bg-[#B9D9EB]/10 rounded-[80px] border border-white/5 flex flex-col items-center justify-center p-12 text-center space-y-8 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-[#B9D9EB] opacity-0 group-hover:opacity-5 transition-opacity duration-1000" />
              <div className="w-32 h-32 rounded-full bg-[#B9D9EB] flex items-center justify-center text-slate-900 shadow-2xl">
                <ShieldAlert size={64} />
              </div>
              <div className="space-y-4">
                <h3 className={`text-3xl uppercase ${headlineClassName}`}>Official Notice</h3>
                <p className={`text-white/40 ${editorialClassName}`}>
                  International Beauty Professionals Association, Inc. <br />
                  California, USA
                </p>
              </div>
              <div className="flex w-full flex-col gap-4 pt-4 sm:flex-row">
                <Link href="/contact" className={`flex-1 rounded-full bg-[#B9D9EB] px-6 py-4 text-center text-sm uppercase text-slate-900 ${uiClassName}`}>
                  {isRu ? "Связаться с поддержкой" : "Contact Support"}
                </Link>
                <Link href="/membership#packages" className={`flex-1 rounded-full border border-white/20 px-6 py-4 text-center text-sm uppercase text-white ${uiClassName}`}>
                  {isRu ? "Тарифы и пакеты" : "Membership Options"}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
