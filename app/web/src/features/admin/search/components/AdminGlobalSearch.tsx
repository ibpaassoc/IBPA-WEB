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
    const timeout = setTimeout(() => {
      searchAdmin(trimmed)
        .then((result) => setGroups(result))
        .catch(() => setGroups([]))
        .finally(() => setIsLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
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
          "flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground",
          className,
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Search className="size-4 shrink-0" data-icon="inline-start" />
        <span className="flex-1 text-left">Search admin…</span>
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden rounded-xl p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Search the admin workspace</DialogTitle>
          <DialogDescription className="sr-only">
            Search across users, profiles, memberships, applications, events, and certificates.
          </DialogDescription>

          <div className="flex items-center gap-2.5 border-b border-border py-3 pl-4 pr-14">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users, profiles, memberships, applications, events, certificates…"
              value={query}
            />
            {isLoading ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" /> : null}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {trimmedQuery.length < 2 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Type at least two characters to search the workspace.
              </p>
            ) : !isLoading && !hasResults ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No matches for &ldquo;{trimmedQuery}&rdquo;.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {groups.map((group) => (
                  <div className="flex flex-col gap-0.5" key={group.key}>
                    <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {group.label}
                    </p>
                    {group.items.map((item) => (
                      <button
                        className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                        key={`${group.key}-${item.id}`}
                        onClick={() => handleSelect(item.href)}
                        type="button"
                      >
                        <span className="font-medium text-foreground">{item.title}</span>
                        {item.subtitle ? (
                          <span className="text-xs text-muted-foreground">{item.subtitle}</span>
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
