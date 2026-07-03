import { AppClerkProvider } from "@/lib/clerk-provider";

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppClerkProvider>{children}</AppClerkProvider>;
}
