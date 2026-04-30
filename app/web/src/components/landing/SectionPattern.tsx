import React from "react";

interface SectionPatternProps {
  variant?: "right" | "left" | "center";
  className?: string;
}

export const SectionPattern: React.FC<SectionPatternProps> = ({ variant = "right", className = "" }) => {
  const positionClass =
    variant === "left"
      ? "-left-24 md:-left-32"
      : variant === "center"
        ? "left-1/2 -translate-x-1/2"
        : "-right-24 md:-right-32";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 ${positionClass} flex items-center opacity-50 ${className}`}
    >
      <div className="relative h-[420px] w-[420px] md:h-[620px] md:w-[620px]">
        <div className="absolute inset-[8%] rounded-full border border-[#72A0C1]/10" />
        <div className="absolute inset-[18%] rounded-full border border-[#72A0C1]/12" />
        <div className="absolute inset-[30%] rounded-full border border-[#72A0C1]/14" />
        <div className="absolute left-[12%] top-[14%] h-[74%] w-[74%] rounded-full border border-[#B9D9EB]/12" />
      </div>
    </div>
  );
};
