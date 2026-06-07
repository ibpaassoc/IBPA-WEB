import { redirect } from "next/navigation";

export default function LegacyClientsRoute() {
  redirect("/admin/profiles");
}
