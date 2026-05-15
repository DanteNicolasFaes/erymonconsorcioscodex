import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Volver",
  actions,
  className
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start",
        className
      )}
    >
      <div>
        {backHref ? (
          <Link
            href={backHref}
            className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
          >
            {backLabel}
          </Link>
        ) : null}
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-start gap-3">{actions}</div>
      ) : null}
    </div>
  );
}
