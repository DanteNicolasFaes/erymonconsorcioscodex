import { cn } from "@/components/ui/utils";

type StatusBadgeProps = {
  status: string | null | undefined;
};

const labels: Record<string, string> = {
  active: "Activo",
  archived: "Archivado",
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  disabled: "Deshabilitado",
  habitada: "Habitada",
  vacia: "Vacía",
  en_obra: "En obra",
  sin_datos: "Sin datos"
};

const styles: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  habitada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  en_obra: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  disabled: "border-red-200 bg-red-50 text-red-700",
  archived: "border-slate-300 bg-slate-100 text-slate-600",
  vacia: "border-slate-300 bg-slate-100 text-slate-600",
  sin_datos: "border-slate-300 bg-slate-100 text-slate-600"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const value = status ?? "sin_datos";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[value] ?? "border-slate-300 bg-slate-100 text-slate-600"
      )}
    >
      {labels[value] ?? value}
    </span>
  );
}
