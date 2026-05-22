"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ClipboardList, Users, Mail, Newspaper, Handshake, Building2 } from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/applications", label: "Applications", icon: ClipboardList },
    { href: "/admin/partner-applications", label: "Partner Apps", icon: Building2 },
    { href: "/admin/clients", label: "Clients", icon: Users },
    { href: "/admin/content", label: "Content", icon: Newspaper },
    { href: "/admin/partners", label: "Partners", icon: Handshake },
    { href: "/admin/mailing", label: "Mailing", icon: Mail },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-3 lg:px-5 flex items-center justify-between">
        <div className="flex items-center gap-5 lg:gap-6">
          <Link href="/admin" className="flex items-center gap-2.5 text-slate-900 font-anton text-xl uppercase tracking-tighter lg:text-[1.35rem]">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white scale-90">
              <Sparkles className="w-4 h-4" />
            </div>
            IBPA Admin
          </Link>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href) || (pathname === "/admin" && item.href === "/admin/applications");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
                    isActive
                      ? "bg-[#72A0C1] text-white shadow-lg shadow-[#72A0C1]/20"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="shrink-0">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-10 w-10 border border-slate-200 shadow-sm",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

