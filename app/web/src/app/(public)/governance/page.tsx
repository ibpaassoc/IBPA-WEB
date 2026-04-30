"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Users, User, FileText, PieChart, ChevronDown } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cyrillicDisplay } from "@/lib/cyrillic-fonts";
import { homeTemplateAccent, homeTemplateDisplay } from "@/lib/home-template-fonts";
import { useI18n } from "@/lib/i18n";

export default function Governance() {
  const { locale } = useI18n();
  const isRu = locale === "ru";
  const isUk = locale === "uk";
  const useEnglishTypography = true;
  const [expandedMember, setExpandedMember] = React.useState<string | null>(null);
  const headlineClassName = useEnglishTypography
    ? `${homeTemplateDisplay.className} font-bold tracking-[-0.045em]`
    : `${cyrillicDisplay.className} font-light tracking-[-0.03em]`;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 },
  };

  const sections = [
    {
      title: isRu ? "Совет директоров" : isUk ? "Рада директорів" : "Board of Directors",
      icon: <Users className="w-8 h-8" />,
      content: isRu
        ? "Совет директоров — это высший руководящий орган ассоциации, отвечающий за стратегическое управление, соблюдение миссии организации, утверждение ключевых решений и общее руководство деятельностью ассоциации."
        : isUk
          ? "Рада директорів — це найвищий керівний орган асоціації, що відповідає за стратегічне управління, дотримання місії організації, затвердження ключових рішень і загальне керівництво діяльністю асоціації."
        : "The Board of Directors is the association's highest governing body, responsible for strategic management, mission alignment, approval of key decisions, and overall supervision of association activity.",
    },
    {
      title: isRu ? "Президент" : isUk ? "Президент" : "President",
      icon: <User className="w-8 h-8" />,
      content: isRu
        ? "Президент — это высшее должностное лицо ассоциации, осуществляющее общее руководство организацией и представляющее ассоциацию на внутреннем и внешнем уровнях."
        : isUk
          ? "Президент — це найвища посадова особа асоціації, яка здійснює загальне керівництво організацією та представляє асоціацію на внутрішньому й зовнішньому рівнях."
        : "The President is the senior officer of the association, providing overall leadership and representing the organization internally and externally.",
      functions: isRu
        ? [
            "определяет стратегическое направление развития ассоциации",
            "представляет ассоциацию в профессиональной и общественной среде",
            "председательствует на заседаниях Совета директоров",
            "контролирует реализацию миссии, целей и ключевых инициатив",
            "координирует работу должностных лиц и комитетов",
            "участвует в утверждении основных решений",
            "обеспечивает соблюдение уставных документов и внутренней политики ассоциации",
          ]
        : isUk
          ? [
              "визначає стратегічний напрям розвитку асоціації",
              "представляє асоціацію у професійному та публічному середовищі",
              "головує на засіданнях Ради директорів",
              "контролює реалізацію місії, цілей і ключових ініціатив",
              "координує роботу посадових осіб і комітетів",
              "бере участь у затвердженні основних рішень",
              "забезпечує дотримання статутних документів і внутрішньої політики асоціації",
            ]
        : [
            "defines the strategic direction of the association",
            "represents the association in professional and public settings",
            "chairs meetings of the Board of Directors",
            "oversees the mission, goals, and key initiatives",
            "coordinates the work of officers and committees",
            "participates in major decisions",
            "ensures compliance with governing documents and internal policies",
          ],
      footer: isRu
        ? "Президент является публичным лидером ассоциации и отвечает за стратегическое видение, стабильность управления и общее развитие организации."
        : isUk
          ? "Президент є публічним лідером асоціації та відповідає за стратегічне бачення, стабільність управління й загальний розвиток організації."
        : "The President serves as the public leader of the association and is responsible for strategic vision, governance stability, and organizational growth.",
    },
    {
      title: isRu ? "Вице-президент" : isUk ? "Віце-президент" : "Vice President",
      icon: <User className="w-8 h-8" />,
      content: isRu
        ? "Вице-президент — это должностное лицо ассоциации, поддерживающее работу президента и участвующее в стратегическом и операционном управлении организацией."
        : isUk
          ? "Віце-президент — це посадова особа асоціації, яка підтримує роботу президента та бере участь у стратегічному й операційному управлінні організацією."
        : "The Vice President supports the President and participates in both strategic and operational management of the association.",
      functions: isRu
        ? [
            "помогает президенту в исполнении его обязанностей",
            "замещает президента при его отсутствии или невозможности исполнять обязанности",
            "участвует в координации ключевых проектов и внутренних процессов",
            "контролирует отдельные направления работы ассоциации по поручению Совета директоров",
            "обеспечивает взаимодействие между комитетами, участниками Совета и инициативами ассоциации",
            "участвует в развитии партнёрств, программ и профессиональных инициатив",
          ]
        : isUk
          ? [
              "допомагає президентові у виконанні його обов’язків",
              "замінює президента за його відсутності або неможливості виконувати обов’язки",
              "бере участь у координації ключових проєктів і внутрішніх процесів",
              "контролює окремі напрями роботи асоціації за дорученням Ради директорів",
              "забезпечує взаємодію між комітетами, учасниками Ради та ініціативами асоціації",
              "бере участь у розвитку партнерств, програм і професійних ініціатив",
            ]
        : [
            "supports the President in fulfilling responsibilities",
            "acts in place of the President when needed",
            "helps coordinate key projects and internal processes",
            "oversees delegated workstreams of the association",
            "supports collaboration between committees, board members, and initiatives",
            "contributes to partnerships, programs, and professional initiatives",
          ],
      footer: isRu
        ? "Вице-президент играет важную роль в обеспечении непрерывности управления и реализации стратегических задач ассоциации."
        : isUk
          ? "Віце-президент відіграє важливу роль у забезпеченні безперервності управління та реалізації стратегічних завдань асоціації."
        : "The Vice President plays an important role in governance continuity and execution of strategic priorities.",
    },
    {
      title: isRu ? "Секретарь" : isUk ? "Секретар" : "Secretary",
      icon: <FileText className="w-8 h-8" />,
      content: isRu
        ? "Секретарь — это должностное лицо ассоциации, отвечающее за корпоративную документацию, официальные записи и надлежащее ведение внутренних процедур."
        : isUk
          ? "Секретар — це посадова особа асоціації, яка відповідає за корпоративну документацію, офіційні записи та належне ведення внутрішніх процедур."
        : "The Secretary is responsible for corporate documentation, official records, and proper administration of internal procedures.",
      functions: isRu
        ? [
            "ведет и хранит протоколы заседаний Совета директоров и, при необходимости, собраний участников",
            "обеспечивает надлежащее ведение корпоративных записей",
            "контролирует оформление официальных решений, уведомлений и внутренних документов",
            "отвечает за хранение уставных документов, протоколов, решений и других материалов",
            "содействует соблюдению процедурных требований, установленных уставом и внутренними правилами",
          ]
        : isUk
          ? [
              "веде та зберігає протоколи засідань Ради директорів і, за потреби, зборів учасників",
              "забезпечує належне ведення корпоративних записів",
              "контролює оформлення офіційних рішень, повідомлень і внутрішніх документів",
              "відповідає за зберігання статутних документів, протоколів, рішень та інших матеріалів",
              "сприяє дотриманню процедурних вимог, установлених статутом і внутрішніми правилами",
            ]
        : [
            "maintains minutes of board meetings and, when needed, member meetings",
            "ensures proper recordkeeping",
            "supports official resolutions, notices, and internal documents",
            "safeguards governing documents, minutes, resolutions, and other core materials",
            "helps uphold procedural requirements established by the bylaws and internal rules",
          ],
      footer: isRu
        ? "Секретарь отвечает за документальную точность, процедурную корректность и сохранность ключевых корпоративных материалов ассоциации."
        : isUk
          ? "Секретар відповідає за документальну точність, процедурну коректність і збереження ключових корпоративних матеріалів асоціації."
        : "The Secretary is responsible for documentary accuracy, procedural integrity, and preservation of key corporate materials.",
    },
    {
      title: isRu ? "Казначей" : isUk ? "Скарбник" : "Treasurer",
      icon: <PieChart className="w-8 h-8" />,
      content: isRu
        ? "Казначей — это должностное лицо ассоциации, отвечающее за финансовый надзор, прозрачность финансовой информации и контроль финансовых процессов организации."
        : isUk
          ? "Скарбник — це посадова особа асоціації, яка відповідає за фінансовий нагляд, прозорість фінансової інформації та контроль фінансових процесів організації."
        : "The Treasurer oversees financial supervision, transparency of financial information, and control of the association's financial processes.",
      functions: isRu
        ? [
            "контролирует финансовое состояние ассоциации",
            "участвует в подготовке и представлении финансовых отчетов",
            "следит за учетом взносов, доходов и расходов",
            "участвует в разработке бюджетов и финансовых планов",
            "контролирует финансовую дисциплину и внутренние процедуры",
          ]
        : isUk
          ? [
              "контролює фінансовий стан асоціації",
              "бере участь у підготовці та представленні фінансових звітів",
              "стежить за обліком внесків, доходів і витрат",
              "бере участь у розробці бюджетів і фінансових планів",
              "контролює фінансову дисципліну та внутрішні процедури",
            ]
        : [
            "monitors the financial condition of the association",
            "participates in preparation and presentation of financial reports",
            "oversees proper accounting of dues, income, and expenses",
            "contributes to budgets and financial planning",
            "supports financial discipline and internal procedures",
          ],
      footer: isRu
        ? "Казначей отвечает за финансовую добросовестность, прозрачность и устойчивость деятельности ассоциации."
        : isUk
          ? "Скарбник відповідає за фінансову доброчесність, прозорість і стійкість діяльності асоціації."
        : "The Treasurer is responsible for financial integrity, transparency, and sustainability of association operations.",
    },
  ];

  const committees = [
    {
      title: isRu ? "Комиссия по отбору" : isUk ? "Комісія з відбору" : "Membership Review Board",
      desc: isRu
        ? "Рассматривает заявки на вступление, оценивает кандидатов по установленным критериям и выносит коллегиальное решение о допуске или отказе в участии."
        : isUk
          ? "Розглядає заявки на вступ, оцінює кандидатів за встановленими критеріями та ухвалює колегіальне рішення про допуск або відмову в участі."
        : "Reviews applications, evaluates candidates against association criteria, and makes collective decisions on admission.",
    },
    {
      title: isRu ? "Комитет по образованию" : isUk ? "Комітет з освіти" : "Education Committee",
      desc: isRu
        ? "Отвечает за образовательные программы, вебинары, курсы, экспертные материалы и развитие профессионального контента."
        : isUk
          ? "Відповідає за освітні програми, вебінари, курси, експертні матеріали та розвиток професійного контенту."
        : "Oversees educational programs, webinars, courses, expert materials, and learning initiatives.",
    },
    {
      title: isRu ? "Комитет по стандартам и этике" : isUk ? "Комітет зі стандартів та етики" : "Standards & Ethics Committee",
      desc: isRu
        ? "Разрабатывает и поддерживает внутренние стандарты ассоциации, лучшие практики и рекомендации по этике."
        : isUk
          ? "Розробляє та підтримує внутрішні стандарти асоціації, найкращі практики й рекомендації з етики."
        : "Develops and maintains internal standards, best practices, and ethics recommendations.",
    },
    {
      title: isRu ? "Комитет по мероприятиям" : isUk ? "Комітет з подій" : "Events Committee",
      desc: isRu
        ? "Отвечает за планирование, организацию и координацию мероприятий ассоциации."
        : isUk
          ? "Відповідає за планування, організацію та координацію подій асоціації."
        : "Leads planning, organization, and coordination of association events.",
    },
    {
      title: isRu ? "Комитет по медиа и публикациям" : isUk ? "Комітет з медіа та публікацій" : "Media & Publications Committee",
      desc: isRu
        ? "Курирует публикации, статьи, публичные коммуникации и информационное присутствие ассоциации."
        : isUk
          ? "Курує публікації, статті, публічні комунікації та інформаційну присутність асоціації."
        : "Supervises publications, articles, public communications, and the association's information presence.",
    },
    {
      title: isRu ? "Комитет по партнерствам" : isUk ? "Комітет з партнерств" : "Partnerships Committee",
      desc: isRu
        ? "Отвечает за развитие сотрудничества с брендами, школами, партнерами, спонсорами и другими организациями."
        : isUk
          ? "Відповідає за розвиток співпраці з брендами, школами, партнерами, спонсорами та іншими організаціями."
        : "Develops relationships with brands, schools, partners, sponsors, and other organizations.",
    },
  ];

  const boardMembers = [
    {
      id: "yulia-andreeva",
      name: "Iuliia Andreeva",
      image: "/board/board-of-directors-iulia.webp",
      role: isRu ? "Президент" : isUk ? "Президент" : "President",
      title: isRu ? "Президент, International Beauty Professionals Association" : isUk ? "Президент, International Beauty Professionals Association" : "President, International Beauty Professionals Association",
      paragraphs: isRu
        ? [
            "Iuliia Andreeva — основатель, визионер и движущая сила International Beauty Professionals Association. Как главный инициатор и идеолог организации, она объединяет профессионалов, бизнес и лидеров индустрии вокруг чёткой миссии — повышать стандарты и создавать новые возможности внутри мировой индустрии красоты.",
            "Имея сильный предпринимательский бэкграунд, Iuliia успешно создала и масштабировала несколько бизнесов, каждый раз выводя проекты на высокий уровень. Она начала карьеру как beauty-специалист, добилась признания через конкурсы и профессиональные достижения, а позже основала и управляла успешным салоном красоты в Москве.",
            "После переезда в Соединённые Штаты Iuliia продолжила путь как бизнес-лидер и создатель сообщества. Она организовала несколько крупных отраслевых событий, включая три beauty-форума и профессиональный beauty-чемпионат в Сан-Франциско, объединив экспертов, бренды и специалистов со всей индустрии.",
            "В роли Президента ассоциации Iuliia определяет её стратегическое направление и курирует все ключевые инициативы. Она отвечает за построение партнёрств, развитие профессиональных стандартов и за то, чтобы организация действовала в интересах индустрии в целом.",
            "Её лидерство сфокусировано на создании сильного, связанного и ориентированного в будущее профессионального сообщества, в котором специалисты индустрии красоты могут расти, сотрудничать и выходить на новый уровень признания.",
          ]
        : isUk
          ? [
              "Iuliia Andreeva — засновниця, візіонерка та рушійна сила International Beauty Professionals Association. Як головна ініціаторка та ідеологиня організації, вона об’єднує професіоналів, бізнес і лідерів індустрії навколо чіткої місії — підвищувати стандарти та створювати нові можливості в межах світової індустрії краси.",
              "Маючи сильний підприємницький бекграунд, Iuliia успішно створила та масштабувала кілька бізнесів, щоразу виводячи проєкти на високий рівень. Вона розпочала кар’єру як beauty-фахівець, здобула визнання через конкурси та професійні досягнення, а згодом заснувала й керувала успішним салоном краси в Москві.",
              "Після переїзду до Сполучених Штатів Iuliia продовжила шлях як бізнес-лідерка та творчиня спільноти. Вона організувала кілька великих галузевих подій, включно з трьома beauty-форумами та професійним beauty-чемпіонатом у Сан-Франциско, об’єднавши експертів, бренди та фахівців з усієї індустрії.",
              "У ролі Президента асоціації Iuliia визначає її стратегічний напрям і курує всі ключові ініціативи. Вона відповідає за побудову партнерств, розвиток професійних стандартів і за те, щоб організація діяла в інтересах індустрії загалом.",
              "Її лідерство зосереджене на створенні сильної, пов’язаної та орієнтованої в майбутнє професійної спільноти, у якій фахівці індустрії краси можуть зростати, співпрацювати й виходити на новий рівень визнання.",
            ]
        : [
            "Iuliia Andreeva is the founder, visionary, and driving force behind the International Beauty Professionals Association. As the main initiator and ideologist of the organization, she brings together professionals, businesses, and industry leaders with a clear mission — to elevate standards and create new opportunities within the global beauty industry.",
            "With a strong entrepreneurial background, Iuliia has successfully built and scaled multiple businesses, consistently bringing each venture to a high level of success. She began her career as a beauty professional, achieving recognition through competitions and industry achievements, and later founded and managed a successful beauty salon in Moscow.",
            "After relocating to the United States, Iuliia continued her path as a business leader and community builder. She has organized multiple large-scale industry events, including three beauty forums and a professional beauty competition in San Francisco, bringing together experts, brands, and specialists from across the industry.",
            "As President of the Association, Iuliia defines its strategic direction and oversees all key initiatives. She is responsible for building partnerships, developing professional standards, and ensuring that the organization operates in the best interests of the industry as a whole.",
            "Her leadership is focused on creating a strong, connected, and forward-thinking professional community, where beauty specialists can grow, collaborate, and reach a new level of recognition.",
          ],
    },
    {
      id: "sergey-andreev",
      name: "Sergei Andreev",
      image: "/board/board-of-directors-sergei.webp",
      role: isRu ? "Вице-президент" : isUk ? "Віце-президент" : "Vice President",
      title: isRu ? "Вице-президент, International Beauty Professionals Association" : isUk ? "Віце-президент, International Beauty Professionals Association" : "Vice President, International Beauty Professionals Association",
      paragraphs: isRu
        ? [
            "Sergei Andreev — медиаменеджер, журналист и основатель, чьё присутствие определяет то, как проекты видят, слышат и запоминают.",
            "Имея опыт работы на крупных телевизионных каналах, он участвовал в медиа-продакшене высокого уровня и сформировал тонкое понимание того, что привлекает внимание и влияет на общественное восприятие. Его экспертиза лежит не только в контенте, но и во влиянии — в умении придавать проектам вес, направление и резонанс.",
            "Sergei является основателем независимой радиостанции, которая постепенно развивается в медиагруппу — платформу, выстроенную вокруг голоса, охвата и стратегической коммуникации. Благодаря этому он стал заметной и влиятельной фигурой в русскоязычном медиапространстве Соединённых Штатов.",
            "Его профессиональный путь также включает участие в конкурсе «Person of the Year», что отражает его узнаваемость и присутствие в индустрии.",
            "В International Beauty Professionals Association Sergei Andreev занимает должность Вице-президента и является одной из ключевых фигур организации. Он формирует голос ассоциации, задаёт её тон и определяет, как она представляется внешнему миру. Его роль не ограничивается коммуникацией — это влияние, позиционирование и масштаб.",
            "Sergei играет ведущую роль в создании наиболее заметных инициатив ассоциации, включая крупные beauty-форумы и отраслевые события, куда он привносит особую энергию, присутствие и медиавес.",
            "Sergei Andreev — не просто часть структуры, а голос, который стоит за ней. Его участие придаёт ассоциации ясность, характер и тот уровень видимости, который выделяет её на фоне других.",
          ]
        : isUk
          ? [
              "Sergei Andreev — медіаменеджер, журналіст і засновник, чия присутність визначає те, як проєкти бачать, чують і запам’ятовують.",
              "Маючи досвід роботи на великих телевізійних каналах, він брав участь у медіапродакшені високого рівня та сформував тонке розуміння того, що привертає увагу й впливає на суспільне сприйняття. Його експертиза полягає не лише в контенті, а й у впливі — в умінні надавати проєктам вагу, напрям і резонанс.",
              "Sergei є засновником незалежної радіостанції, яка поступово розвивається в медіагрупу — платформу, побудовану навколо голосу, охоплення та стратегічної комунікації. Завдяки цьому він став помітною та впливовою фігурою в російськомовному медіапросторі Сполучених Штатів.",
              "Його професійний шлях також включає участь у конкурсі Person of the Year, що відображає його впізнаваність і присутність в індустрії.",
              "У International Beauty Professionals Association Sergei Andreev обіймає посаду Віце-президента та є однією з ключових фігур організації. Він формує голос асоціації, задає її тон і визначає, як вона представлена зовнішньому світу. Його роль не обмежується комунікацією — це вплив, позиціонування та масштаб.",
              "Sergei відіграє провідну роль у створенні найпомітніших ініціатив асоціації, включно з великими beauty-форумами та галузевими подіями, куди він привносить особливу енергію, присутність і медійну вагу.",
              "Sergei Andreev — не просто частина структури, а голос, що стоїть за нею. Його участь надає асоціації ясності, характеру й того рівня видимості, який вирізняє її серед інших.",
            ]
        : [
            "Sergei Andreev is a media manager, journalist, and founder whose presence defines how projects are seen, heard, and remembered.",
            "With a background in major television networks, he has worked on high-visibility media productions, developing a sharp instinct for what captures attention and shapes public perception. His expertise lies not only in content, but in influence — in the ability to give projects weight, direction, and resonance.",
            "He is the founder of an independent radio station that is steadily evolving into a media group — a platform built around voice, reach, and strategic communication. Through this, Sergei has established himself as a recognizable and influential figure within the Russian-speaking media space in the United States.",
            "His professional path also includes participation in the “Person of the Year” competition, reflecting his presence and recognition within the industry.",
            "Within the International Beauty Professionals Association, Sergei Andreev serves as Vice President and stands as one of its most defining figures. He shapes the Association’s voice, sets its tone, and determines how it is presented to the outside world. His role is not limited to communication — it is about influence, positioning, and scale.",
            "Sergei plays a leading role in the creation of the Association’s most visible initiatives, including large-scale beauty forums and industry events, where he brings a distinct level of energy, presence, and media impact.",
            "Sergei Andreev is not just part of the structure — he is the voice behind it. His presence gives the Association clarity, character, and a level of visibility that sets it apart.",
          ],
      responsibilities: isRu
        ? [
            "определяет голос, тон и публичную идентичность ассоциации",
            "усиливает её видимость и укрепляет влияние",
            "курирует медианаправление ключевых инициатив и проектов",
            "соорганизует крупные события с сильным общественным эффектом",
            "участвует в стратегических решениях, которые формируют будущее ассоциации",
          ]
        : isUk
          ? [
              "визначає голос, тон і публічну ідентичність асоціації",
              "посилює її видимість і зміцнює вплив",
              "курує медійний напрям ключових ініціатив і проєктів",
              "співорганізовує великі події з сильним суспільним ефектом",
              "бере участь у стратегічних рішеннях, що формують майбутнє асоціації",
            ]
        : [
            "defining the Association’s voice, tone, and public identity",
            "amplifying its visibility and strengthening its influence",
            "leading the media direction of key initiatives and projects",
            "co-creating large-scale events with strong public impact",
            "contributing to strategic decisions that shape the Association’s future",
          ],
    },
    {
      id: "valeria-kizchuk",
      name: "Valeriia Kizchuk",
      image: "/board/board-of-directors-valeriia.webp",
      role: isRu ? "Секретарь" : isUk ? "Секретар" : "Secretary",
      title: isRu ? "Секретарь, International Beauty Professionals Association" : isUk ? "Секретар, International Beauty Professionals Association" : "Secretary, International Beauty Professionals Association",
      paragraphs: isRu
        ? [
            "Valeriia Kizchuk — профессионал beauty-индустрии и операционный стратег с сильной базой как в творческой практике, так и в административном управлении. Имея опыт работы визажистом и глубокое понимание внутренних процессов, она привносит ясность, структуру и точность во всё, за что берётся.",
            "Работая в тесном взаимодействии с руководством ассоциации, Valeriia сыграла ключевую роль в успешной организации крупных отраслевых событий, включая три масштабных форума beauty-бизнеса и профессиональный beauty-чемпионат в Сан-Франциско. Её способность управлять сложными процессами и доводить задачи до результата сделала её одной из опор этих инициатив.",
            "В роли Секретаря International Beauty Professionals Association Valeriia является операционным ядром организации. Она обеспечивает целостность внутренних систем, курирует документацию и коммуникацию и поддерживает реализацию всех стратегических инициатив на высоком уровне.",
            "Исключительное внимание Valeriia к деталям, структурное мышление и способность превращать сложные процессы в слаженные системы делают её важнейшей опорой стабильности и роста ассоциации.",
          ]
        : isUk
          ? [
              "Valeriia Kizchuk — професіоналка beauty-індустрії та операційна стратегиня з сильною базою як у творчій практиці, так і в адміністративному управлінні. Маючи досвід роботи візажисткою та глибоке розуміння внутрішніх процесів, вона привносить ясність, структуру й точність у все, за що береться.",
              "Працюючи в тісній взаємодії з керівництвом асоціації, Valeriia відіграла ключову роль в успішній організації великих галузевих подій, включно з трьома масштабними форумами beauty-бізнесу та професійним beauty-чемпіонатом у Сан-Франциско. Її здатність керувати складними процесами й доводити завдання до результату зробила її однією з опор цих ініціатив.",
              "У ролі Секретаря International Beauty Professionals Association Valeriia є операційним ядром організації. Вона забезпечує цілісність внутрішніх систем, курує документацію й комунікацію та підтримує реалізацію всіх стратегічних ініціатив на високому рівні.",
              "Виняткова увага Valeriia до деталей, структурне мислення та здатність перетворювати складні процеси на злагоджені системи роблять її найважливішою опорою стабільності та зростання асоціації.",
            ]
        : [
            "Valeriia Kizchuk is a beauty industry professional and operational strategist with a strong foundation in both creative practice and administrative management. With experience as a makeup artist and a deep understanding of internal processes, she brings clarity, structure, and precision to every aspect of her work.",
            "Working in close collaboration with the Association’s leadership, Valeriia has played a key role in the successful organization of major industry events, including three large-scale beauty business forums and a professional beauty competition in San Francisco. Her ability to manage complex processes and deliver results has positioned her as a vital force behind these initiatives.",
            "As Secretary of the International Beauty Professionals Association, Valeriia serves as the operational backbone of the organization. She ensures the integrity of internal systems, oversees documentation and communication, and supports the execution of all strategic initiatives at the highest standard.",
            "Valeriia’s exceptional attention to detail, structured thinking, and ability to turn complex operations into seamless systems make her an essential pillar of the Association’s stability and growth.",
          ],
      responsibilities: isRu
        ? [
            "ведёт и поддерживает всю официальную документацию и организационные записи",
            "координирует внутренние операции и обеспечивает эффективность процессов",
            "поддерживает руководство в реализации стратегических инициатив и крупных проектов",
            "обеспечивает ясную коммуникацию на всех уровнях организации",
            "поддерживает последовательность, структуру и соответствие процессов внутренним требованиям",
          ]
        : isUk
          ? [
              "веде та підтримує всю офіційну документацію й організаційні записи",
              "координує внутрішні операції та забезпечує ефективність процесів",
              "підтримує керівництво в реалізації стратегічних ініціатив і великих проєктів",
              "забезпечує ясну комунікацію на всіх рівнях організації",
              "підтримує послідовність, структуру та відповідність процесів внутрішнім вимогам",
            ]
        : [
            "Managing and maintaining all official documentation and organizational records",
            "Coordinating internal operations and ensuring process efficiency",
            "Supporting leadership in executing strategic initiatives and large-scale projects",
            "Maintaining clear communication across all levels of the organization",
            "Ensuring consistency, structure, and compliance within all processes",
          ],
    },
    {
      id: "anastasia-shevchenko",
      name: "Anastasiia Shevchenko",
      image: "/board/board-of-directors-anastasiia.webp",
      role: isRu ? "Казначей" : isUk ? "Скарбник" : "Treasurer",
      title: isRu ? "Казначей, International Beauty Professionals Association" : isUk ? "Скарбник, International Beauty Professionals Association" : "Treasurer, International Beauty Professionals Association",
      paragraphs: isRu
        ? [
            "Anastasiia Shevchenko — отмеченный наградами beauty-специалист, предприниматель и яркий представитель новой волны индустрии, отличающийся точностью, дисциплиной и высоким стандартом реализации. Победитель профессиональных соревнований и участник международно признанной beauty-ассоциации, она представляет новый уровень профессионализма в современной индустрии красоты.",
            "Её карьера определяется не только техническим мастерством, но и способностью выстраивать, структурировать и совершенствовать каждый аспект своей работы. Anastasiia основала собственную студию и развила узнаваемый личный бренд, основанный на эстетике, ясности и очень осознанном подходе к клиентскому опыту и позиционированию.",
            "То, что выделяет её, — редкое сочетание утончённого художественного взгляда и сильного операционного мышления, то есть способность переводить идеи в структурированные системы, которые работают последовательно и управляемо. Её подход отражает глубокое понимание как творческой, так и стратегической стороны индустрии.",
            "В роли Казначея International Beauty Professionals Association Anastasiia отвечает за формирование финансового фундамента организации. Она определяет, как структурируются, распределяются и управляются ресурсы, обеспечивая поддержку каждой инициативы с точностью, устойчивостью и долгосрочным видением.",
            "Благодаря острому аналитическому мышлению, дисциплинированной реализации и сильному чувству ответственности Anastasiia играет ключевую роль в укреплении основы ассоциации, обеспечивая её стабильность, надёжность и долгосрочную траекторию развития.",
          ]
        : isUk
          ? [
              "Anastasiia Shevchenko — відзначена нагородами beauty-фахівчиня, підприємиця та яскрава представниця нової хвилі індустрії, що вирізняється точністю, дисципліною та високим стандартом реалізації. Переможниця професійних змагань і учасниця міжнародно визнаної beauty-асоціації, вона представляє новий рівень професіоналізму в сучасній індустрії краси.",
              "Її кар’єра визначається не лише технічною майстерністю, а й здатністю вибудовувати, структурувати та вдосконалювати кожен аспект своєї роботи. Anastasiia заснувала власну студію й розвинула впізнаваний особистий бренд, заснований на естетиці, ясності та дуже усвідомленому підході до клієнтського досвіду й позиціонування.",
              "Те, що вирізняє її, — рідкісне поєднання витонченого художнього бачення та сильного операційного мислення, тобто здатність перетворювати ідеї на структуровані системи, які працюють послідовно й керовано. Її підхід відображає глибоке розуміння як творчого, так і стратегічного боку індустрії.",
              "У ролі Скарбника International Beauty Professionals Association Anastasiia відповідає за формування фінансового фундаменту організації. Вона визначає, як структуруються, розподіляються та управляються ресурси, забезпечуючи підтримку кожної ініціативи з точністю, стійкістю й довгостроковим баченням.",
              "Завдяки гострому аналітичному мисленню, дисциплінованій реалізації та сильному почуттю відповідальності Anastasiia відіграє ключову роль у зміцненні основи асоціації, забезпечуючи її стабільність, надійність і довгострокову траєкторію розвитку.",
            ]
        : [
            "Anastasiia Shevchenko is an award-winning beauty professional, entrepreneur, and a rising industry figure distinguished by her precision, discipline, and elevated standards of execution. A first-place champion in professional competitions and a member of an internationally recognized beauty association, she represents a new level of professionalism within the modern beauty industry.",
            "Her career is defined not only by technical excellence, but by her ability to build, structure, and refine every aspect of her work. Anastasiia has established her own studio and developed a recognizable personal brand rooted in aesthetics, clarity, and a highly intentional approach to client experience and positioning.",
            "What sets her apart is a rare combination of refined artistic vision and strong operational thinking — the ability to translate ideas into structured systems that function with consistency and control. Her approach reflects a deep understanding of both the creative and strategic dimensions of the industry.",
            "As Treasurer of the International Beauty Professionals Association, Anastasiia is responsible for shaping the financial backbone of the organization. She defines how resources are structured, allocated, and managed, ensuring that every initiative is supported with precision, stability, and long-term vision.",
            "With a sharp analytical mindset, disciplined execution, and a strong sense of responsibility, Anastasiia plays a pivotal role in strengthening the Association’s foundation, ensuring its stability, credibility, and long-term trajectory.",
          ],
      responsibilities: isRu
        ? [
            "проектирует и поддерживает структурированную и масштабируемую финансовую систему",
            "формирует бюджетную стратегию в соответствии с приоритетами ассоциации",
            "обеспечивает ясность, порядок и подотчётность во всех финансовых операциях",
            "интегрирует финансовую логику в ключевые инициативы и организационные решения",
            "усиливает способность ассоциации к устойчивому росту и расширению",
          ]
        : isUk
          ? [
              "проєктує та підтримує структуровану й масштабовану фінансову систему",
              "формує бюджетну стратегію відповідно до пріоритетів асоціації",
              "забезпечує ясність, порядок і підзвітність у всіх фінансових операціях",
              "інтегрує фінансову логіку в ключові ініціативи й організаційні рішення",
              "посилює здатність асоціації до сталого зростання та розширення",
            ]
        : [
            "architecting and maintaining a structured and scalable financial framework",
            "directing budget strategy in alignment with the Association’s priorities",
            "ensuring clarity, order, and accountability across all financial operations",
            "integrating financial logic into key initiatives and organizational decisions",
            "reinforcing the Association’s capacity for sustainable growth and expansion",
          ],
    },
    {
      id: "tetiana-kysliuk",
      name: "Tetiana Kysliuk",
      image: "/board/board-of-directors-tetiana.webp",
      role: isRu ? "Член совета директоров" : isUk ? "Член ради директорів" : "Board Member",
      title: isRu ? "Член совета директоров, отбор участников и контроль качества" : isUk ? "Член ради директорів, відбір учасників і контроль якості" : "Board Member, Membership Selection & Quality Control",
      paragraphs: isRu
        ? [
            "Tetiana Kysliuk — internationally recognized beauty-эксперт, преподаватель и многократный призёр в направлении ламинирования ресниц. Её имя ассоциируется с мастерством, точностью и стабильно высокими стандартами внутри профессиональной beauty-индустрии.",
            "Победитель многочисленных международных чемпионатов, включая Top Beauty Master 2025 в Сан-Франциско, Tetiana зарекомендовала себя не только как сильный практик, но и как уважаемый судья международных beauty-соревнований, включая WBC и Glamour Area. Её экспертиза признана на международном уровне, где она оценивает и задаёт стандарт профессионального исполнения.",
            "Как сооснователь профессионального бренда TE’ORA Beauty и международного чемпионата TE’ORA Beauty Championship, она активно участвует в формировании отраслевых ориентиров и создании платформ для профессионального признания и роста. Кроме того, Tetiana является автором образовательных программ и курсов, через которые передаёт свою методологию и повышает уровень специалистов по всему миру.",
            "В International Beauty Professionals Association Tetiana Kysliuk занимает позицию Члена совета директоров, отвечающего за отбор участников и контроль качества — роль, которая напрямую определяет профессиональный стандарт организации.",
            "Ей доверено оценивать кандидатов, поддерживать целостность процесса отбора и следить за тем, чтобы каждый участник соответствовал уровню качества, профессионализма и репутации, который совпадает с ценностями ассоциации.",
            "Tetiana Kysliuk представляет тот уровень, к которому стремятся другие. Её роль в ассоциации — не только отбирать, но и определять, что значит быть частью по-настоящему профессионального сообщества.",
          ]
        : isUk
          ? [
              "Tetiana Kysliuk — internationally recognized beauty-експертка, викладачка та багаторазова призерка у напрямі ламінування вій. Її ім’я асоціюється з майстерністю, точністю й стабільно високими стандартами всередині професійної beauty-індустрії.",
              "Переможниця численних міжнародних чемпіонатів, включно з Top Beauty Master 2025 у Сан-Франциско, Tetiana зарекомендувала себе не лише як сильна практикиня, а й як шанована суддя міжнародних beauty-змагань, включно з WBC і Glamour Area. Її експертиза визнана на міжнародному рівні, де вона оцінює та задає стандарт професійного виконання.",
              "Як співзасновниця професійного бренду TE’ORA Beauty та міжнародного чемпіонату TE’ORA Beauty Championship, вона активно бере участь у формуванні галузевих орієнтирів і створенні платформ для професійного визнання та зростання. Крім того, Tetiana є авторкою освітніх програм і курсів, через які передає свою методологію та підвищує рівень фахівців у всьому світі.",
              "У International Beauty Professionals Association Tetiana Kysliuk займає позицію Члена ради директорів, відповідального за відбір учасників і контроль якості — роль, що безпосередньо визначає професійний стандарт організації.",
              "Їй довірено оцінювати кандидатів, підтримувати цілісність процесу відбору та стежити за тим, щоб кожен учасник відповідав рівню якості, професіоналізму й репутації, який збігається з цінностями асоціації.",
              "Tetiana Kysliuk уособлює той рівень, до якого прагнуть інші. Її роль в асоціації — не лише відбирати, а й визначати, що означає бути частиною по-справжньому професійної спільноти.",
            ]
        : [
            "Tetiana Kysliuk is an internationally recognized beauty expert, educator, and multiple award-winning specialist in lash lamination. Her name is associated with excellence, precision, and consistently high standards within the professional beauty industry.",
            "A winner of numerous international championships, including Top Beauty Master 2025 (San Francisco), Tetiana has established herself not only as a leading practitioner but also as a respected judge in global beauty competitions such as WBC and Glamour Area. Her expertise is widely acknowledged at an international level, where she evaluates and sets the standard for professional performance.",
            "As a co-founder of the professional brand TE’ORA Beauty and the international TE’ORA Beauty Championship, she actively contributes to shaping industry benchmarks and creating platforms for professional recognition and growth. In addition, Tetiana is the author of educational programs and training courses, through which she shares her methodology and elevates the level of specialists worldwide.",
            "Within the International Beauty Professionals Association, Tetiana Kysliuk serves as Board Member responsible for Membership Selection and Quality Control — a role that directly defines the professional standard of the organization.",
            "She is entrusted with evaluating candidates, maintaining the integrity of the membership process, and ensuring that every member meets a level of quality, professionalism, and credibility aligned with the Association’s values.",
            "Tetiana Kysliuk represents the level to which others aspire. Her role within the Association is not only to select — but to define what it means to be part of a truly professional community.",
          ],
      responsibilities: isRu
        ? [
            "курирует отбор и утверждение новых участников",
            "поддерживает высокий профессиональный стандарт внутри ассоциации",
            "оценивает квалификацию, достижения и экспертизу кандидатов",
            "участвует в разработке ясных критериев и ориентиров отбора",
            "обеспечивает репутацию и доверие к ассоциации через строгий контроль качества",
          ]
        : isUk
          ? [
              "курує відбір і затвердження нових учасників",
              "підтримує високий професійний стандарт усередині асоціації",
              "оцінює кваліфікацію, досягнення та експертизу кандидатів",
              "бере участь у розробці чітких критеріїв і орієнтирів відбору",
              "забезпечує репутацію та довіру до асоціації через суворий контроль якості",
            ]
        : [
            "overseeing the selection and approval of new members",
            "maintaining high professional standards within the Association",
            "evaluating qualifications, achievements, and expertise of applicants",
            "contributing to the development of clear membership criteria and benchmarks",
            "ensuring the credibility and reputation of the Association through rigorous quality control",
          ],
    },
    {
      id: "eleonora-bediukh",
      name: "Eleonora Bediukh",
      image: "/board/board-of-directors-eleonora.webp",
      role: isRu ? "Член совета директоров" : isUk ? "Член ради директорів" : "Board Member",
      title: isRu ? "Член совета директоров, отбор участников и контроль качества" : isUk ? "Член ради директорів, відбір учасників і контроль якості" : "Board Member, Membership Selection & Quality Control",
      paragraphs: isRu
        ? [
            "Eleonora Bediukh — internationally recognized brow-artist, lamimaker, преподаватель и отраслевой эксперт, чья работа отражает высокий уровень точности, структуры и профессионального авторитета.",
            "Как многократный призёр и аккредитованный судья международных beauty-чемпионатов, Eleonora утвердилась одновременно как практик и как человек, задающий стандарт внутри глобального профессионального сообщества. Её экспертиза выходит за пределы практики и распространяется на образование, где она ведёт базовые и продвинутые программы обучения, формируя следующее поколение специалистов.",
            "Она является сооснователем TE’ORA Beauty — компании, которая поставляет профессиональные продукты для специалистов по макияжу, brow-design и lash-сервисам. Кроме того, Eleonora — основатель и директор TE’ORA Beauty Shop, бренда профессиональных материалов, а также организатор международного чемпионата TB Champions, что дополнительно подтверждает её вклад в развитие и признание отраслевых стандартов.",
            "В International Beauty Professionals Association Eleonora Bediukh занимает позицию Члена совета директоров, отвечающего за отбор участников и контроль качества — роль, напрямую влияющую на уровень, доверие и профессиональную целостность организации.",
            "Она отвечает за оценку кандидатов, поддержание строгих стандартов отбора и за то, чтобы каждый участник соответствовал качеству и экспертизе, которые совпадают с видением ассоциации.",
            "Eleonora Bediukh олицетворяет авторитет, структуру и высокий профессиональный уровень. Её роль — не только отбирать, но и удерживать и определять тот стандарт, который формирует ассоциацию.",
          ]
        : isUk
          ? [
              "Eleonora Bediukh — internationally recognized brow-artist, lamimaker, викладачка та галузева експертка, чия робота відображає високий рівень точності, структури й професійного авторитету.",
              "Як багаторазова призерка та акредитована суддя міжнародних beauty-чемпіонатів, Eleonora утвердилася одночасно як практикиня й як людина, що задає стандарт усередині глобальної професійної спільноти. Її експертиза виходить за межі практики та поширюється на освіту, де вона веде базові й просунуті програми навчання, формуючи наступне покоління фахівців.",
              "Вона є співзасновницею TE’ORA Beauty — компанії, що постачає професійні продукти для фахівців з макіяжу, brow-design і lash-сервісів. Крім того, Eleonora — засновниця й директорка TE’ORA Beauty Shop, бренду професійних матеріалів, а також організаторка міжнародного чемпіонату TB Champions, що додатково підтверджує її внесок у розвиток і визнання галузевих стандартів.",
              "У International Beauty Professionals Association Eleonora Bediukh займає позицію Члена ради директорів, відповідального за відбір учасників і контроль якості — роль, що безпосередньо впливає на рівень, довіру та професійну цілісність організації.",
              "Вона відповідає за оцінку кандидатів, підтримання суворих стандартів відбору та за те, щоб кожен учасник відповідав якості й експертизі, які збігаються з баченням асоціації.",
              "Eleonora Bediukh уособлює авторитет, структуру та високий професійний рівень. Її роль — не лише відбирати, а й утримувати та визначати той стандарт, який формує асоціацію.",
            ]
        : [
            "Eleonora Bediukh is an internationally recognized brow artist, lamimaker, educator, and industry expert whose work reflects a high level of precision, structure, and professional authority.",
            "As a multiple award-winning specialist and accredited judge of international beauty championships, Eleonora has established herself as both a practitioner and a standard-setter within the global beauty community. Her expertise extends beyond practice into education, where she leads foundational and advanced training programs, shaping the next generation of professionals.",
            "She is the co-founder of TE’ORA Beauty, a company focused on supplying professional products for beauty specialists across makeup, brow design, and lash services. In addition, Eleonora is the founder and director of TE’ORA Beauty Shop, a brand dedicated to professional materials, and the organizer of the international championship TB Champions, further contributing to the development and recognition of industry standards.",
            "Within the International Beauty Professionals Association, Eleonora Bediukh serves as Board Member responsible for Membership Selection and Quality Control — a role that directly influences the level, credibility, and professional integrity of the organization.",
            "She is responsible for evaluating candidates, maintaining strict selection standards, and ensuring that each member reflects the quality and expertise aligned with the Association’s vision.",
            "Eleonora Bediukh represents authority, structure, and a high professional standard. Her role is not only to select, but to uphold and define the standard that shapes the Association.",
          ],
      responsibilities: isRu
        ? [
            "курирует процесс отбора и утверждения новых участников",
            "поддерживает и повышает профессиональные стандарты внутри ассоциации",
            "оценивает квалификацию, опыт и достижения кандидатов",
            "участвует в разработке ясных и структурированных критериев отбора",
            "защищает репутацию ассоциации через последовательный контроль качества",
          ]
        : isUk
          ? [
              "курує процес відбору й затвердження нових учасників",
              "підтримує та підвищує професійні стандарти всередині асоціації",
              "оцінює кваліфікацію, досвід і досягнення кандидатів",
              "бере участь у розробці чітких і структурованих критеріїв відбору",
              "захищає репутацію асоціації через послідовний контроль якості",
            ]
        : [
            "overseeing the selection and approval process of new members",
            "maintaining and elevating professional standards within the Association",
            "assessing qualifications, experience, and achievements of applicants",
            "contributing to the development of clear and structured membership criteria",
            "safeguarding the reputation of the Association through consistent quality control",
          ],
    },
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-[#B9D9EB] selection:text-black">
      <section className="relative flex h-[calc(60vh+70px)] items-center justify-center overflow-hidden bg-[#F1F3F5]">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="/home/website-5.webp"
            className="h-full w-full object-cover object-top md:object-[center_28%]"
            alt={isRu ? "Управление IBPA" : isUk ? "Управління IBPA" : "Governance"}
          />
        </div>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 text-left text-slate-900">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-6xl sm:text-7xl md:text-9xl uppercase leading-[0.92] text-[#B9D9EB] ${headlineClassName}`}
          >
            {isRu ? "Управление" : isUk ? "Управління" : "Governance"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-2 max-w-3xl text-3xl lowercase text-slate-400 md:-mt-6 md:text-5xl ${homeTemplateAccent.className}`}
          >
            {isRu ? "структура управления" : isUk ? "структура управління" : "governance structure"}
          </motion.p>
        </div>
      </section>

      <section className="bg-[#F8FBFD] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeInUp} className="mb-16 max-w-3xl space-y-6">
            <p className={`text-[10px] uppercase text-[#72A0C1] ${uiClassName}`}>
              {isRu ? "Состав директоров" : isUk ? "Склад директорів" : "Board Members"}
            </p>
            <h2 className={`text-4xl uppercase leading-[0.94] text-slate-900 md:text-[4.85rem] ${headlineClassName}`}>
              {isRu ? "Люди, которые формируют IBPA" : isUk ? "Люди, які формують IBPA" : "The People Shaping IBPA"}
            </h2>
            <p className={`text-lg leading-relaxed text-slate-600 md:text-[1.12rem] ${bodyClassName}`}>
              {isRu
                ? "Ниже представлен состав директоров ассоциации. В общем виде карточка показывает имя и должность, а по нажатию раскрывает полную информацию о человеке и его зоне ответственности."
                : isUk
                  ? "Нижче представлено склад директорів асоціації. У загальному вигляді картка показує ім’я та посаду, а після натискання відкриває повну інформацію про людину та її зону відповідальності."
                : "Below is the board structure of the Association. Each card shows the name and role at a glance, and opens to reveal the full profile and area of responsibility."}
            </p>
          </motion.div>

          <div className="grid justify-items-center gap-8 md:grid-cols-2 lg:grid-cols-3">
            {boardMembers.map((member, idx) => {
              const isOpen = expandedMember === member.id;

              return (
                <motion.article
                  key={member.id}
                  {...fadeInUp}
                  transition={{ delay: idx * 0.06 }}
                  className="w-full md:max-w-[360px] [perspective:1800px]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedMember(isOpen ? null : member.id)}
                    className="block w-full text-left"
                    aria-expanded={isOpen}
                    aria-label={isRu ? `Открыть информацию о ${member.name}` : isUk ? `Відкрити інформацію про ${member.name}` : `Open details for ${member.name}`}
                  >
                    <div
                      className={`relative h-[460px] sm:h-[520px] lg:h-[540px] rounded-[32px] md:rounded-[40px] transition-transform duration-700 [transform-style:preserve-3d] ${
                        isOpen ? "[transform:rotateY(180deg)]" : ""
                      }`}
                    >
                      <div className="absolute inset-0 overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_18px_55px_rgba(39,54,72,0.08)] [backface-visibility:hidden] md:rounded-[40px]">
                        <ImageWithFallback
                          src={member.image}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                        <div className="absolute right-4 top-4 rounded-full border border-white/30 bg-white/10 p-2.5 text-white backdrop-blur-md md:right-5 md:top-5 md:p-3">
                          <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white md:p-6">
                          <p className={`text-[10px] uppercase text-white/70 ${uiClassName}`}>
                            {member.role}
                          </p>
                          <h3 className={`mt-3 text-2xl uppercase leading-[0.95] md:text-3xl ${headlineClassName}`}>
                            {member.name}
                          </h3>
                          <p className={`mt-3 max-w-xs text-xs leading-relaxed text-white/80 md:text-sm ${bodyClassName}`}>
                            {member.title}
                          </p>
                        </div>
                      </div>

                      <div className="absolute inset-0 rounded-[32px] border border-[#B9D9EB]/50 bg-[#F8FBFD] p-5 shadow-[0_28px_70px_rgba(39,54,72,0.14)] [backface-visibility:hidden] [transform:rotateY(180deg)] md:rounded-[40px] md:p-7">
                        <div className="flex h-full flex-col">
                          <div className="flex items-start justify-between gap-4 border-b border-[#B9D9EB]/30 pb-5">
                            <div>
                              <p className={`text-[10px] uppercase text-[#72A0C1] ${uiClassName}`}>
                                {member.role}
                              </p>
                              <h3 className={`mt-3 text-2xl uppercase leading-[0.95] text-slate-900 md:text-3xl ${headlineClassName}`}>
                                {member.name}
                              </h3>
                            </div>
                            <div className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 md:p-3">
                              <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                            </div>
                          </div>

                          <div className={`mt-4 flex-1 space-y-4 overflow-y-auto pr-1 text-xs leading-relaxed text-slate-600 md:mt-5 md:space-y-5 md:pr-2 md:text-sm ${bodyClassName}`}>
                            {member.paragraphs.map((paragraph) => (
                              <p key={paragraph}>{paragraph}</p>
                            ))}

                            {member.responsibilities ? (
                              <div className="rounded-[20px] bg-white p-4 shadow-[0_12px_34px_rgba(39,54,72,0.05)] md:rounded-[24px] md:p-5">
                                <p className={`text-[10px] uppercase text-[#72A0C1] ${uiClassName}`}>
                                  {isRu ? "Зона ответственности" : isUk ? "Зона відповідальності" : "Key Responsibilities"}
                                </p>
                                <ul className="mt-4 space-y-3">
                                  {member.responsibilities.map((item) => (
                                    <li key={item} className="flex gap-3 text-xs leading-relaxed text-slate-600 md:text-sm">
                                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#72A0C1]" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-16">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              {...fadeInUp}
              className="flex flex-col gap-12 border-b border-[#B9D9EB]/20 pb-16 last:border-0 md:flex-row"
            >
              <div className="md:w-1/3">
                <div className="flex items-center gap-4 mb-6">
                  <div className="rounded-2xl bg-[#F1F3F5] p-4 text-[#72A0C1]">{section.icon}</div>
                  <h2 className={`text-4xl uppercase leading-[0.94] text-slate-900 ${headlineClassName}`}>{section.title}</h2>
                </div>
              </div>
              <div className="md:w-2/3 space-y-6">
                <p className={`text-xl leading-relaxed text-slate-600 md:text-[1.35rem] ${bodyClassName}`}>{section.content}</p>
                {"functions" in section && section.functions ? (
                  <ul className="space-y-3">
                    {section.functions.map((func, fIdx) => (
                      <li key={fIdx} className={`flex items-start gap-4 text-gray-600 ${bodyClassName}`}>
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#B9D9EB] flex-shrink-0" />
                        <span>{func}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {"footer" in section && section.footer ? (
                  <p className={`border-t border-[#B9D9EB]/10 pt-4 text-sm uppercase text-black ${uiClassName}`}>
                    {section.footer}
                  </p>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-[#F1F3F5] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeInUp} className="mb-16">
            <h2 className={`mb-6 text-4xl uppercase leading-[0.94] text-slate-900 md:text-[4.85rem] ${headlineClassName}`}>
              {isRu ? "Комитеты" : isUk ? "Комітети" : "Committees"}
            </h2>
            <p className={`max-w-2xl text-xl leading-relaxed text-slate-600 md:text-[1.2rem] ${bodyClassName}`}>
              {isRu
                ? "Для эффективной работы ассоциации могут создаваться профильные комитеты."
                : isUk
                  ? "Для ефективної роботи асоціації можуть створюватися профільні комітети."
                : "Specialized committees may be established to support the effective operation of the association."}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {committees.map((committee, idx) => (
              <motion.div
                key={idx}
                {...fadeInUp}
                transition={{ delay: idx * 0.1 }}
                className="rounded-[40px] bg-white p-10 shadow-[0_18px_55px_rgba(39,54,72,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(39,54,72,0.12)]"
              >
                <h3 className={`mb-4 text-2xl uppercase leading-[0.96] text-slate-900 ${headlineClassName}`}>{committee.title}</h3>
                <p className={`leading-relaxed text-slate-600 ${bodyClassName}`}>{committee.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-[48px] bg-[#F1F3F5] p-10 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:flex-row md:items-center md:justify-between md:p-14">
          <div className="max-w-2xl space-y-4">
            <p className={`text-[10px] uppercase text-[#72A0C1] ${uiClassName}`}>
              {isRu ? "Прозрачность" : isUk ? "Прозорість" : "Transparency"}
            </p>
            <h2 className={`text-4xl uppercase leading-[0.94] text-slate-900 md:text-[4.2rem] ${headlineClassName}`}>
              {isRu ? "Хотите подать заявку с прозрачным процессом рассмотрения?" : isUk ? "Хочете подати заявку з прозорим процесом розгляду?" : "Want To Apply With A Clear Review Process?"}
            </h2>
            <p className={`text-lg leading-relaxed text-slate-600 md:text-[1.12rem] ${bodyClassName}`}>
              {isRu
                ? "Изучите тарифы и пакеты и перейдите к понятному сценарию подачи заявки, который рассматривает комиссия по отбору."
                : isUk
                  ? "Ознайомтеся з тарифами та пакетами й перейдіть до зрозумілого сценарію подання заявки, який розглядає комісія з відбору."
                : "Explore membership options and move into the guided application flow reviewed by the Membership Review Board."}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/membership#packages" className={`rounded-full bg-black px-8 py-4 text-center text-sm uppercase text-white ${uiClassName}`}>
              {isRu ? "Смотреть тарифы" : isUk ? "Переглянути тарифи" : "Explore Membership"}
            </Link>
            <Link href="/apply" className={`rounded-full border border-slate-300 bg-white px-8 py-4 text-center text-sm uppercase text-slate-900 ${uiClassName}`}>
              {isRu ? "Начать заявку" : isUk ? "Почати заявку" : "Start Application"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
