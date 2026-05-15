"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import { fieldStyles, FormField } from "@/components/ui/form-field";

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

      <FormField label="Tipo">
        <select
          className={fieldStyles}
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
      </FormField>

      {type === "departamento" ? (
        <>
          <FormField label="Piso">
            <input
              className={fieldStyles}
              name="floor"
              defaultValue={unit?.floor ?? ""}
              required
            />
          </FormField>
          <FormField label="Departamento">
            <input
              className={fieldStyles}
              name="unit_number"
              defaultValue={unitValue}
              required
            />
          </FormField>
        </>
      ) : null}

      {type === "cochera" ? (
        <FormField label="Número / identificación de cochera">
          <input
            className={fieldStyles}
            name="unit_number"
            defaultValue={unitValue}
            required
          />
        </FormField>
      ) : null}

      {type === "baulera" ? (
        <FormField label="Número / identificación de baulera">
          <input
            className={fieldStyles}
            name="unit_number"
            defaultValue={unitValue}
            required
          />
        </FormField>
      ) : null}

      {type === "local" ? (
        <FormField label="Número / nombre del local">
          <input
            className={fieldStyles}
            name="unit_number"
            defaultValue={unitValue}
            required
          />
        </FormField>
      ) : null}

      {type === "encargado" ? (
        <>
          <FormField label="Piso">
            <input
              className={fieldStyles}
              name="floor"
              defaultValue={unit?.floor ?? ""}
            />
          </FormField>
          <FormField label="Departamento / unidad">
            <input
              className={fieldStyles}
              name="unit_number"
              defaultValue={unitValue}
            />
          </FormField>
        </>
      ) : null}

      <FormField label="Ocupación">
        <select
          className={fieldStyles}
          name="occupancy_status"
          defaultValue={unit?.occupancy_status ?? "sin_datos"}
          required
        >
          <option value="sin_datos">Sin datos</option>
          <option value="vacia">Vacía</option>
          <option value="habitada">Habitada</option>
          <option value="en_obra">En obra</option>
        </select>
      </FormField>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
