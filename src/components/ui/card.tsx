import type { HTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

type CardProps = HTMLAttributes<HTMLElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6",
        className
      )}
      {...props}
    />
  );
}
