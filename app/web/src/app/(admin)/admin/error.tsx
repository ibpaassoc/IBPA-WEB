"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AdminRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin] route error:", error);
  }, [error]);

  return (
    <div className="rounded-[28px] border border-[#D7E5F4] bg-white px-8 py-16 text-center shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
      <p className="text-xl font-semibold tracking-[-0.02em] text-[#10203B]">
        Something went wrong loading this page
      </p>
      <p className="mt-2 text-sm text-[#6C7F95]">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button
        className="mt-6 h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
        onClick={reset}
        type="button"
        variant="outline"
      >
        <RefreshCw data-icon="inline-start" />
        Try again
      </Button>
    </div>
  );
}
