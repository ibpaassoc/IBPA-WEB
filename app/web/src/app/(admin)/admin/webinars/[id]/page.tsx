import type { Metadata } from "next";
import { AdminWebinarDetailPage } from "@/features/admin/webinars/components/AdminWebinarDetailPage";

export const metadata: Metadata = { title: "Webinar workspace | IBPA Admin" };

export default async function WebinarDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminWebinarDetailPage webinarId={id} />;
}
