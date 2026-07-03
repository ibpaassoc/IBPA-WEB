import { AppClerkProvider } from "@/lib/clerk-provider";

export default function PublicSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppClerkProvider>{children}</AppClerkProvider>;
}
