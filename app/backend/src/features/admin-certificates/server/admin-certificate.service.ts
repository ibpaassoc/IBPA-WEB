import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreMemberships, coreUsers } from "@/lib/schema";
import {
  createAdminCertificate as createAdminCertificateRow,
  deleteAdminCertificateById,
  getAdminCertificateById,
  listAdminCertificatesByOrderId,
  updateAdminCertificate,
  type AdminCertificateRow,
} from "./admin-certificate.repository";
import type {
  AdminCertificate,
  CreateAdminCertificateInput,
  UpdateAdminCertificateInput,
} from "./admin-certificate.types";

const MAX_TITLE_LENGTH = 255;
const MAX_URL_LENGTH = 2048;
const MAX_FILE_NAME_LENGTH = 255;
const MAX_FILE_TYPE_LENGTH = 120;

// Additional certificates are signed PDFs, matching the primary certificate
// upload endpoint (`certificateUploader`, PDF-only).
const ALLOWED_FILE_TYPE = "application/pdf";
const ALLOWED_FILE_EXTENSION = ".pdf";

export class AdminCertificateError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AdminCertificateError";
    this.status = status;
  }
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown, max: number): string | null {
  const next = normalizeText(value).slice(0, max);
  return next.length > 0 ? next : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function stripQueryAndHash(value: string): string {
  return value.split("?")[0]?.split("#")[0] ?? "";
}

function isPdfFile(fileUrl: string, fileName: string | null, fileType: string | null): boolean {
  if (fileType && fileType.toLowerCase() === ALLOWED_FILE_TYPE) {
    return true;
  }
  const candidates = [fileName ?? "", stripQueryAndHash(fileUrl)];
  return candidates.some((candidate) => candidate.toLowerCase().endsWith(ALLOWED_FILE_EXTENSION));
}

function parseIssuedAt(value: unknown): Date | null {
  if (value == null || value === "") {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new AdminCertificateError("Invalid issue date.", 400);
    }
    return parsed;
  }
  throw new AdminCertificateError("Invalid issue date.", 400);
}

function validateTitle(value: unknown): string {
  const title = normalizeText(value);
  if (!title) {
    throw new AdminCertificateError("Certificate title is required.", 400);
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new AdminCertificateError(`Certificate title must be ${MAX_TITLE_LENGTH} characters or fewer.`, 400);
  }
  return title;
}

function validateFileUrl(value: unknown): string {
  const fileUrl = normalizeText(value);
  if (!fileUrl) {
    throw new AdminCertificateError("Certificate file URL is required.", 400);
  }
  if (fileUrl.length > MAX_URL_LENGTH || !isHttpUrl(fileUrl)) {
    throw new AdminCertificateError("Certificate file URL is invalid.", 400);
  }
  return fileUrl;
}

function mapAdminCertificate(row: AdminCertificateRow): AdminCertificate {
  return {
    id: row.id,
    title: row.title,
    fileUrl: row.fileUrl,
    fileName: row.fileName ?? null,
    fileType: row.fileType ?? null,
    issuedAt: row.issuedAt ? row.issuedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Validates the applicant reference server-side and resolves the owning user's
// Clerk id. Never trust an applicant identity supplied by the client — it is
// always derived from the selected order (membership) here.
async function requireApplicant(db: ReturnType<typeof requireDb>, orderId: string) {
  const normalizedOrderId = normalizeText(orderId);
  if (!normalizedOrderId) {
    throw new AdminCertificateError("Invalid applicant reference.", 400);
  }

  const [membership] = await db
    .select({ id: coreMemberships.id, userId: coreMemberships.userId })
    .from(coreMemberships)
    .where(eq(coreMemberships.id, normalizedOrderId))
    .limit(1);

  if (!membership) {
    throw new AdminCertificateError("Applicant not found.", 404);
  }

  let clerkUserId: string | null = null;
  if (membership.userId) {
    const [user] = await db
      .select({ clerkId: coreUsers.clerkId })
      .from(coreUsers)
      .where(eq(coreUsers.id, membership.userId))
      .limit(1);
    clerkUserId = user?.clerkId ?? null;
  }

  return { orderId: normalizedOrderId, clerkUserId };
}

export async function listAdminCertificates(input: { orderId: string }): Promise<AdminCertificate[]> {
  const db = requireDb();
  const applicant = await requireApplicant(db, input.orderId);
  const rows = await listAdminCertificatesByOrderId(db, applicant.orderId);
  return rows.map(mapAdminCertificate);
}

export async function createAdminCertificate(
  input: CreateAdminCertificateInput,
): Promise<AdminCertificate> {
  const db = requireDb();
  const applicant = await requireApplicant(db, input.orderId);

  const title = validateTitle(input.title);
  const fileUrl = validateFileUrl(input.fileUrl);
  const fileName = optionalText(input.fileName, MAX_FILE_NAME_LENGTH);
  const fileType = optionalText(input.fileType, MAX_FILE_TYPE_LENGTH);
  const fileKey = optionalText(input.fileKey, MAX_FILE_NAME_LENGTH);
  const issuedAt = parseIssuedAt(input.issuedAt);

  if (!isPdfFile(fileUrl, fileName, fileType)) {
    throw new AdminCertificateError("Only PDF certificates are supported.", 400);
  }

  const created = await createAdminCertificateRow(db, {
    orderId: applicant.orderId,
    clerkUserId: applicant.clerkUserId,
    title,
    fileUrl,
    fileKey,
    fileName,
    fileType,
    issuedAt,
  });

  if (!created) {
    throw new AdminCertificateError("Unable to save the certificate.", 500);
  }

  return mapAdminCertificate(created);
}

// Replace a certificate file and/or update its title. Returns the DTO plus the
// previous UploadThing key (server-only) so callers can remove the superseded
// object from storage when a new file was uploaded.
export async function replaceAdminCertificate(
  input: UpdateAdminCertificateInput,
): Promise<{ certificate: AdminCertificate; previousFileKey: string | null }> {
  const db = requireDb();
  const applicant = await requireApplicant(db, input.orderId);

  const certificateId = normalizeText(input.certificateId);
  if (!certificateId) {
    throw new AdminCertificateError("Invalid certificate id.", 400);
  }

  const existing = await getAdminCertificateById(db, {
    id: certificateId,
    orderId: applicant.orderId,
  });
  if (!existing) {
    throw new AdminCertificateError("Certificate not found.", 404);
  }

  const values: Partial<{
    title: string;
    fileUrl: string;
    fileKey: string | null;
    fileName: string | null;
    fileType: string | null;
    issuedAt: Date | null;
  }> = {};

  if (input.title !== undefined) {
    values.title = validateTitle(input.title);
  }

  if (input.issuedAt !== undefined) {
    values.issuedAt = parseIssuedAt(input.issuedAt);
  }

  let previousFileKey: string | null = null;
  const hasNewFile = input.fileUrl !== undefined && normalizeText(input.fileUrl).length > 0;

  if (hasNewFile) {
    const fileUrl = validateFileUrl(input.fileUrl);
    const fileName = optionalText(input.fileName, MAX_FILE_NAME_LENGTH);
    const fileType = optionalText(input.fileType, MAX_FILE_TYPE_LENGTH);
    const fileKey = optionalText(input.fileKey, MAX_FILE_NAME_LENGTH);

    if (!isPdfFile(fileUrl, fileName, fileType)) {
      throw new AdminCertificateError("Only PDF certificates are supported.", 400);
    }

    values.fileUrl = fileUrl;
    values.fileName = fileName;
    values.fileType = fileType;
    values.fileKey = fileKey;
    previousFileKey = existing.fileKey && existing.fileKey !== fileKey ? existing.fileKey : null;
  }

  if (Object.keys(values).length === 0) {
    throw new AdminCertificateError("No changes provided.", 400);
  }

  const updated = await updateAdminCertificate(db, {
    id: certificateId,
    orderId: applicant.orderId,
    values,
  });

  if (!updated) {
    throw new AdminCertificateError("Certificate not found.", 404);
  }

  return { certificate: mapAdminCertificate(updated), previousFileKey };
}

// Delete a certificate. Returns the removed DTO plus its UploadThing key
// (server-only) for best-effort storage cleanup.
export async function removeAdminCertificate(input: {
  orderId: string;
  certificateId: string;
}): Promise<{ certificate: AdminCertificate; removedFileKey: string | null }> {
  const db = requireDb();
  const applicant = await requireApplicant(db, input.orderId);

  const certificateId = normalizeText(input.certificateId);
  if (!certificateId) {
    throw new AdminCertificateError("Invalid certificate id.", 400);
  }

  const deleted = await deleteAdminCertificateById(db, {
    id: certificateId,
    orderId: applicant.orderId,
  });

  if (!deleted) {
    throw new AdminCertificateError("Certificate not found.", 404);
  }

  return {
    certificate: mapAdminCertificate(deleted),
    removedFileKey: deleted.fileKey ?? null,
  };
}

// Dashboard read path. Ownership is already established by the caller (the
// signed-in applicant's own membership id), so this only maps rows.
export async function listAdminCertificatesForDashboard(input: {
  orderId: string;
}): Promise<AdminCertificate[]> {
  const db = requireDb();
  const orderId = normalizeText(input.orderId);
  if (!orderId) {
    return [];
  }
  const rows = await listAdminCertificatesByOrderId(db, orderId);
  return rows.map(mapAdminCertificate);
}
