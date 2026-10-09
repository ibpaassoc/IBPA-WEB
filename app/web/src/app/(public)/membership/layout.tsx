import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.membership);

export default function MembershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
