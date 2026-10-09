import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.apply);

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
