import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  children: ReactNode;
  error?: string;
  help?: string;
};

export function FormField({ label, children, error, help }: FormFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      {children}
      {help ? <span className="text-xs font-normal text-slate-500">{help}</span> : null}
      {error ? <span className="text-xs font-normal text-red-700">{error}</span> : null}
    </label>
  );
}

export const fieldStyles =
  "min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
