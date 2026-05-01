import "dotenv/config";
import crypto from "crypto";
import { eq, inArray } from "drizzle-orm";
import { requireDb, orders, certificates } from "../src/lib/db";

type DemoOrderSeed = {
  email: string;
  name: string;
  membershipCategory: string;
  applicantType: string;
  status: "pending" | "approved" | "paid";
  stripeSessionId?: string | null;
  certNumber?: string;
  applicationPayload: Record<string, unknown>;
};

const demoOrders: DemoOrderSeed[] = [
  {
    email: "demo.pending.specialist@ibpa.test",
    name: "Sofia Bennett",
    membershipCategory: "Specialist",
    applicantType: "Individual",
    status: "pending",
    applicationPayload: {
      firstName: "Sofia",
      lastName: "Bennett",
      email: "demo.pending.specialist@ibpa.test",
      phone: "+1 (916) 555-0101",
      citizenship: "United States",
      country: "United States",
      city: "Roseville",
      yearsExperience: "1 year",
      specialization: ["Brow Artist", "Esthetician"],
      educationDesc: "Beauty specialist focused on esthetics and brow artistry.",
      studentSchool: "California Beauty Academy",
      studentProgName: "Advanced Esthetics Program",
      studentEndDate: "2026-08-30",
      studentMotivation: "Looking to build a professional network and enter the industry with strong standards.",
      instagramLink: "https://instagram.com/sofia.ibpa.demo",
      whyJoin: "I want to learn from professionals and become part of a serious beauty community.",
      contributionDesc: "I can support future events and specialist initiatives.",
      legalName: "Sofia Bennett",
      signature: "Sofia Bennett",
    },
  },
  {
    email: "demo.pending.trainer@ibpa.test",
    name: "Marcus Lee",
    membershipCategory: "Trainer",
    applicantType: "School",
    status: "pending",
    applicationPayload: {
      firstName: "Marcus",
      lastName: "Lee",
      email: "demo.pending.trainer@ibpa.test",
      phone: "+1 (916) 555-0102",
      citizenship: "Canada",
      country: "United States",
      city: "Sacramento",
      yearsExperience: "8 years",
      specialization: ["Hair Professional", "Educator"],
      professionalDesc: "Trainer specializing in salon systems, advanced color, and educator development.",
      educatorRole: "Lead Educator",
      educatorSubjects: "Hair color, salon workflow, educator mentorship",
      educatorYears: "5 years",
      educatorFormat: "Both",
      studentCount: "250+",
      trainerEducationPlanFiles: ["https://example.com/demo/marcus-education-plan.pdf"],
      trainerCertificateFiles: ["https://example.com/demo/marcus-certificate.pdf"],
      trainerExperienceProofFiles: [
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200",
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200",
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200",
      ],
      instagramLink: "https://instagram.com/marcus.ibpa.demo",
      websiteLink: "https://marcus-edu.demo",
      whyJoin: "To collaborate with other educators and contribute to industry standards.",
      contributionDesc: "I can contribute educational sessions and judging support.",
      legalName: "Marcus Lee",
      signature: "Marcus Lee",
    },
  },
  {
    email: "demo.approved.professional@ibpa.test",
    name: "Olivia Carter",
    membershipCategory: "Professional",
    applicantType: "Individual",
    status: "approved",
    stripeSessionId: "https://checkout.stripe.com/c/pay/demo-approved-professional",
    certNumber: "CERT-DEMO-APPROVED-001",
    applicationPayload: {
      firstName: "Olivia",
      lastName: "Carter",
      email: "demo.approved.professional@ibpa.test",
      phone: "+1 (916) 555-0103",
      citizenship: "United Kingdom",
      country: "United States",
      city: "San Francisco",
      yearsExperience: "6 years",
      professionalDesc: "PMU specialist with a focus on natural enhancement and corrective work.",
      workingJurisdictions: "California, Nevada",
      specialization: ["PMU Artist", "Educator"],
      instagramLink: "https://instagram.com/olivia.ibpa.demo",
      portfolioLink: "https://portfolio.demo/olivia",
      whyJoin: "To strengthen cross-market visibility and access high-level professional recognition.",
      contributionDesc: "I can mentor newer specialists and contribute to review panels.",
      legalName: "Olivia Carter",
      signature: "Olivia Carter",
    },
  },
  {
    email: "demo.paid.business@ibpa.test",
    name: "Emma Rodriguez",
    membershipCategory: "Business",
    applicantType: "Business",
    status: "paid",
    stripeSessionId: "cs_demo_paid_business",
    certNumber: "CERT-DEMO-PAID-101",
    applicationPayload: {
      firstName: "Emma",
      lastName: "Rodriguez",
      email: "demo.paid.business@ibpa.test",
      phone: "+1 (916) 555-0104",
      citizenship: "United States",
      country: "United States",
      city: "Roseville",
      yearsExperience: "10 years",
      bizName: "Rose Atelier Studio",
      bizType: "Salon",
      bizYear: "2018",
      bizTeamSize: "12",
      bizServices: "Hair, brows, esthetics, makeup",
      instagramLink: "https://instagram.com/roseatelier.demo",
      websiteLink: "https://roseatelier.demo",
      whyJoin: "To position the business within a trusted international professional association.",
      contributionDesc: "I can host events and support business-focused collaborations.",
      legalName: "Emma Rodriguez",
      signature: "Emma Rodriguez",
    },
  },
  {
    email: "demo.paid.brand@ibpa.test",
    name: "Noah Kim",
    membershipCategory: "Brand",
    applicantType: "Brand",
    status: "paid",
    stripeSessionId: "cs_demo_paid_brand",
    certNumber: "CERT-DEMO-PAID-202",
    applicationPayload: {
      firstName: "Noah",
      lastName: "Kim",
      email: "demo.paid.brand@ibpa.test",
      phone: "+1 (916) 555-0105",
      citizenship: "South Korea",
      country: "United States",
      city: "Los Angeles",
      yearsExperience: "7 years",
      brandName: "Luma Skin Lab",
      brandYear: "2021",
      brandMarket: "USA / International e-commerce",
      brandType: "Professional skincare",
      instagramLink: "https://instagram.com/lumaskinlab.demo",
      websiteLink: "https://lumaskinlab.demo",
      whyJoin: "To build industry partnerships and credibility in the professional market.",
      contributionDesc: "I can support sponsorships, product education, and partner activations.",
      legalName: "Noah Kim",
      signature: "Noah Kim",
    },
  },
];

async function seed() {
  const db = requireDb();
  const demoEmails = demoOrders.map((order) => order.email);

  const existingOrders = await db
    .select({ id: orders.id, email: orders.email })
    .from(orders)
    .where(inArray(orders.email, demoEmails));

  if (existingOrders.length > 0) {
    const existingOrderIds = existingOrders.map((order: { id: string }) => order.id);
    await db.delete(certificates).where(inArray(certificates.orderId, existingOrderIds));
    await db.delete(orders).where(inArray(orders.id, existingOrderIds));
    console.log(`Removed ${existingOrders.length} existing demo orders.`);
  }

  for (const demoOrder of demoOrders) {
    const secureToken = crypto.randomUUID();

    const [insertedOrder] = await db
      .insert(orders)
      .values({
        email: demoOrder.email,
        name: demoOrder.name,
        membershipCategory: demoOrder.membershipCategory,
        applicantType: demoOrder.applicantType,
        applicationPayload: demoOrder.applicationPayload,
        status: demoOrder.status,
        stripeSessionId: demoOrder.stripeSessionId ?? null,
        secureToken,
        package: demoOrder.membershipCategory,
      })
      .returning();

    if (demoOrder.certNumber) {
      await db.insert(certificates).values({
        orderId: insertedOrder.id,
        certNumber: demoOrder.certNumber,
      });
    }
  }

  console.log(`Seeded ${demoOrders.length} demo records for admin review.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
