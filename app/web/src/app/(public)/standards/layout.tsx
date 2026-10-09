import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.standards);

export default function StandardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
