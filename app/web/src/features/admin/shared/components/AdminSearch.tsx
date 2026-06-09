"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function AdminSearch({
  className,
  onChange,
  placeholder = "Search",
  value,
}: AdminSearchProps) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8AA2BD]"
      />
      <Input
        className="h-10 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] pl-10 text-sm text-[#10203B] placeholder:text-[#8AA2BD] focus-visible:border-[#1F5D8F] focus-visible:ring-[#1F5D8F]/15"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}
