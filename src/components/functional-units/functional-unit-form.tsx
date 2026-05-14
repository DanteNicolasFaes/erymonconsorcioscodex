"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";

type FunctionalUnitFormProps = {
  action: (formData: FormData) => Promise<void>;
  buildingId: string;
  submitLabel: string;
  unit?: {
    id: string;
    type: string;
    identifier: string;
    floor: string | null;
    unit_number: string | null;
    occupancy_status: string;
  };
};

function stripPrefix(value: string, prefix: string) {
  return value.toLowerCase().startsWith(prefix.toLowerCase())
    ? value.slice(prefix.length).trim()
    : value;
}

function defaultUnitValue(unit: FunctionalUnitFormProps["unit"]) {
  if (!unit) {
    return "";
  }

  if (unit.unit_number) {
    return unit.unit_number;
  }

  if (unit.type === "cochera") {
    return stripPrefix(unit.identifier, "Cochera");
  }

  if (unit.type === "baulera") {
    return stripPrefix(unit.identifier, "Baulera");
  }

  if (unit.type === "local") {
    return stripPrefix(unit.identifier, "Local");
  }

  if (unit.type === "encargado") {
    return stripPrefix(unit.identifier, "Vivienda encargado").replace(
      /^-/,
      ""
    );
  }

  return unit.identifier.includes("-")
    ? unit.identifier.split("-").slice(1).join("-")
    : unit.identifier;
}

export function FunctionalUnitForm({
  action,
  buildingId,
  submitLabel,
  unit
}: FunctionalUnitFormProps) {
  const [type, setType] = useState(unit?.type ?? "departamento");
  const unitValue = defaultUnitValue(unit);

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <input type="hidden" name="building_id" value={buildingId} />
      {unit ? (
        <input type="hidden" name="functional_unit_id" value={unit.id} />
      ) : null}

      <label className="grid gap-2 text-sm font-medium">
        Tipo
        <select
          className="rounded-md border border-[var(--border)] px-3 py-2"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          required
        >
          <option value="departamento">Departamento</option>
          <option value="cochera">Cochera</option>
          <option value="baulera">Baulera</option>
          <option value="local">Local</option>
          <option value="encargado">Vivienda del encargado</option>
        </select>
      </label>

      {type === "departamento" ? (
        <>
          <label className="grid gap-2 text-sm font-medium">
            Piso
            <input
              className="rounded-md border border-[var(--border)] px-3 py-2"
              name="floor"
              defaultValue={unit?.floor ?? ""}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Departamento
            <input
              className="rounded-md border border-[var(--border)] px-3 py-2"
              name="unit_number"
              defaultValue={unitValue}
              required
            />
          </label>
        </>
      ) : null}

      {type === "cochera" ? (
        <label className="grid gap-2 text-sm font-medium">
          Número / identificación de cochera
          <input
            className="rounded-md border border-[var(--border)] px-3 py-2"
            name="unit_number"
            defaultValue={unitValue}
            required
          />
        </label>
      ) : null}

      {type === "baulera" ? (
        <label className="grid gap-2 text-sm font-medium">
          Número / identificación de baulera
          <input
            className="rounded-md border border-[var(--border)] px-3 py-2"
            name="unit_number"
            defaultValue={unitValue}
            required
          />
        </label>
      ) : null}

      {type === "local" ? (
        <label className="grid gap-2 text-sm font-medium">
          Número / nombre del local
          <input
            className="rounded-md border border-[var(--border)] px-3 py-2"
            name="unit_number"
            defaultValue={unitValue}
            required
          />
        </label>
      ) : null}

      {type === "encargado" ? (
        <>
          <label className="grid gap-2 text-sm font-medium">
            Piso
            <input
              className="rounded-md border border-[var(--border)] px-3 py-2"
              name="floor"
              defaultValue={unit?.floor ?? ""}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Departamento / unidad
            <input
              className="rounded-md border border-[var(--border)] px-3 py-2"
              name="unit_number"
              defaultValue={unitValue}
            />
          </label>
        </>
      ) : null}

      <label className="grid gap-2 text-sm font-medium">
        Ocupación
        <select
          className="rounded-md border border-[var(--border)] px-3 py-2"
          name="occupancy_status"
          defaultValue={unit?.occupancy_status ?? "sin_datos"}
          required
        >
          <option value="sin_datos">Sin datos</option>
          <option value="vacia">Vacía</option>
          <option value="habitada">Habitada</option>
          <option value="en_obra">En obra</option>
        </select>
      </label>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
