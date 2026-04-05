import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "destructive";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-blue-100 text-blue-800 border border-blue-200",
    secondary: "bg-neutral-100 text-neutral-800 border border-neutral-200",
    outline: "bg-transparent text-neutral-800 border border-neutral-300",
    success: "bg-green-100 text-green-800 border border-green-200",
    destructive: "bg-red-100 text-red-800 border border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
