import { NOINDEX_METADATA } from "@/lib/seo/metadata";

export const metadata = NOINDEX_METADATA;

export default function PaymentLinkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
