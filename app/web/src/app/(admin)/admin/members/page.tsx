import { Suspense } from "react";

import { AdminMembersPage } from "@/features/admin/members/components/AdminMembersPage";

export default function MembersPage() {
  return (
    <Suspense>
      <AdminMembersPage />
    </Suspense>
  );
}
