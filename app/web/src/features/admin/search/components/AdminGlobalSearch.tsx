"use client";

import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { searchAdmin } from "../server/admin-search.service";
import type { AdminSearchGroup } from "../types/admin-search.types";

type AdminGlobalSearchProps = {
  className?: string;
};

export function AdminGlobalSearch({ className }: AdminGlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<AdminSearchGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setGroups([]);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // The timeout debounces typing; `cancelled` also drops the in-flight
    // response once the query changes or the dialog closes, so a slow older
    // search can never overwrite newer results.
    let cancelled = false;
    const timeout = setTimeout(() => {
      searchAdmin(trimmed)
        .then((result) => {
          if (!cancelled) setGroups(result);
        })
        .catch(() => {
          if (!cancelled) setGroups([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const trimmedQuery = query.trim();
  const hasResults = groups.length > 0;

  return (
    <>
      <button
        className={cn(
          "group flex h-11 w-full items-center gap-2.5 rounded-2xl border border-white/70 bg-white/55 px-3.5 text-sm text-[#6B7C93]",
          "shadow-[0_10px_28px_rgba(15,35,70,0.08)] backdrop-blur-2xl",
          "transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BDD0E8] hover:bg-white/75 hover:text-[#10203B] hover:shadow-[0_16px_38px_rgba(15,35,70,0.12)]",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#21466D]/10",
          className,
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF]/90 text-[#21466D] transition-colors group-hover:bg-[#E3EFFC]">
          <Search className="size-3.5" data-icon="inline-start" />
        </span>

        <span className="min-w-0 flex-1 truncate text-left">
          Search admin...
        </span>

        <kbd className="hidden shrink-0 items-center gap-0.5 rounded-lg border border-[#D9E4F2] bg-white/70 px-2 py-1 text-[0.68rem] font-semibold text-[#7A94B2] shadow-sm sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden rounded-[28px] border border-white/70 bg-white/82 p-0 shadow-[0_30px_90px_rgba(15,35,70,0.20)] backdrop-blur-2xl sm:max-w-xl">
          <DialogTitle className="sr-only">
            Search the admin workspace
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search across users, profiles, memberships, applications, events,
            and certificates.
          </DialogDescription>

          <div className="flex items-center gap-3 border-b border-[#D9E4F2]/80 bg-white/60 py-4 pl-5 pr-14 backdrop-blur-2xl">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#21466D]">
              <Search className="size-4" />
            </span>

            <input
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#10203B] outline-none placeholder:text-[#8AA2BD]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users, profiles, applications, events..."
              value={query}
            />

            {isLoading ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-[#7A94B2]" />
            ) : null}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-3">
            {trimmedQuery.length < 2 ? (
              <p className="rounded-2xl border border-[#D9E4F2] bg-[#F7FAFE]/80 px-4 py-8 text-center text-sm text-[#6B7C93]">
                Type at least two characters to search the workspace.
              </p>
            ) : !isLoading && !hasResults ? (
              <p className="rounded-2xl border border-[#D9E4F2] bg-[#F7FAFE]/80 px-4 py-8 text-center text-sm text-[#6B7C93]">
                No matches for &ldquo;{trimmedQuery}&rdquo;.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {groups.map((group) => (
                  <div className="flex flex-col gap-1" key={group.key}>
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8AA2BD]">
                      {group.label}
                    </p>

                    {group.items.map((item) => (
                      <button
                        className="group/result flex flex-col items-start gap-1 rounded-2xl border border-transparent px-3.5 py-3 text-left text-sm transition-all duration-200 hover:border-[#D9E4F2] hover:bg-white/80 hover:shadow-[0_12px_30px_rgba(15,35,70,0.08)]"
                        key={`${group.key}-${item.id}`}
                        onClick={() => handleSelect(item.href)}
                        type="button"
                      >
                        <span className="font-semibold text-[#10203B]">
                          {item.title}
                        </span>

                        {item.subtitle ? (
                          <span className="text-xs text-[#6B7C93]">
                            {item.subtitle}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
