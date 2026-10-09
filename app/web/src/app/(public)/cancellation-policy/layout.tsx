import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.cancellationPolicy);

export default function CancellationPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
