import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cn } from "@/lib/utils";
import { getMemberInitials } from "../utils";

type MemberAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  priority?: boolean;
};

/**
 * Circular member avatar with an initials fallback. Images are routed through
 * `next/image` (via `ImageWithFallback`) so cards download a small optimized
 * rendition instead of the original multi-MB upload.
 */
export function MemberAvatar({ name, avatarUrl, className, priority }: MemberAvatarProps) {
  if (avatarUrl) {
    return (
      <div className={cn("overflow-hidden rounded-full bg-[#EAF3FD]", className)}>
        <ImageWithFallback
          src={avatarUrl}
          alt={name}
          sizes="96px"
          priority={priority}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_20%,#E0F2FE,#72A0C1_45%,#0F3B63)] font-bold text-white",
        className,
      )}
      aria-hidden="true"
    >
      {getMemberInitials(name)}
    </div>
  );
}
