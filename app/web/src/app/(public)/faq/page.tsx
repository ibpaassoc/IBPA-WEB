"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronDown, ArrowRight, HelpCircle } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay, cyrillicEditorial } from "@/lib/cyrillic-fonts";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

type FaqItem = {
  question: string;
  answer: string;
};

export default function FAQPage() {
  const { locale } = useI18n();
  const isRu = locale === "ru";
  const isUk = locale === "uk";
  const useEnglishTypography = true;
  const [openItem, setOpenItem] = React.useState<number>(0);

  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-bold tracking-[-0.045em]`
    : `${cyrillicDisplay.className} font-light tracking-[-0.03em]`;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const accentClassName = `${cyrillicEditorial.className} italic`;

  const content = isRu
    ? {
        heroLabel: "FAQ",
        title: "Часто задаваемые вопросы",
        subtitle: "важная информация до подачи заявки",
        description:
          "Мы собрали ключевые вопросы о членстве, подаче заявки, оплате, сертификате, личном кабинете и профессиональных стандартах IBPA.",
        sectionLabel: "Ответы по проекту IBPA",
        sectionTitle: "Все, что важно знать до вступления",
        sectionText:
          "Эта страница составлена на основе структуры сайта, условий членства и пользовательского пути внутри IBPA, чтобы будущий участник сразу понимал процесс и ожидания.",
        ctaTitle: "Не нашли нужный ответ?",
        ctaText:
          "Если у вас остались вопросы по членству, заявке, партнерству или организационным вопросам, команда IBPA поможет разобраться.",
        ctaPrimary: "Связаться с командой",
        ctaSecondary: "Смотреть Membership",
        items: [
          {
            question: "Что такое IBPA?",
            answer:
              "International Beauty Professionals Association — это международная профессиональная ассоциация для специалистов beauty-индустрии, преподавателей, владельцев бизнеса и брендов. Проект объединяет профессиональное сообщество вокруг стандартов, образования, признания и международного сотрудничества.",
          },
          {
            question: "Кто может подать заявку на вступление?",
            answer:
              "Подать заявку могут студенты, практикующие beauty-специалисты, преподаватели и тренеры, владельцы beauty-бизнесов, а также бренды и компании, работающие в индустрии. Для каждой категории предусмотрен свой формат участия и свой набор полей в анкете.",
          },
          {
            question: "Какие категории membership есть в IBPA?",
            answer:
              "На сайте предусмотрены пять категорий: Student, Professional, Trainer, Business и Brand. Они отличаются по роли участника в индустрии, наполнению профиля, уровню доступа и стоимости участия.",
          },
          {
            question: "Как проходит подача заявки?",
            answer:
              "Сначала кандидат выбирает подходящую категорию membership, затем заполняет заявку, соответствующую его профессиональному профилю. После отправки анкета проходит предварительное рассмотрение комиссией. Если заявка одобрена, кандидат получает письмо с дальнейшими инструкциями по оплате и активации.",
          },
          {
            question: "Оплата происходит сразу после подачи анкеты?",
            answer:
              "Нет. Сначала заявка рассматривается. Только после одобрения приходит ссылка на оплату. Такой порядок помогает сохранять профессиональный уровень сообщества и подтверждать соответствие участника выбранной категории.",
          },
          {
            question: "Что получает участник после одобрения и оплаты?",
            answer:
              "После успешной оплаты участник активирует доступ в личный кабинет. Там может отображаться статус membership, данные из анкеты, новости и события, уведомления, а также информация о сертификате и связанные материалы, если они были выданы.",
          },
          {
            question: "Есть ли у участника сертификат?",
            answer:
              "Да, система проекта предусматривает работу с цифровыми сертификатами. После одобрения, оплаты и последующей административной обработки сертификат может быть загружен в личный кабинет, где его можно просмотреть и скачать, если он назначен конкретному участнику.",
          },
          {
            question: "Что такое личный кабинет IBPA?",
            answer:
              "Личный кабинет — это закрытая зона для одобренных участников. Там отображается профиль, сведения из заявки, новости и события для участников, уведомления, а также статус membership и сертификата. Это пространство для дальнейшего взаимодействия после вступления.",
          },
          {
            question: "Какие стандарты и требования поддерживает IBPA?",
            answer:
              "Ассоциация делает акцент на профессионализме, качестве работы, этике, развитии образования и ответственном подходе к индустрии. При подаче заявки участник подтверждает согласие со стандартами и правилами сообщества.",
          },
          {
            question: "Можно ли бренду или компании сотрудничать с IBPA без membership?",
            answer:
              "Да. Для этого на сайте предусмотрена отдельная страница Partnership. Она подходит для брендов, медиа-платформ, образовательных партнеров и индустриальных проектов, которые хотят сотрудничать с IBPA и участвовать в развитии профессионального сообщества.",
          },
          {
            question: "Публикует ли IBPA новости и события?",
            answer:
              "Да. На сайте есть отдельные страницы новостей и событий, а часть контента также может отображаться в личном кабинете участников. Это позволяет поддерживать единое информационное пространство как для публичной аудитории, так и для действующих членов сообщества.",
          },
          {
            question: "Где задать вопрос, если нужен индивидуальный ответ?",
            answer:
              "Если вопрос связан с заявкой, партнерством, статусом membership или организационной информацией, удобнее всего связаться через страницу Contact. Это лучший способ получить точный ответ по вашей ситуации.",
          },
        ],
      }
    : isUk
      ? {
          heroLabel: "FAQ",
          title: "Поширені запитання",
          subtitle: "важлива інформація перед поданням заявки",
          description:
            "Ми зібрали ключові запитання про membership, подання заявки, оплату, сертифікат, особистий кабінет і професійні стандарти IBPA.",
          sectionLabel: "Відповіді про проєкт IBPA",
          sectionTitle: "Усе, що важливо знати до вступу",
          sectionText:
            "Цю сторінку сформовано на основі структури сайту, умов membership і користувацького шляху всередині IBPA, щоб майбутній учасник одразу розумів процес та очікування.",
          ctaTitle: "Не знайшли потрібну відповідь?",
          ctaText:
            "Якщо у вас залишилися запитання щодо membership, заявки, партнерства або організаційних деталей, команда IBPA допоможе розібратися.",
          ctaPrimary: "Зв’язатися з командою",
          ctaSecondary: "Переглянути Membership",
          items: [
            {
              question: "Що таке IBPA?",
              answer:
                "International Beauty Professionals Association — це міжнародна професійна асоціація для фахівців beauty-індустрії, викладачів, власників бізнесу та брендів. Проєкт об’єднує професійну спільноту навколо стандартів, освіти, визнання та міжнародної співпраці.",
            },
            {
              question: "Хто може подати заявку на вступ?",
              answer:
                "Подати заявку можуть студенти, практикуючі beauty-фахівці, викладачі й тренери, власники beauty-бізнесів, а також бренди й компанії, що працюють в індустрії. Для кожної категорії передбачено свій формат участі та свій набір полів у заявці.",
            },
            {
              question: "Які категорії membership є в IBPA?",
              answer:
                "На сайті передбачено п’ять категорій: Student, Professional, Trainer, Business і Brand. Вони відрізняються роллю учасника в індустрії, наповненням профілю, рівнем доступу та вартістю участі.",
            },
            {
              question: "Як проходить подання заявки?",
              answer:
                "Спочатку кандидат обирає відповідну категорію membership, потім заповнює заявку, яка відповідає його професійному профілю. Після надсилання анкета проходить попередній розгляд комісією. Якщо заявку схвалено, кандидат отримує лист із подальшими інструкціями щодо оплати та активації.",
            },
            {
              question: "Оплата відбувається одразу після подання анкети?",
              answer:
                "Ні. Спочатку заявка розглядається. Лише після схвалення надходить посилання на оплату. Такий порядок допомагає зберігати професійний рівень спільноти та підтверджувати відповідність учасника обраній категорії.",
            },
            {
              question: "Що отримує учасник після схвалення та оплати?",
              answer:
                "Після успішної оплати учасник активує доступ до особистого кабінету. Там може відображатися статус membership, дані із заявки, новини та події, сповіщення, а також інформація про сертифікат і пов’язані матеріали, якщо їх було видано.",
            },
            {
              question: "Чи має учасник сертифікат?",
              answer:
                "Так, система проєкту передбачає роботу з цифровими сертифікатами. Після схвалення, оплати та подальшої адміністративної обробки сертифікат може бути завантажений в особистий кабінет, де його можна переглянути та завантажити, якщо його призначено конкретному учаснику.",
            },
            {
              question: "Що таке особистий кабінет IBPA?",
              answer:
                "Особистий кабінет — це закрита зона для схвалених учасників. Там відображаються профіль, відомості із заявки, новини й події для учасників, сповіщення, а також статус membership і сертифіката. Це простір для подальшої взаємодії після вступу.",
            },
            {
              question: "Які стандарти та вимоги підтримує IBPA?",
              answer:
                "Асоціація робить акцент на професіоналізмі, якості роботи, етиці, розвитку освіти та відповідальному підході до індустрії. Під час подання заявки учасник підтверджує згоду зі стандартами та правилами спільноти.",
            },
            {
              question: "Чи може бренд або компанія співпрацювати з IBPA без membership?",
              answer:
                "Так. Для цього на сайті передбачено окрему сторінку Partnership. Вона підходить для брендів, медіаплатформ, освітніх партнерів та індустріальних проєктів, які хочуть співпрацювати з IBPA і брати участь у розвитку професійної спільноти.",
            },
            {
              question: "Чи публікує IBPA новини та події?",
              answer:
                "Так. На сайті є окремі сторінки новин і подій, а частина контенту також може відображатися в особистому кабінеті учасників. Це допомагає підтримувати єдиний інформаційний простір як для публічної аудиторії, так і для діючих членів спільноти.",
            },
            {
              question: "Де поставити запитання, якщо потрібна індивідуальна відповідь?",
              answer:
                "Якщо запитання пов’язане із заявкою, партнерством, статусом membership або організаційною інформацією, найзручніше звернутися через сторінку Contact. Це найкращий спосіб отримати точну відповідь щодо вашої ситуації.",
            },
          ],
        }
      : {
          heroLabel: "FAQ",
          title: "Frequently Asked Questions",
          subtitle: "essential information before you apply",
          description:
            "We collected the most important questions about membership, the application process, payment, certificates, the member dashboard, and IBPA professional standards.",
          sectionLabel: "Answers About The IBPA Project",
          sectionTitle: "What Future Members Usually Need To Know",
          sectionText:
            "This page is based on the site structure, membership conditions, and the actual user journey inside IBPA, so prospective members can understand the process clearly before applying.",
          ctaTitle: "Still need a direct answer?",
          ctaText:
            "If your question is about membership, applications, partnerships, or organizational details, the IBPA team can help you personally.",
          ctaPrimary: "Contact the team",
          ctaSecondary: "View Membership",
          items: [
            {
              question: "What is IBPA?",
              answer:
                "The International Beauty Professionals Association is an international professional association for beauty specialists, educators, business owners, and brands. The project brings the professional community together around standards, education, recognition, and international collaboration.",
            },
            {
              question: "Who can apply to join?",
              answer:
                "Applications are open to students, practicing beauty professionals, educators and trainers, beauty business owners, and brands or companies working in the industry. Each category has its own application flow and profile requirements.",
            },
            {
              question: "What membership categories are available?",
              answer:
                "The site currently includes five categories: Student, Professional, Trainer, Business, and Brand. They differ by industry role, application content, access level, and membership price.",
            },
            {
              question: "How does the application process work?",
              answer:
                "A candidate first selects the most appropriate membership category and then completes the application that matches their professional profile. After submission, the application goes through a review stage. If approved, the candidate receives payment and activation instructions by email.",
            },
            {
              question: "Do I pay immediately after submitting the application?",
              answer:
                "No. The application is reviewed first. Payment happens only after approval. This process helps IBPA maintain professional standards and ensure that each member fits the selected category.",
            },
            {
              question: "What happens after approval and payment?",
              answer:
                "After successful payment, the member activates access to the personal dashboard. Depending on their status, this area can show profile information from the application, member updates, notifications, event and news content, and certificate-related information.",
            },
            {
              question: "Does membership include a certificate?",
              answer:
                "The platform supports digital certificates. After approval, payment, and administrative processing, a certificate can be uploaded to the member account, where the user may view and download it if one has been issued for them.",
            },
            {
              question: "What is the IBPA dashboard?",
              answer:
                "The dashboard is the private area for approved members. It is designed to show profile information, application-based details, member notifications, exclusive content, and certificate status. It becomes part of the experience after membership activation.",
            },
            {
              question: "What standards does IBPA expect members to support?",
              answer:
                "IBPA emphasizes professionalism, quality, ethics, continued education, and responsible participation in the beauty industry. During the application process, candidates confirm that they agree with the association's standards and community expectations.",
            },
            {
              question: "Can a brand or company work with IBPA without applying for membership?",
              answer:
                "Yes. The site includes a dedicated Partnership page for brands, media platforms, educational partners, and industry projects that want to work with IBPA and support the professional community without entering through an individual member application path.",
            },
            {
              question: "Does IBPA publish news and events?",
              answer:
                "Yes. The project includes dedicated public News and Events pages, and selected content may also appear inside the member dashboard. This helps keep both public visitors and active members informed through a connected content system.",
            },
            {
              question: "Where should I ask if I need a personal answer?",
              answer:
                "If your question is about your application, partnership opportunities, membership status, or general association details, the best next step is the Contact page. That is the most direct way to reach the team for your specific case.",
            },
          ],
        };

  return (
    <div className="min-h-screen bg-white selection:bg-[#B9D9EB] selection:text-black">
      <section className="relative flex h-[calc(60vh+70px)] items-center overflow-hidden bg-[#F1F3F5]">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000&auto=format&fit=crop"
            className="h-full w-full object-cover opacity-20 grayscale-[0.45] mix-blend-multiply"
            alt={content.title}
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(241,243,245,0.65),rgba(241,243,245,0.92))]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-24 text-slate-900 md:pt-20">
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-start">
            <p className={`mb-4 text-[10px] uppercase tracking-[0.32em] text-[#72A0C1] md:text-xs ${uiClassName}`}>{content.heroLabel}</p>
            <h1 className={`max-w-5xl text-5xl uppercase leading-[0.92] md:text-7xl lg:text-8xl ${headlineClassName}`}>{content.title}</h1>
            <span className={`mt-3 text-[1.9rem] lowercase leading-none text-slate-400 md:mt-1 md:text-[2.8rem] ${accentClassName}`}>{content.subtitle}</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className={`mt-8 max-w-3xl text-lg leading-relaxed text-slate-600 md:text-[1.25rem] ${bodyClassName}`}
          >
            {content.description}
          </motion.p>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <p className={`text-[10px] uppercase tracking-[0.32em] text-[#708090] md:text-xs ${uiClassName}`}>{content.sectionLabel}</p>
                <h2 className={`text-4xl uppercase leading-[0.94] text-slate-900 md:text-[4.6rem] ${headlineClassName}`}>{content.sectionTitle}</h2>
                <p className={`max-w-xl text-lg leading-relaxed text-slate-600 md:text-[1.18rem] ${bodyClassName}`}>{content.sectionText}</p>
              </div>

              <div className="rounded-[38px] bg-[#F8FBFD] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:p-10">
                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#B9D9EB]/20 text-[#708090]">
                    <HelpCircle size={26} />
                  </div>
                  <div className="space-y-3">
                    <h3 className={`text-2xl uppercase leading-[0.96] text-slate-900 ${headlineClassName}`}>{content.ctaTitle}</h3>
                    <p className={`text-sm leading-relaxed text-slate-600 md:text-base ${bodyClassName}`}>{content.ctaText}</p>
                  </div>
                </div>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link href="/contact" className={`inline-flex items-center justify-center gap-3 rounded-full bg-black px-8 py-4 text-xs uppercase text-white transition-all hover:scale-[1.02] ${uiClassName}`}>
                    {content.ctaPrimary}
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/membership" className={`inline-flex items-center justify-center rounded-full border border-slate-200 px-8 py-4 text-xs uppercase text-slate-900 transition-colors hover:bg-[#F1F3F5] ${uiClassName}`}>
                    {content.ctaSecondary}
                  </Link>
                </div>
              </div>
            </motion.div>

            <div className="space-y-4">
              {content.items.map((item, index) => {
                const isOpen = openItem === index;

                return (
                  <motion.div
                    key={item.question}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.03 }}
                    className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(39,54,72,0.05)]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenItem(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left md:px-8 md:py-6"
                    >
                      <span className={`pr-4 text-xl uppercase leading-[1.02] text-slate-900 md:text-[1.55rem] ${headlineClassName}`}>
                        {item.question}
                      </span>
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#F8FBFD] text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                        <ChevronDown size={18} />
                      </span>
                    </button>
                    <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <div className="border-t border-slate-100 px-6 pb-6 pt-4 md:px-8 md:pb-8 md:pt-5">
                          <p className={`max-w-3xl text-sm leading-relaxed text-slate-600 md:text-[1rem] ${bodyClassName}`}>{item.answer}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
