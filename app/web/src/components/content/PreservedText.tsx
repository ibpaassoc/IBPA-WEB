import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const preservedTextClassName =
  "whitespace-pre-wrap break-words [overflow-wrap:anywhere]";

type PreservedTextProps = Omit<ComponentPropsWithoutRef<"p">, "children"> & {
  as?: Extract<ElementType, "div" | "p" | "span">;
  children?: ReactNode;
};

/**
 * Renders administrator-authored plain text exactly as stored without treating
 * it as HTML. New lines and empty lines remain visible, while long URLs and
 * other unbroken strings wrap inside their container.
 */
export function PreservedText({
  as: Component = "p",
  children,
  className,
  ...props
}: PreservedTextProps) {
  return (
    <Component className={cn(preservedTextClassName, className)} {...props}>
      {children}
    </Component>
  );
}
