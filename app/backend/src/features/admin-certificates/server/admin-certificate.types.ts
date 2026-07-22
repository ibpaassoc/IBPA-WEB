// Public DTO for an admin-uploaded additional certificate. Intentionally omits
// the UploadThing `fileKey` — storage keys are internal and never sent to the
// browser (admin panel or applicant dashboard).
export type AdminCertificate = {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminCertificateInput = {
  orderId: string;
  title: unknown;
  fileUrl: unknown;
  fileKey?: unknown;
  fileName?: unknown;
  fileType?: unknown;
  issuedAt?: unknown;
};

export type UpdateAdminCertificateInput = {
  orderId: string;
  certificateId: string;
  title?: unknown;
  fileUrl?: unknown;
  fileKey?: unknown;
  fileName?: unknown;
  fileType?: unknown;
  issuedAt?: unknown;
};
