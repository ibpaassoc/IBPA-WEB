import type {
  SourceApplicationFileRecord,
  SourceCertificateRecord,
  SourceOrderRecord,
  SourcePartnerApplicationRecord,
  SourceUserRecord,
} from "@/features/shared/server/source-records";
import { importSourceCertificate } from "@/features/certificates/server/certificate.service";
import { importSourceOrderMembership } from "@/features/memberships/server/membership.service";
import { importSourceOrderPayment, importSourcePartnerApplicationPayment } from "@/features/payments/server/payment.service";
import { syncCanonicalUserFromSourceOrder, syncCanonicalUserFromSourceUser } from "@/features/users/server/user.service";
import {
  deleteCanonicalApplicationAggregate,
  deleteCanonicalApplicationFilesExcept,
  findCanonicalApplicationByPaymentToken,
  setCanonicalApplicationFiles,
  updateCanonicalApplicationStatus,
  upsertCanonicalApplication,
  upsertCanonicalApplicationFile,
} from "./application.repository";
import type { CanonicalApplicationInput } from "./application.types";

function mapLegacyStatus(status: string | null | undefined): CanonicalApplicationInput["status"] {
  switch ((status || "").toLowerCase()) {
    case "review":
      return "UNDER_REVIEW";
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "paid":
      return "PAID";
    default:
      return "SUBMITTED";
  }
}

export function buildApplicationFromSourceOrder(params: {
  order: SourceOrderRecord;
  userId?: string | null;
  applicationFiles?: Array<Record<string, unknown>>;
}) {
  const type = (params.order.accountType || "").toLowerCase() === "partner" ? "PARTNER" : "MEMBER";

  return {
    id: params.order.id,
    userId: params.userId ?? null,
    type,
    packageName: params.order.package ?? params.order.membershipCategory ?? null,
    status: mapLegacyStatus(params.order.status),
    fullName: params.order.name,
    email: params.order.email,
    phone: params.order.phone ?? null,
    paymentLink: params.order.secureToken ? `/payment-link/${params.order.secureToken}` : null,
    applicationData:
      params.order.applicationPayload && typeof params.order.applicationPayload === "object" && !Array.isArray(params.order.applicationPayload)
        ? params.order.applicationPayload as Record<string, unknown>
        : {},
    applicationFiles: params.applicationFiles ?? [],
    approvedAt: params.order.status === "approved" || params.order.status === "paid" ? params.order.createdAt : null,
    createdAt: params.order.createdAt,
  } satisfies CanonicalApplicationInput;
}

export function buildApplicationFromPartnerApplication(params: {
  application: SourcePartnerApplicationRecord;
  userId?: string | null;
}) {
  return {
    id: params.application.id,
    userId: params.userId ?? null,
    type: "PARTNER",
    packageName: params.application.requestedTier ?? null,
    status:
      params.application.paymentStatus === "PAID"
        ? "PAID"
        : params.application.status === "APPROVED"
          ? "APPROVED"
          : params.application.status === "REJECTED"
            ? "REJECTED"
            : "SUBMITTED",
    fullName: params.application.name,
    email: params.application.email,
    phone: params.application.phone ?? null,
    paymentLink: params.application.stripeCheckoutSessionId ?? null,
    applicationData: {
      message: params.application.message,
      requestedTier: params.application.requestedTier,
      partnerOrderId: params.application.partnerOrderId,
      stripeInvoiceId: params.application.stripeInvoiceId,
      stripePaymentIntentId: params.application.stripePaymentIntentId,
    },
    applicationFiles: [],
    approvedAt: params.application.approvedAt ?? null,
    createdAt: params.application.createdAt,
  } satisfies CanonicalApplicationInput;
}

export async function importSourceOrderApplication(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  order: SourceOrderRecord;
  userId?: string | null;
  applicationFiles?: Array<Record<string, unknown>>;
}) {
  return upsertCanonicalApplication(db, buildApplicationFromSourceOrder(params));
}

export async function importSourcePartnerApplication(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  application: SourcePartnerApplicationRecord;
  userId?: string | null;
}) {
  return upsertCanonicalApplication(db, buildApplicationFromPartnerApplication(params));
}

function mapSourceAdditionalFile(file: SourceApplicationFileRecord) {
  return {
    id: file.id,
    fileName: file.fileName,
    fileUrl: file.fileUrl,
    fileKey: file.fileKey,
    fileType: file.fileType,
    createdAt: file.createdAt.toISOString(),
  } satisfies Record<string, unknown>;
}

export async function importSourceApplicationFilesSnapshot(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  applicationId: string;
  files: SourceApplicationFileRecord[];
  ownerUserId?: string | null;
}) {
  const payloadFiles = params.files.map(mapSourceAdditionalFile);

  for (const file of params.files) {
    await upsertCanonicalApplicationFile(db, {
      id: file.id,
      ownerUserId: params.ownerUserId ?? null,
      applicationId: params.applicationId,
      fileUrl: file.fileUrl,
      fileName: file.fileName,
    });
  }

  await deleteCanonicalApplicationFilesExcept(db, {
    applicationId: params.applicationId,
    keepIds: params.files.map((file) => file.id),
  });

  await setCanonicalApplicationFiles(db, {
    applicationId: params.applicationId,
    files: payloadFiles,
  });

  return payloadFiles;
}

export async function importSourceOrderAggregate(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  order: SourceOrderRecord;
  sourceUser?: SourceUserRecord | null;
  certificate?: SourceCertificateRecord | null;
  applicationFiles?: SourceApplicationFileRecord[];
}) {
  const userResult = params.sourceUser
    ? await syncCanonicalUserFromSourceUser(db, params.sourceUser)
    : await syncCanonicalUserFromSourceOrder(db, params.order);
  const canonicalUserId = userResult.record.id;

  const applicationResult = await importSourceOrderApplication(db, {
    order: params.order,
    userId: canonicalUserId,
    ...(params.applicationFiles ? { applicationFiles: params.applicationFiles.map(mapSourceAdditionalFile) } : {}),
  });

  await importSourceOrderPayment(db, {
    order: params.order,
    userId: canonicalUserId,
  });

  if (params.applicationFiles) {
    await importSourceApplicationFilesSnapshot(db, {
      applicationId: params.order.id,
      files: params.applicationFiles,
      ownerUserId: canonicalUserId,
    });
  }

  const membershipResult = await importSourceOrderMembership(db, {
    order: params.order,
    userId: canonicalUserId,
    certificate: params.certificate ?? null,
  });

  if (params.certificate && membershipResult?.record.id) {
    await importSourceCertificate(db, {
      certificate: params.certificate,
      membershipId: membershipResult.record.id,
    });
  }

  return {
    userId: canonicalUserId,
    application: applicationResult.record,
    membershipId: membershipResult?.record.id ?? null,
  };
}

export async function importSourcePartnerApplicationAggregate(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  application: SourcePartnerApplicationRecord;
  linkedOrder?: SourceOrderRecord | null;
  sourceUser?: SourceUserRecord | null;
}) {
  let canonicalUserId: string | null = null;

  if (params.sourceUser) {
    const userResult = await syncCanonicalUserFromSourceUser(db, params.sourceUser);
    canonicalUserId = userResult.record.id;
  } else if (params.linkedOrder) {
    const userResult = await syncCanonicalUserFromSourceOrder(db, params.linkedOrder);
    canonicalUserId = userResult.record.id;
  }

  const applicationResult = await importSourcePartnerApplication(db, {
    application: params.application,
    userId: canonicalUserId,
  });

  await importSourcePartnerApplicationPayment(db, {
    application: params.application,
    userId: canonicalUserId,
  });

  if (params.linkedOrder) {
    await importSourceOrderAggregate(db, {
      order: params.linkedOrder,
      sourceUser: params.sourceUser ?? null,
    });
  }

  return {
    userId: canonicalUserId,
    application: applicationResult.record,
  };
}

export async function markCanonicalApplicationStatus(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  applicationId: string;
  status: CanonicalApplicationInput["status"];
  paymentToken?: string | null;
  approvedAt?: Date | null;
}) {
  return updateCanonicalApplicationStatus(db, {
    id: params.applicationId,
    status: params.status,
    paymentLink: params.paymentToken ? `/payment-link/${params.paymentToken}` : undefined,
    approvedAt: params.approvedAt,
  });
}

export async function findApplicationByPaymentToken(db: ReturnType<typeof import("@/lib/db").requireDb>, token: string) {
  return findCanonicalApplicationByPaymentToken(db, token);
}

export async function removeCanonicalApplicationAggregate(db: ReturnType<typeof import("@/lib/db").requireDb>, applicationId: string) {
  return deleteCanonicalApplicationAggregate(db, applicationId);
}
