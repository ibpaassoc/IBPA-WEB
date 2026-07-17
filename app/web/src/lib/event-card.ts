export type EventCardVariant = "featured" | "standard" | "compact" | "admin";

export function getEventCardLayoutClassName(variant: EventCardVariant) {
  if (variant === "featured") {
    return "grid min-w-0 items-start gap-5 md:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.1fr)] lg:gap-8";
  }

  if (variant === "compact") {
    return "grid min-w-0 items-start grid-cols-[minmax(84px,112px)_minmax(0,1fr)] gap-4";
  }

  return "grid min-w-0 items-start gap-5 md:grid-cols-[minmax(210px,0.82fr)_minmax(0,1.18fr)]";
}
