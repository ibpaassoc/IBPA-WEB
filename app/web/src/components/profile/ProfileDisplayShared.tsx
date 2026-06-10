import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { cn } from "@/lib/utils";

export function ProfilePanel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_18px_45px_rgba(11,31,68,0.08)]",
        className,
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#16386D]">
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ProfileAvatarCircle({
  imageUrl,
  alt,
  initials,
  className,
}: {
  imageUrl?: string | null;
  alt: string;
  initials: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[linear-gradient(135deg,#D8E8FB_0%,#C7DCF7_100%)] text-2xl font-semibold text-[#10203B] shadow-[0_18px_35px_rgba(11,31,68,0.18)]",
        className,
      )}
    >
      {imageUrl ? (
        <ImageWithFallback
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

export function ProfileImageGrid({
  images,
  altBuilder,
  className,
}: {
  images: string[];
  altBuilder: (index: number) => string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {images.map((image, index) => (
        <a
          key={`${image}-${index}`}
          href={image}
          target="_blank"
          rel="noreferrer"
          className="group overflow-hidden rounded-[24px] border border-[#D4E0F0] bg-[#F5F9FF]"
        >
          <ImageWithFallback
            src={image}
            alt={altBuilder(index)}
            className="aspect-square w-full object-cover transition duration-200 group-hover:scale-[1.02]"
          />
        </a>
      ))}
    </div>
  );
}
