import { FileText } from "lucide-react";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";

type ProfileMediaGalleryProps = {
  images: string[];
};

export function ProfileMediaGallery({ images }: ProfileMediaGalleryProps) {
  if (images.length === 0) {
    return (
      <AdminEmptyState
        description="Photos uploaded by the member will appear here."
        title="No profile photos"
      />
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {images.map((image) => (
        <a
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          href={image}
          key={image}
          rel="noreferrer"
          target="_blank"
        >
          <FileText data-icon="inline-start" />
          <span className="truncate">{image.split("/").pop() || "Profile media"}</span>
        </a>
      ))}
    </div>
  );
}
