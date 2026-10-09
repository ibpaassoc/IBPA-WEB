import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, CalendarDays, Handshake, Users } from "lucide-react";

import { JsonLd } from "@/components/seo/JsonLd";
import { homeTemplateDisplay } from "@/lib/home-template-fonts";
import { articleJsonLd } from "@/lib/seo/json-ld";
import { PAGE_SEO } from "@/lib/seo/pages";
import { BEAUTY_ASSOCIATION_PUBLISHED, BEAUTY_ASSOCIATION_UPDATED } from "@/lib/seo/routes";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/site";
import { membershipConfigs, type MembershipCategory } from "@/lib/membership";

// English-only by design: this page targets English-language search queries.
// Membership names, prices, and application steps mirror /membership, /criteria,
// /faq, and /about, and must be updated together with them.

const H1_TEXT = "Professional Beauty Association: What It Is and Who Should Join";

const memberBenefits = [
  {
    icon: BadgeCheck,
    title: "Professional standards and ethics",
    body: "A published code of ethics and clear standards show clients, employers, and peers how members are expected to work.",
  },
  {
    icon: BookOpen,
    title: "Education and professional development",
    body: "Webinars, learning libraries, and educator-led programs help members keep their skills current between licenses and certifications.",
  },
  {
    icon: Users,
    title: "Community and networking",
    body: "Member directories and professional communities connect peers, mentors, employers, and partners across regions.",
  },
  {
    icon: Handshake,
    title: "Recognition and credibility",
    body: "Membership status, a member certificate, and a directory listing let professionals show where they stand in the industry.",
  },
  {
    icon: CalendarDays,
    title: "Events and competitions",
    body: "Forums, workshops, and championships give professionals a stage to learn, compete, and be seen.",
  },
];

const selectionChecklist = [
  {
    title: "Match your role.",
    body: "Look for membership categories written for what you actually do (practitioner, educator, salon owner, or brand) rather than a single tier for everyone.",
  },
  {
    title: "Read the governing documents.",
    body: "Bylaws, a code of ethics, and a membership agreement should be public. IBPA publishes its bylaws, code of ethics, membership policy and agreement, and governance policies on its standards page.",
  },
  {
    title: "See who leads it.",
    body: "A named board with defined responsibilities signals accountability. IBPA lists its board of directors and officers on its governance page.",
  },
  {
    title: "Confirm its legal status.",
    body: "Check where the association is registered and whether it is a nonprofit. IBPA is registered in the State of California, USA.",
  },
  {
    title: "Understand the process and the cost.",
    body: "Know the annual fee, what each category includes, and when payment is due. At IBPA, payment is requested only after an application is approved.",
  },
  {
    title: "Know what it is not.",
    body: "No association replaces a state license. IBPA is not a government licensing body, does not issue licenses, and does not replace state boards.",
  },
];

type RoleGroup = {
  heading: string;
  category: MembershipCategory;
  categoryLabel: string;
  body: string;
};

const roleGroups: RoleGroup[] = [
  {
    heading: "Estheticians, cosmetologists, lash and brow artists, and other practitioners",
    category: "Professional",
    categoryLabel: "Professional",
    body: "Practicing beauty specialists apply as Professional members: brow artists, lash artists, makeup artists, cosmetologists, estheticians, PMU artists, nail professionals, and hair professionals. Membership includes official Professional Member status, an expanded learning library, a Member Directory listing, and a digital certificate.",
  },
  {
    heading: "Salon owners and studio owners",
    category: "Business",
    categoryLabel: "Business Owner",
    body: "Owners of salons, studios, and other beauty businesses apply as Business Owner members. The owner account includes five team educational seats, with additional seats available. Team access is limited to education and is not full membership.",
  },
  {
    heading: "Educators, trainers, schools, and academies",
    category: "Trainer",
    categoryLabel: "Trainer / Educator",
    body: "Everything in Professional membership, plus access to educator-focused initiatives, the chance to apply as a speaker or expert, and a broader presentation in the member directory.",
  },
  {
    heading: "Students and early-career specialists",
    category: "Specialist",
    categoryLabel: "Specialist",
    body: "For specialists who are currently training and starting their professional path, with core educational materials, selected webinars, and open events.",
  },
  {
    heading: "Beauty brands, distributors, and suppliers",
    category: "Brand",
    categoryLabel: "Brand Member",
    body: "A verified professional standing for brands that want to be part of the professional beauty community. Brand Membership is not sponsorship or advertising; marketing visibility is offered separately through sponsorship packages.",
  },
];

const joiningSteps = [
  { title: "Choose your category", body: "Pick the membership category that matches your role in the industry." },
  { title: "Submit your application", body: "Complete the application that matches your professional profile." },
  {
    title: "Membership Review Board review",
    body: "The board reviews experience, training, achievements, and reputation, then approves, requests more information, postpones, or declines.",
  },
  {
    title: "Pay and activate after approval",
    body: "Payment instructions arrive by email after approval. Once paid, you activate your member dashboard.",
  },
];

const faqs = [
  {
    question: "What is a beauty association?",
    answer:
      "A beauty association is a membership organization for people and businesses in the beauty industry. Members join for professional standards, education, community, recognition, and events. What each association offers differs, so compare categories, costs, and governance before you join.",
  },
  {
    question: "Does joining IBPA replace my state license?",
    answer:
      "No. IBPA is not a government licensing body and does not replace state boards. It does not issue licenses and does not guarantee visas. The association provides professional standards and support.",
  },
  {
    question: "Who can join IBPA?",
    answer:
      "Applications are open to specialists, practicing beauty professionals, educators and trainers, beauty business owners, and brands or companies working in the industry. Each category has its own application flow, and every application is reviewed before approval.",
  },
  {
    question: "How much does IBPA membership cost?",
    answer:
      "Annual fees depend on the category and range from $49 for Specialist to $1,299 for Brand Member. See the membership page for what each category includes.",
  },
  {
    question: "Do I pay when I apply?",
    answer:
      "No. Applications are reviewed first, and payment happens only after approval.",
  },
  {
    question: "Is IBPA a nonprofit?",
    answer:
      "IBPA describes itself as a professional nonprofit organization, and the association is legally registered in the State of California, USA.",
  },
];

export default function BeautyAssociationPage() {
  const headlineClassName = `${homeTemplateDisplay.className} font-black tracking-[-0.05em]`;
  const bodyClassName = "font-sans font-medium tracking-[-0.01em]";
  const uiClassName = "font-sans font-semibold tracking-[0.08em]";
  const pricesById = new Map(membershipConfigs.map((config) => [config.id, config.price]));

  return (
    <div className="min-h-screen bg-white selection:bg-[#B9D9EB] selection:text-black">
      <JsonLd
        data={articleJsonLd({
          headline: H1_TEXT,
          description: PAGE_SEO.beautyAssociation.description,
          path: PAGE_SEO.beautyAssociation.path,
          datePublished: BEAUTY_ASSOCIATION_PUBLISHED,
          dateModified: BEAUTY_ASSOCIATION_UPDATED,
          imagePath: DEFAULT_OG_IMAGE.url,
        })}
      />

      <section className="bg-[#F1F3F5] px-6 pb-20 pt-36 md:pb-28 md:pt-44">
        <div className="mx-auto max-w-5xl space-y-8">
          <p className={`text-[10px] uppercase tracking-[0.5em] text-[#708090] md:text-xs ${uiClassName}`}>
            Beauty association guide
          </p>
          <h1 className={`text-[2.4rem] uppercase leading-[0.96] text-slate-900 md:text-[4.2rem] ${headlineClassName}`}>
            {H1_TEXT}
          </h1>
          <p className={`max-w-3xl text-[1.1rem] leading-relaxed text-slate-700 md:text-[1.3rem] ${bodyClassName}`}>
            A beauty association is a membership organization where beauty professionals gather around shared
            standards, continuing education, community, and recognition. This guide explains what members usually
            get, how to evaluate any association, and how the International Beauty Professionals Association (IBPA)
            is set up for estheticians, cosmetologists, lash and brow artists, educators, salon owners, and brands.
          </p>
          <p className={`text-sm text-slate-500 ${bodyClassName}`}>
            Published by IBPA. Last updated{" "}
            <time dateTime={BEAUTY_ASSOCIATION_UPDATED}>October 9, 2026</time>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="space-y-4">
          <h2 className={`text-3xl uppercase leading-[0.96] text-slate-900 md:text-[3.2rem] ${headlineClassName}`}>
            What a beauty association does for its members
          </h2>
          <p className={`max-w-3xl text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
            Professional beauty associations typically offer some mix of these five kinds of value. Some also lobby on
            licensing law or offer group insurance, and those services vary between organizations.
          </p>
        </div>
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {memberBenefits.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="flex gap-5 rounded-[36px] bg-[#F8FBFD] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)]"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#72A0C1]">
                <Icon size={24} aria-hidden="true" />
              </span>
              <div className="space-y-2">
                <h3 className={`text-xl uppercase leading-[1.02] text-slate-900 ${headlineClassName}`}>{title}</h3>
                <p className={`text-base leading-relaxed text-slate-600 ${bodyClassName}`}>{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-[#F1F3F5] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className={`text-3xl uppercase leading-[0.96] text-slate-900 md:text-[3.2rem] ${headlineClassName}`}>
            How to choose a beauty association
          </h2>
          <p className={`mt-4 max-w-3xl text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
            Whichever association you are considering, these six checks help you judge whether it is a credible
            professional body.
          </p>
          <ol className="mt-12 space-y-6">
            {selectionChecklist.map((item, index) => (
              <li key={item.title} className="grid gap-4 rounded-[32px] bg-white p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:grid-cols-[72px_1fr]">
                <span className={`text-4xl text-[#B9D9EB] ${headlineClassName}`} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className={`text-base leading-relaxed text-slate-600 md:text-[1.05rem] ${bodyClassName}`}>
                  <strong className="font-semibold text-slate-900">{item.title}</strong> {item.body}
                </p>
              </li>
            ))}
          </ol>
          <p className={`mt-8 text-base text-slate-600 ${bodyClassName}`}>
            Read IBPA&rsquo;s{" "}
            <Link href="/standards" className="underline decoration-[#72A0C1] decoration-2 underline-offset-4 hover:text-[#72A0C1]">
              standards and policies
            </Link>
            ,{" "}
            <Link href="/governance" className="underline decoration-[#72A0C1] decoration-2 underline-offset-4 hover:text-[#72A0C1]">
              board and governance
            </Link>
            , and{" "}
            <Link href="/criteria" className="underline decoration-[#72A0C1] decoration-2 underline-offset-4 hover:text-[#72A0C1]">
              membership criteria
            </Link>{" "}
            before you apply.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="space-y-4">
          <h2 className={`text-3xl uppercase leading-[0.96] text-slate-900 md:text-[3.2rem] ${headlineClassName}`}>
            IBPA membership by profession
          </h2>
          <p className={`max-w-3xl text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
            IBPA is an international beauty association organized around professional role. Every application is
            reviewed by the Membership Review Board before payment.
          </p>
        </div>
        <div className="mt-12 space-y-6">
          {roleGroups.map((group) => (
            <article
              key={group.heading}
              className="grid gap-6 rounded-[36px] bg-[#F8FBFD] p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)] md:grid-cols-[1fr_auto] md:items-center md:p-10"
            >
              <div className="space-y-3">
                <h3 className={`text-2xl uppercase leading-[1.02] text-slate-900 ${headlineClassName}`}>{group.heading}</h3>
                <p className={`text-base leading-relaxed text-slate-600 ${bodyClassName}`}>{group.body}</p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <p className={`text-sm uppercase text-[#72A0C1] ${uiClassName}`}>
                  {group.categoryLabel} &middot; {pricesById.get(group.category)}/year
                </p>
                <Link
                  href={`/apply?category=${group.category}`}
                  className={`inline-flex items-center justify-center gap-3 rounded-full bg-black px-7 py-3 text-xs uppercase tracking-[0.1em] text-white transition-transform duration-500 hover:scale-[1.03] ${uiClassName}`}
                >
                  Apply as {group.categoryLabel} <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className={`mt-8 text-base text-slate-600 ${bodyClassName}`}>
          Compare what each category includes on the{" "}
          <Link href="/membership" className="underline decoration-[#72A0C1] decoration-2 underline-offset-4 hover:text-[#72A0C1]">
            beauty association membership page
          </Link>
          . Brands that want marketing visibility rather than membership can review{" "}
          <Link href="/partnership" className="underline decoration-[#72A0C1] decoration-2 underline-offset-4 hover:text-[#72A0C1]">
            sponsorship packages
          </Link>
          .
        </p>
      </section>

      <section className="bg-[#F1F3F5] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className={`text-3xl uppercase leading-[0.96] text-slate-900 md:text-[3.2rem] ${headlineClassName}`}>
            How joining IBPA works
          </h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-2">
            {joiningSteps.map((step, index) => (
              <li key={step.title} className="rounded-[32px] bg-white p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)]">
                <p className={`text-4xl text-[#B9D9EB] ${headlineClassName}`} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className={`mt-3 text-xl uppercase leading-[1.02] text-slate-900 ${headlineClassName}`}>{step.title}</h3>
                <p className={`mt-3 text-base leading-relaxed text-slate-600 ${bodyClassName}`}>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <h2 className={`text-3xl uppercase leading-[0.96] text-slate-900 md:text-[3.2rem] ${headlineClassName}`}>
          About IBPA
        </h2>
        <div className={`mt-6 max-w-3xl space-y-5 text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
          <p>
            The International Beauty Professionals Association is a professional nonprofit organization dedicated
            to supporting excellence in the beauty industry. It is open to members from different countries and
            regions, is registered in the State of California, USA, and is forming its founding international
            community.
          </p>
          <p>
            The association is led by President Iuliia Andreeva and a board of directors and officers. Read{" "}
            <Link href="/about" className="underline decoration-[#72A0C1] decoration-2 underline-offset-4 hover:text-[#72A0C1]">
              about IBPA
            </Link>{" "}
            or browse the{" "}
            <Link href="/members" className="underline decoration-[#72A0C1] decoration-2 underline-offset-4 hover:text-[#72A0C1]">
              members directory
            </Link>
            . IBPA also lists professional{" "}
            <Link href="/events" className="underline decoration-[#72A0C1] decoration-2 underline-offset-4 hover:text-[#72A0C1]">
              events and championships
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-[#F1F3F5] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className={`text-3xl uppercase leading-[0.96] text-slate-900 md:text-[3.2rem] ${headlineClassName}`}>
            Beauty association questions
          </h2>
          <div className="mt-12 space-y-6">
            {faqs.map((item) => (
              <div key={item.question} className="rounded-[32px] bg-white p-8 shadow-[0_18px_55px_rgba(39,54,72,0.08)]">
                <h3 className={`text-xl uppercase leading-[1.02] text-slate-900 ${headlineClassName}`}>{item.question}</h3>
                <p className={`mt-3 text-base leading-relaxed text-slate-600 ${bodyClassName}`}>{item.answer}</p>
              </div>
            ))}
          </div>
          <p className={`mt-8 text-base text-slate-600 ${bodyClassName}`}>
            More answers about applications, payment, and certificates are in the{" "}
            <Link href="/faq" className="underline decoration-[#72A0C1] decoration-2 underline-offset-4 hover:text-[#72A0C1]">
              membership FAQ
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <h2 className={`text-3xl uppercase leading-[0.96] text-slate-900 md:text-[3.2rem] ${headlineClassName}`}>
            Ready to join a professional beauty association?
          </h2>
          <p className={`mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 ${bodyClassName}`}>
            Compare categories, then start the application that matches your role. Questions first? The IBPA team
            answers membership questions by email.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/membership"
              className={`inline-flex items-center justify-center gap-3 rounded-full bg-black px-9 py-4 text-xs uppercase tracking-[0.1em] text-white transition-transform duration-500 hover:scale-[1.03] ${uiClassName}`}
            >
              Compare membership <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className={`inline-flex items-center justify-center rounded-full border border-slate-300 px-9 py-4 text-xs uppercase tracking-[0.1em] text-slate-900 transition-colors hover:bg-[#F1F3F5] ${uiClassName}`}
            >
              Contact the team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
