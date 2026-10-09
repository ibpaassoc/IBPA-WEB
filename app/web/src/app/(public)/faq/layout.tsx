import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.faq);

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
