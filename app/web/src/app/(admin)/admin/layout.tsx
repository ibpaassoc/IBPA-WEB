import { redirect } from "next/navigation";
import { AdminShell } from "@/features/admin/shared/components/AdminShell";
import { getAdminPageAuth } from "@/lib/admin-api-auth";
import { AppClerkProvider } from "@/lib/clerk-provider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminAuth = await getAdminPageAuth();

  if (adminAuth.status === "unauthenticated") {
    redirect("/sign-in");
  }

  if (adminAuth.status === "forbidden") {
    redirect("/dashboard");
  }

  // AppClerkProvider loads clerk-js so the short-lived Clerk session cookie
  // keeps refreshing while an admin sits on a page. Without it, the session
  // token (~60s lifetime) expired between page load and the next mutation,
  // which made POST/PATCH/DELETE intermittently fail with 401 in production.
  return (
    <AppClerkProvider>
      <AdminShell adminEmail={adminAuth.email} adminName={adminAuth.fullName}>
        {children}
      </AdminShell>
    </AppClerkProvider>
  );
}
