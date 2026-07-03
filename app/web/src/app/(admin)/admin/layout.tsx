import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/features/admin/shared/components/AdminShell";
import { isAdminEmail } from "@/lib/admin-auth";

function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user?.emailAddresses?.length) {
    return null;
  }

  const primary = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress;
  return primary || null;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const primaryEmail = getPrimaryEmail(user);

  if (!isAdminEmail(primaryEmail)) {
    redirect("/dashboard");
  }

  return (
    <AdminShell adminEmail={primaryEmail} adminName={user?.fullName ?? null}>
      {children}
    </AdminShell>
  );
}
