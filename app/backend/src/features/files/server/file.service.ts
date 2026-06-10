import crypto from "crypto";
import { requireDb } from "@/lib/db";
import { findCanonicalUserByClerkId } from "@/features/users/server/user.repository";
import {
  createExternalCertificateFile,
  deleteExternalCertificateFileById,
  listExternalCertificateFilesByUserId,
} from "./file.repository";
import type { ExternalCertificateFile } from "./file.types";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapExternalCertificateFile(
  file: {
    id: string;
    fileName: string | null;
    fileUrl: string;
    createdAt: Date;
  },
): ExternalCertificateFile {
  return {
    id: file.id,
    title: normalizeText(file.fileName) || "External certificate",
    fileUrl: file.fileUrl,
    createdAt: file.createdAt.toISOString(),
  };
}

async function requireCanonicalUser(clerkUserId: string) {
  const db = requireDb();
  const canonicalUser = await findCanonicalUserByClerkId(db, clerkUserId);

  if (!canonicalUser) {
    throw new Error("User not found for the authenticated Clerk account.");
  }

  return { db, canonicalUser };
}

export async function listExternalCertificates(input: {
  clerkUserId: string;
}) {
  const { db, canonicalUser } = await requireCanonicalUser(input.clerkUserId);
  const files = await listExternalCertificateFilesByUserId(db, canonicalUser.id);
  return files.map(mapExternalCertificateFile);
}

export async function createExternalCertificate(input: {
  clerkUserId: string;
  title: string;
  fileUrl: string;
}) {
  const title = normalizeText(input.title);
  const fileUrl = normalizeText(input.fileUrl);

  if (!title) {
    throw new Error("Certificate title is required.");
  }

  if (!fileUrl) {
    throw new Error("Certificate file URL is required.");
  }

  const { db, canonicalUser } = await requireCanonicalUser(input.clerkUserId);
  const created = await createExternalCertificateFile(db, {
    id: crypto.randomUUID(),
    ownerUserId: canonicalUser.id,
    title,
    fileUrl,
  });

  if (!created) {
    throw new Error("Unable to save the uploaded certificate.");
  }

  return mapExternalCertificateFile(created);
}

export async function deleteExternalCertificate(input: {
  clerkUserId: string;
  fileId: string;
}) {
  const fileId = normalizeText(input.fileId);
  if (!fileId) {
    throw new Error("Certificate file id is required.");
  }

  const { db, canonicalUser } = await requireCanonicalUser(input.clerkUserId);
  const deleted = await deleteExternalCertificateFileById(db, {
    fileId,
    ownerUserId: canonicalUser.id,
  });

  if (!deleted) {
    throw new Error("Certificate file not found.");
  }

  return { id: deleted.id };
}
