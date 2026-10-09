import { AppClerkProvider } from "@/lib/clerk-provider";
import { NOINDEX_METADATA } from "@/lib/seo/metadata";

export const metadata = NOINDEX_METADATA;

export default function PublicSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppClerkProvider>{children}</AppClerkProvider>;
}
