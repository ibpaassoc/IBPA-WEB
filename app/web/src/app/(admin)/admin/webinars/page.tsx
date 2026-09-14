import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminWebinarsPage } from "@/features/admin/webinars/components/AdminWebinarsPage";

export const metadata: Metadata = { title: "Webinars | IBPA Admin" };

export default function WebinarsRoute() {
  return (
    <Suspense fallback={<div className="min-h-96 rounded-[28px] border border-[#D4E0F0] bg-white" />}>
      <AdminWebinarsPage />
    </Suspense>
  );
}
