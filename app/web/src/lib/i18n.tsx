"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  dashboardDictionaries,
  type DashboardDictionary,
} from "@/lib/dashboard-i18n";

export type Locale = "en" | "ru" | "uk";
export type SupportedLocale = "en" | "ru" | "ua";

export function resolveLocale(value?: string | null): Locale {
  if (value === "ru") return "ru";
  if (value === "uk" || value === "ua") return "uk";
  return "en";
}

export function getLocaleCookieValue(locale: Locale): SupportedLocale {
  return locale === "uk" ? "ua" : locale;
}

export function getLocaleNumberFormat(locale: Locale) {
  return locale === "uk" ? "uk-UA" : locale === "ru" ? "ru-RU" : "en-US";
}

type AudienceItem = {
  title: string;
  price: string;
  type: string;
  desc: string;
  img: string;
};

type BenefitItem = {
  title: string;
  desc: string;
};

type Dictionary = {
  nav: {
    about: string;
    membership: string;
    criteria: string;
    standards: string;
    governance: string;
    contact: string;
    apply: string;
    login: string;
    menu: string;
  };
  footer: {
    description: string;
    email: string;
    call: string;
    map: string;
    siteMap: string;
    contactInfo: string;
    policies: string;
    faq: string;
    governance: string;
    events: string;
    news: string;
    partnership: string;
    copyrightTagline: string;
  };
  cookies: {
    title: string;
    description: string;
    accept: string;
    necessaryOnly: string;
  };
    home: {
      hero: {
        titleTop: string;
        titleBottom: string;
        subtitle: string;
        description: string;
      primaryCta: string;
      secondaryCta: string;
      ticker: string[];
    };
    about: {
      title: string;
      subtitle: string;
      commitmentLabel: string;
      commitmentItems: string[];
      quote: string;
      readMore: string;
    };
    audience: {
      title: string;
      eyebrow: string;
      annualFee: string;
      items: AudienceItem[];
    };
    benefits: {
      eyebrow: string;
      title: string;
      detailsCta: string;
      items: BenefitItem[];
    };
    events: {
      eyebrow: string;
      title: string;
      description: string;
      subdescription: string;
      viewAll: string;
      register: string;
      upcoming: string;
      items: {
        date: string;
        name: string;
        location: string;
        img: string;
      }[];
    };
    news: {
      eyebrow: string;
      title: string;
      description: string;
      viewAll: string;
      readArticle: string;
      items: {
        category: string;
        title: string;
        date: string;
        img: string;
      }[];
    };
    community: {
      eyebrow: string;
      title: string;
      description: string;
      quote: string;
      cta: string;
      stats: {
        label: string;
        value: string;
      }[];
    };
    cta: {
      eyebrow: string;
      title: string;
      description: string;
      primaryCta: string;
      secondaryCta: string;
    };
  };
  dashboard: DashboardDictionary;
};

type PublicDictionary = Omit<Dictionary, "dashboard">;

const dictionaries: Record<Locale, PublicDictionary> = {
  en: {
    nav: {
      about: "About",
      membership: "Membership",
      criteria: "Criteria",
      standards: "Standards",
      governance: "Governance",
      contact: "Contact",
      apply: "Apply Now",
      login: "Login",
      menu: "Language",
    },
    footer: {
      description:
        "International Beauty Professionals Association (IBPA) is dedicated to elevating professional standards and fostering global collaboration in the beauty industry.",
      email: "Email",
      call: "Call",
      map: "Map",
      siteMap: "Site Map",
      contactInfo: "Contact Info",
      policies: "Policies",
      faq: "FAQ",
      governance: "Governance",
      events: "Events",
      news: "News",
      partnership: "Partnership",
      copyrightTagline: "Professional standards, education, and global collaboration.",
    },
    cookies: {
      title: "Cookie Notice",
      description:
        "We use cookies to improve site performance, remember your preferences, and support a smoother browsing experience on IBPA.",
      accept: "Accept All",
      necessaryOnly: "Only Necessary",
    },
    home: {
      hero: {
        titleTop: "International Beauty",
        titleBottom: "Professionals Association",
        subtitle: "Where Beauty Becomes Community",
        description:
          "IBPA connects beauty professionals, educators, and brands to advance industry standards, education, and global growth",
        primaryCta: "Become a Member",
        secondaryCta: "Partner / Sponsor",
        ticker: ["Professional Standards", "International Collaboration", "Beauty Industry Community"],
      },
      about: {
        title: "Elevating Beauty Standards Globally",
        subtitle:
          "The International Beauty Professionals Association is a professional nonprofit organization dedicated to supporting excellence in the beauty industry.",
        commitmentLabel: "We are committed to:",
        commitmentItems: [
          "professional growth",
          "high industry standards",
          "international collaboration",
          "education and innovation",
        ],
        quote:
          "Our goal is to strengthen the beauty industry as a respected professional field built on expertise, ethics, and quality.",
        readMore: "Read More",
      },
      audience: {
        title: "Who the Association Is For",
        eyebrow: "Inclusive Professionalism",
        annualFee: "Annual Fee",
        items: [
          {
            title: "Specialists",
            price: "$49",
            type: "ENTRY",
            desc: "Specialists currently studying beauty professions and building their careers.",
            img: "/home/student-1.webp",
          },
          {
            title: "Professionals",
            price: "$199",
            type: "MASTER",
            desc: "Practicing beauty specialists including brow artists, lash artists, makeup artists, cosmetologists, estheticians, PMU artists, nail professionals, and hair professionals.",
            img: "/home/professional.webp",
          },
          {
            title: "Educators & Trainers",
            price: "$399",
            type: "ELITE",
            desc: "Teachers, trainers, academies, and educational platforms working in beauty education.",
            img: "/home/trainer-2.webp",
          },
          {
            title: "Business Owners",
            price: "$599",
            type: "PREMIUM",
            desc: "Owners of beauty salons, studios, beauty spaces, and other beauty businesses.",
            img: "/home/salon.webp",
          },
          {
            title: "Brands & Companies",
            price: "$1,299",
            type: "PARTNER",
            desc: "Beauty brands, distributors, manufacturers, and service companies working within the beauty industry.",
            img: "/home/brand.webp",
          },
        ],
      },
      benefits: {
        eyebrow: "Membership Benefits",
        title: "Why Join IBPA",
        detailsCta: "All Membership Details",
        items: [
          {
            title: "Education",
            desc: "Access to educational programs, webinars, resources, and professional development materials.",
          },
          {
            title: "Standards",
            desc: "Professional standards, best practices, and ethical guidelines for working in the beauty industry.",
          },
          {
            title: "Community",
            desc: "A global professional network connecting beauty experts from around the world.",
          },
          {
            title: "Recognition",
            desc: "Professional recognition through membership certification, member directory listings, and official association credentials.",
          },
          {
            title: "Events",
            desc: "Access to conferences, workshops, networking events, industry forums, and professional competitions.",
          },
        ],
      },
      events: {
        eyebrow: "Upcoming Events",
        title: "Future Events",
        description:
          "IBPA regularly organizes professional events that support education, networking, and collaboration within the beauty industry.",
        subdescription:
          "Each event brings together experts, educators, brands, and professionals to exchange knowledge and experience.",
        viewAll: "View All Events",
        register: "Register Now",
        upcoming: "Upcoming",
        items: [
          {
            date: "June 15-17, 2026",
            name: "Global Beauty Summit 2026",
            location: "Sacramento, CA / Convention Center",
            img: "https://images.unsplash.com/photo-1542764140-f38e04d3e0c4?q=80&w=800",
          },
          {
            date: "August 22, 2026",
            name: "Advanced PMU Masterclass",
            location: "Online / Virtual Format",
            img: "https://images.unsplash.com/photo-1737063989672-67d79de1b2f7?q=80&w=800",
          },
          {
            date: "October 10, 2026",
            name: "Intl Lash & Brow Cup",
            location: "Paris, France / Hybrid",
            img: "https://images.unsplash.com/photo-1735151226446-1d364b4adc2f?q=80&w=800",
          },
        ],
      },
      news: {
        eyebrow: "News & Industry Insights",
        title: "News & Updates",
        description:
          "Stay informed about association news, industry developments, professional articles, educational initiatives, and upcoming events.",
        viewAll: "Explore All News",
        readArticle: "Read Article",
        items: [
          {
            category: "Past Event",
            title: "Beauty Forum 2025 Took Place in San Francisco",
            date: "November 7-8, 2025",
            img: "/news/beauty-forum-2025.webp",
          },
          {
            category: "Association News",
            title: "IBPA Is Developing Its Own Professional Journal",
            date: "March 25, 2026",
            img: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1200",
          },
        ],
      },
      community: {
        eyebrow: "Community Power",
        title: "Building a Global Beauty Community",
        description:
          "IBPA is forming an international professional community based on expertise, collaboration, and professional development.",
        quote:
          "We invite professionals, educators, business owners, and brands to become part of the founding community shaping the future of the beauty industry.",
        cta: "Join the Foundation",
        stats: [
          { label: "Founding Members", value: "2.5K+" },
          { label: "Founding Partners", value: "120+" },
          { label: "Global Community", value: "Active" },
          { label: "Applications", value: "Open" },
        ],
      },
      cta: {
        eyebrow: "Shape the Future",
        title: "Become Part of a Global Professional Beauty Community",
        description:
          "Join a professional association that supports industry standards, education, and collaboration among beauty professionals worldwide.",
        primaryCta: "Apply for Membership",
        secondaryCta: "View Membership Options",
      },
    },
  },
  ru: {
    nav: {
      about: "Об ассоциации",
      membership: "Сообщество",
      criteria: "Критерии",
      standards: "Стандарты",
      governance: "Управление",
      contact: "Контакты",
      apply: "Подать заявку",
      login: "Login",
      menu: "Язык",
    },
    footer: {
      description:
        "International Beauty Professionals Association (IBPA) развивает профессиональные стандарты и международное сотрудничество в индустрии красоты.",
      email: "Email",
      call: "Позвонить",
      map: "Карта",
      siteMap: "Карта сайта",
      contactInfo: "Контакты",
      policies: "Политики",
      faq: "FAQ",
      governance: "Управление",
      events: "События",
      news: "Новости",
      partnership: "Партнерство",
      copyrightTagline: "Профессиональные стандарты, образование и глобальное сотрудничество.",
    },
    cookies: {
      title: "Использование cookie",
      description:
        "Мы используем cookie, чтобы улучшать работу сайта, запоминать ваши предпочтения и делать взаимодействие с IBPA более удобным.",
      accept: "Принять все",
      necessaryOnly: "Только необходимые",
    },
    home: {
      hero: {
        titleTop: "International Beauty",
        titleBottom: "Professionals Association",
        subtitle: "Где красота создает сообщество",
        description:
          "IBPA объединяет бьюти-специалистов, преподавателей и бренды для развития отраслевых стандартов, образования и глобального роста.",
        primaryCta: "Подать заявку",
        secondaryCta: "Партнер / Спонсор",
        ticker: ["Профессиональные стандарты", "Международное сотрудничество", "Сообщество индустрии красоты"],
      },
      about: {
        title: "Поднимаем стандарты красоты во всем мире",
        subtitle:
          "International Beauty Professionals Association — это профессиональная некоммерческая организация, поддерживающая высокий уровень экспертизы в индустрии красоты.",
        commitmentLabel: "Мы развиваем:",
        commitmentItems: [
          "профессиональный рост",
          "высокие отраслевые стандарты",
          "международное сотрудничество",
          "образование и инновации",
        ],
        quote:
          "Наша цель — укреплять индустрию красоты как уважаемую профессиональную сферу, основанную на экспертизе, этике и качестве.",
        readMore: "Подробнее",
      },
      audience: {
        title: "Для кого создана ассоциация",
        eyebrow: "Открытый профессионализм",
        annualFee: "Годовой взнос",
        items: [
          {
            title: "Специалисты",
            price: "$49",
            type: "ENTRY",
            desc: "Специалисты, которые обучаются бьюти-профессиям и строят карьеру в индустрии красоты.",
            img: "/home/student-1.webp",
          },
          {
            title: "Профессионалы",
            price: "$199",
            type: "MASTER",
            desc: "Практикующие специалисты: бровисты, лэшмейкеры, визажисты, косметологи, эстетисты, PMU-мастера, нейл-специалисты и мастера по волосам.",
            img: "/home/professional.webp",
          },
          {
            title: "Преподаватели и тренеры",
            price: "$399",
            type: "ELITE",
            desc: "Преподаватели, тренеры, академии и образовательные платформы, работающие в сфере бьюти-образования.",
            img: "/home/trainer-2.webp",
          },
          {
            title: "Владельцы бизнеса",
            price: "$599",
            type: "PREMIUM",
            desc: "Владельцы салонов красоты, студий, бьюти-пространств и других бизнесов в индустрии красоты.",
            img: "/home/salon.webp",
          },
          {
            title: "Бренды и компании",
            price: "$1,299",
            type: "PARTNER",
            desc: "Бренды, дистрибьюторы, производители и сервисные компании, работающие в индустрии красоты.",
            img: "/home/brand.webp",
          },
        ],
      },
      benefits: {
        eyebrow: "Преимущества сообщества",
        title: "Почему IBPA",
        detailsCta: "Все тарифы и пакеты",
        items: [
          {
            title: "Образование",
            desc: "Доступ к образовательным программам, вебинарам, ресурсам и материалам для профессионального развития.",
          },
          {
            title: "Стандарты",
            desc: "Профессиональные стандарты, лучшие практики и этические принципы работы в индустрии красоты.",
          },
          {
            title: "Сообщество",
            desc: "Глобальная профессиональная сеть, объединяющая экспертов индустрии красоты со всего мира.",
          },
          {
            title: "Признание",
            desc: "Профессиональное признание через сертификат участника, размещение в каталоге участников и официальные подтверждения ассоциации.",
          },
          {
            title: "События",
            desc: "Доступ к конференциям, мастер-классам, нетворкинг-событиям, профессиональным форумам и соревнованиям.",
          },
        ],
      },
      events: {
        eyebrow: "Ближайшие события",
        title: "Будущие события",
        description:
          "IBPA регулярно организует профессиональные события, которые поддерживают образование, нетворкинг и сотрудничество в индустрии красоты.",
        subdescription:
          "Каждое событие объединяет экспертов, преподавателей, бренды и специалистов для обмена знаниями и опытом.",
        viewAll: "Смотреть все события",
        register: "Зарегистрироваться",
        upcoming: "Скоро",
        items: [
          {
            date: "15–17 июня 2026",
            name: "Global Beauty Summit 2026",
            location: "Сакраменто, Калифорния / Конгресс-центр",
            img: "https://images.unsplash.com/photo-1542764140-f38e04d3e0c4?q=80&w=800",
          },
          {
            date: "22 августа 2026",
            name: "Advanced PMU Masterclass",
            location: "Онлайн / Виртуальный формат",
            img: "https://images.unsplash.com/photo-1737063989672-67d79de1b2f7?q=80&w=800",
          },
          {
            date: "10 октября 2026",
            name: "Intl Lash & Brow Cup",
            location: "Париж, Франция / Гибридный формат",
            img: "https://images.unsplash.com/photo-1735151226446-1d364b4adc2f?q=80&w=800",
          },
        ],
      },
      news: {
        eyebrow: "Новости и инсайты индустрии",
        title: "Новости и обновления",
        description:
          "Следите за новостями ассоциации, развитием индустрии, профессиональными статьями, образовательными инициативами и предстоящими событиями.",
        viewAll: "Смотреть все новости",
        readArticle: "Читать статью",
        items: [
          {
            category: "Прошедшее событие",
            title: "Beauty Forum 2025 прошёл в Сан-Франциско",
            date: "7-8 ноября 2025",
            img: "/news/beauty-forum-2025.webp",
          },
          {
            category: "Новости ассоциации",
            title: "IBPA разрабатывает собственный профессиональный журнал",
            date: "25 марта 2026",
            img: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1200",
          },
        ],
      },
      community: {
        eyebrow: "Сила сообщества",
        title: "Формируем глобальное beauty-сообщество",
        description:
          "IBPA формирует международное профессиональное сообщество, основанное на экспертизе, сотрудничестве и развитии специалистов.",
        quote:
          "Мы приглашаем специалистов, преподавателей, владельцев бизнеса и бренды стать частью сообщества основателей, которое формирует будущее индустрии красоты.",
        cta: "Стать частью сообщества",
        stats: [
          { label: "Участников-основателей", value: "2.5K+" },
          { label: "Партнеров-основателей", value: "120+" },
          { label: "Глобальное сообщество", value: "Активно" },
          { label: "Заявки", value: "Открыты" },
        ],
      },
      cta: {
        eyebrow: "Формируйте будущее",
        title: "Станьте частью глобального профессионального beauty-сообщества",
        description:
          "Присоединяйтесь к профессиональной ассоциации, которая развивает отраслевые стандарты, образование и сотрудничество между специалистами индустрии красоты по всему миру.",
        primaryCta: "Подать заявку в сообщество",
        secondaryCta: "Смотреть тарифы и пакеты",
      },
    },
  },
  uk: {
    nav: {
      about: "Про асоціацію",
      membership: "Спільнота",
      criteria: "Критерії",
      standards: "Стандарти",
      governance: "Управління",
      contact: "Контакти",
      apply: "Подати заявку",
      login: "Login",
      menu: "Мова",
    },
    footer: {
      description:
        "International Beauty Professionals Association (IBPA) розвиває професійні стандарти та міжнародну співпрацю в індустрії краси.",
      email: "Email",
      call: "Зателефонувати",
      map: "Мапа",
      siteMap: "Мапа сайту",
      contactInfo: "Контакти",
      policies: "Політики",
      faq: "FAQ",
      governance: "Управління",
      events: "Події",
      news: "Новини",
      partnership: "Партнерство",
      copyrightTagline: "Професійні стандарти, освіта та глобальна співпраця.",
    },
    cookies: {
      title: "Використання cookie",
      description:
        "Ми використовуємо cookie, щоб покращувати роботу сайту, запам’ятовувати ваші налаштування та робити взаємодію з IBPA зручнішою.",
      accept: "Прийняти все",
      necessaryOnly: "Тільки необхідні",
    },
    home: {
      hero: {
        titleTop: "International Beauty",
        titleBottom: "Professionals Association",
        subtitle: "Де краса створює спільноту",
        description:
          "IBPA об’єднує beauty-професіоналів, викладачів і бренди для розвитку галузевих стандартів, освіти та глобального зростання.",
        primaryCta: "Подати заявку",
        secondaryCta: "Партнер / Спонсор",
        ticker: ["Професійні стандарти", "Міжнародна співпраця", "Спільнота індустрії краси"],
      },
      about: {
        title: "Підвищуємо стандарти краси у всьому світі",
        subtitle:
          "International Beauty Professionals Association — це професійна неприбуткова організація, що підтримує високий рівень експертизи в індустрії краси.",
        commitmentLabel: "Ми розвиваємо:",
        commitmentItems: [
          "професійне зростання",
          "високі галузеві стандарти",
          "міжнародну співпрацю",
          "освіту та інновації",
        ],
        quote:
          "Наша мета — зміцнювати індустрію краси як шановану професійну сферу, побудовану на експертизі, етиці та якості.",
        readMore: "Детальніше",
      },
      audience: {
        title: "Для кого створена асоціація",
        eyebrow: "Відкритий професіоналізм",
        annualFee: "Річний внесок",
        items: [
          {
            title: "Спеціалісти",
            price: "$49",
            type: "ENTRY",
            desc: "Спеціалісти, які навчаються б’юті-професіям і будують кар’єру в індустрії краси.",
            img: "/home/student-1.webp",
          },
          {
            title: "Професіонали",
            price: "$199",
            type: "MASTER",
            desc: "Практикуючі професіонали: бровісти, lash-майстри, візажисти, косметологи, естетисти, PMU-майстри, nail-професіонали та майстри з волосся.",
            img: "/home/professional.webp",
          },
          {
            title: "Викладачі та тренери",
            price: "$399",
            type: "ELITE",
            desc: "Викладачі, тренери, академії та освітні платформи, що працюють у сфері б’юті-освіти.",
            img: "/home/trainer-2.webp",
          },
          {
            title: "Власники бізнесу",
            price: "$599",
            type: "PREMIUM",
            desc: "Власники салонів краси, студій, б’юті-просторів та інших бізнесів в індустрії краси.",
            img: "/home/salon.webp",
          },
          {
            title: "Бренди та компанії",
            price: "$1,299",
            type: "PARTNER",
            desc: "Бренди, дистриб’ютори, виробники та сервісні компанії, що працюють в індустрії краси.",
            img: "/home/brand.webp",
          },
        ],
      },
      benefits: {
        eyebrow: "Переваги спільноти",
        title: "Чому IBPA",
        detailsCta: "Усі тарифи та пакети",
        items: [
          {
            title: "Освіта",
            desc: "Доступ до освітніх програм, вебінарів, ресурсів і матеріалів для професійного розвитку.",
          },
          {
            title: "Стандарти",
            desc: "Професійні стандарти, найкращі практики та етичні принципи роботи в індустрії краси.",
          },
          {
            title: "Спільнота",
            desc: "Глобальна професійна мережа, що об’єднує експертів індустрії краси з усього світу.",
          },
          {
            title: "Визнання",
            desc: "Професійне визнання через сертифікат учасника, розміщення в каталозі учасників та офіційні підтвердження асоціації.",
          },
          {
            title: "Події",
            desc: "Доступ до конференцій, майстер-класів, networking-подій, професійних форумів і змагань.",
          },
        ],
      },
      events: {
        eyebrow: "Найближчі події",
        title: "Майбутні події",
        description:
          "IBPA регулярно організовує професійні події, що підтримують освіту, нетворкінг і співпрацю в індустрії краси.",
        subdescription:
          "Кожна подія об’єднує експертів, викладачів, бренди та професіоналів для обміну знаннями й досвідом.",
        viewAll: "Переглянути всі події",
        register: "Зареєструватися",
        upcoming: "Незабаром",
        items: [
          {
            date: "15–17 червня 2026",
            name: "Global Beauty Summit 2026",
            location: "Сакраменто, Каліфорнія / Конгрес-центр",
            img: "https://images.unsplash.com/photo-1542764140-f38e04d3e0c4?q=80&w=800",
          },
          {
            date: "22 серпня 2026",
            name: "Advanced PMU Masterclass",
            location: "Онлайн / Віртуальний формат",
            img: "https://images.unsplash.com/photo-1737063989672-67d79de1b2f7?q=80&w=800",
          },
          {
            date: "10 жовтня 2026",
            name: "Intl Lash & Brow Cup",
            location: "Париж, Франція / Гібридний формат",
            img: "https://images.unsplash.com/photo-1735151226446-1d364b4adc2f?q=80&w=800",
          },
        ],
      },
      news: {
        eyebrow: "Новини та інсайти індустрії",
        title: "Новини та оновлення",
        description:
          "Слідкуйте за новинами асоціації, розвитком індустрії, професійними статтями, освітніми ініціативами та майбутніми подіями.",
        viewAll: "Переглянути всі новини",
        readArticle: "Читати статтю",
        items: [
          {
            category: "Минула подія",
            title: "Beauty Forum 2025 відбувся в Сан-Франциско",
            date: "7-8 листопада 2025",
            img: "/news/beauty-forum-2025.webp",
          },
          {
            category: "Новини асоціації",
            title: "IBPA розробляє власний професійний журнал",
            date: "25 березня 2026",
            img: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1200",
          },
        ],
      },
      community: {
        eyebrow: "Сила спільноти",
        title: "Формуємо глобальну beauty-спільноту",
        description:
          "IBPA формує міжнародну професійну спільноту, засновану на експертизі, співпраці та розвитку професіоналів.",
        quote:
          "Ми запрошуємо професіоналів, викладачів, власників бізнесу та бренди стати частиною спільноти засновників, яка формує майбутнє індустрії краси.",
        cta: "Стати частиною спільноти",
        stats: [
          { label: "Учасників-засновників", value: "2.5K+" },
          { label: "Партнерів-засновників", value: "120+" },
          { label: "Глобальна спільнота", value: "Активна" },
          { label: "Заявки", value: "Відкриті" },
        ],
      },
      cta: {
        eyebrow: "Формуйте майбутнє",
        title: "Станьте частиною глобальної професійної beauty-спільноти",
        description:
          "Приєднуйтесь до професійної асоціації, яка розвиває галузеві стандарти, освіту та співпрацю між професіоналами індустрії краси по всьому світу.",
        primaryCta: "Подати заявку до спільноти",
        secondaryCta: "Переглянути тарифи та пакети",
      },
    },
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = React.useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) {
        return;
      }

      setLocaleState(nextLocale);
      const cookieValue = getLocaleCookieValue(nextLocale);
      window.localStorage.setItem("ibpa-locale", cookieValue);
      document.cookie = `ibpa-locale=${cookieValue}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = nextLocale;
      router.refresh();
    },
    [locale, router],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: {
        ...dictionaries[locale],
        dashboard: dashboardDictionaries[locale],
      },
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
