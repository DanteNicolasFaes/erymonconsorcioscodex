"use client";

import { useFormStatus } from "react-dom";
import { buttonStyles } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
};

export function SubmitButton({
  children,
  variant = "primary",
  className
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonStyles({ variant, className })}
    >
      {pending ? "Procesando..." : children}
    </button>
  );
}
