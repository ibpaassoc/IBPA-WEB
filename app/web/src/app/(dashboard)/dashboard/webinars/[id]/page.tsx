import type { Metadata } from "next";

import { MemberWebinarPlayerPage } from "@/features/member-webinars/components/MemberWebinarPlayerPage";

export const metadata: Metadata = { title: "Webinar | IBPA" };

export default async function DashboardWebinarRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberWebinarPlayerPage webinarId={id} />;
}
