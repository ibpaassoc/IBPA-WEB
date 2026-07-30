import { AppClerkProvider } from "@/lib/clerk-provider";

export default function TeamInviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppClerkProvider>{children}</AppClerkProvider>;
}
