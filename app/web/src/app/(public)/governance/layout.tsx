import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.governance);

export default function GovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
