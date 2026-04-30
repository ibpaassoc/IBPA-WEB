import { cookies } from "next/headers";
import { MembersDirectory } from "@/components/members/MembersDirectory";
import { getPublicMembers } from "@/lib/public-members";

export default async function MembersPage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("ibpa-locale")?.value;
  const locale = localeCookie === "ru" || localeCookie === "uk" ? localeCookie : "en";
  const items = await getPublicMembers(locale);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 md:pt-36">
      <MembersDirectory locale={locale} items={items} mode="full" />
    </div>
  );
}
