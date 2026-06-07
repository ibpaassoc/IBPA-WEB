import {
  Award,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Mail,
  Newspaper,
  UserCog,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type AdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
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
    label: "Membership",
    items: [
      { href: "/admin/applications", label: "Applications", icon: ClipboardList },
      { href: "/admin/profiles", label: "Profiles", icon: UserRound },
      { href: "/admin/users", label: "Users", icon: UserCog },
      { href: "/admin/memberships", label: "Memberships", icon: BadgeCheck },
      { href: "/admin/certificates", label: "Certificates", icon: Award },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/articles", label: "Articles", icon: Newspaper },
      { href: "/admin/mailing", label: "Mailing", icon: Mail },
    ],
  },
  {
    label: "Finance",
    items: [{ href: "/admin/payments", label: "Payments", icon: CreditCard }],
  },
];

export const adminNavLinks: AdminNavLink[] = adminNavGroups.flatMap((group) => group.items);

export function isAdminLinkActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
