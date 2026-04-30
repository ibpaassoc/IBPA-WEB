import { auth, clerkClient } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();
const DEFAULT_ADMIN_EMAILS = ["mokich45usa@gmail.com", "info@ibpassociations.org"];

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function requireAdminUpload() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const primaryEmail = user.emailAddresses.find(
    (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (!primaryEmail || !ADMIN_EMAILS.includes(primaryEmail.toLowerCase())) {
    throw new Error("Forbidden");
  }

  return { uploadedBy: userId };
}

export const ourFileRouter = {
  portfolioUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    .middleware(async () => {
      return { uploadedBy: "landing-applicant" };
    })
    .onUploadComplete(async ({ file }) => {
      return { uploadedBy: "landing-applicant", url: file.url };
    }),
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth();

      if (!userId) {
        throw new Error("Unauthorized");
      }

      return { uploadedBy: userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.uploadedBy, url: file.url };
    }),
  certificateUploader: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(requireAdminUpload)
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete for certificate:", file.url);
      return { uploadedBy: "Admin", url: file.url };
    }),
  contentImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(requireAdminUpload)
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete for content image:", file.url);
      return { uploadedBy: "Admin", url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
