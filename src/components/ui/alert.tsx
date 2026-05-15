import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

type AlertVariant = "success" | "error" | "info" | "warning";

const variants: Record<AlertVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-indigo-200 bg-indigo-50 text-indigo-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700"
};

type AlertProps = {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
};

export function Alert({ children, variant = "info", className }: AlertProps) {
  return (
    <div
      className={cn(
        "mb-4 rounded-xl border px-4 py-3 text-sm",
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
