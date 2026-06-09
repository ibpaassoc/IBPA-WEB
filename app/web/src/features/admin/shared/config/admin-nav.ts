import {
  Award,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Mail,
  Newspaper,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavChild = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: AdminNavChild[];
};

export type AdminNavGroup = {
  label?: string;
  items: AdminNavLink[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    items: [{ href: "/admin/applications", label: "Applications", icon: ClipboardList }],
  },
  {
    items: [
      {
        href: "/admin/members",
        label: "Members",
        icon: Users,
        children: [
          { href: "/admin/members", label: "Profiles", icon: UserRound },
          { href: "/admin/members?view=memberships", label: "Memberships", icon: BadgeCheck },
          { href: "/admin/members?view=certificates", label: "Certificates", icon: Award },
        ],
      },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/articles", label: "Articles", icon: Newspaper },
      { href: "/admin/mailing", label: "Mailing", icon: Mail },
    ],
  },
  {
    items: [{ href: "/admin/payments", label: "Finance", icon: CreditCard }],
  },
];

export const adminNavLinks: AdminNavLink[] = adminNavGroups.flatMap((group) => group.items);

export function isAdminLinkActive(pathname: string, href: string) {
  const cleanHref = href.split("?")[0];
  if (cleanHref === "/admin") {
    return pathname === "/admin";
  }
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

export function isMembersActive(pathname: string) {
  return pathname === "/admin/members" || pathname.startsWith("/admin/members/");
}
