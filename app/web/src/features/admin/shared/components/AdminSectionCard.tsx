import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminSectionCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AdminSectionCard({
  actions,
  children,
  className,
  contentClassName,
  description,
  title,
}: AdminSectionCardProps) {
  return (
    <Card
      className={cn(
        "border-border/80 bg-card shadow-[0_1px_2px_rgba(33,70,109,0.04),0_18px_40px_-28px_rgba(33,70,109,0.35)]",
        className,
      )}
    >
      {title || description || actions ? (
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            {title ? <CardTitle>{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("flex flex-col gap-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
