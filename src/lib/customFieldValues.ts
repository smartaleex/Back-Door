// Pure helpers for reading/writing custom-field values. Deliberately free of
// any Prisma Client / database import so it's safe to use from Client
// Components (e.g. CustomFieldsFieldset rendered inside a "use client" form).
import type { CustomFieldType } from "@/generated/prisma/enums";

export function customFieldFormName(fieldKey: string) {
  return `custom__${fieldKey}`;
}

export function parseCustomFieldValues(
  formData: FormData,
  defs: { fieldKey: string; fieldType: CustomFieldType }[],
) {
  const values: Record<string, string | number | boolean> = {};
  for (const def of defs) {
    const raw = formData.get(customFieldFormName(def.fieldKey));
    if (raw === null) continue;
    if (def.fieldType === "BOOLEAN") {
      values[def.fieldKey] = raw === "on" || raw === "true";
    } else if (def.fieldType === "NUMBER") {
      if (raw === "") continue;
      values[def.fieldKey] = Number(raw);
    } else {
      if (raw === "") continue;
      values[def.fieldKey] = String(raw);
    }
  }
  return values;
}

export function mergeCustomIntoAttributes(attributes: unknown, custom: Record<string, unknown>) {
  const base = attributes && typeof attributes === "object" ? (attributes as Record<string, unknown>) : {};
  return { ...base, custom };
}

export function getCustomValues(attributes: unknown): Record<string, unknown> {
  if (attributes && typeof attributes === "object" && "custom" in (attributes as Record<string, unknown>)) {
    const c = (attributes as Record<string, unknown>).custom;
    if (c && typeof c === "object") return c as Record<string, unknown>;
  }
  return {};
}

// Renders one custom field's value for a table cell — used on list pages so
// a field added in Settings → Custom Fields shows up there too, not just in
// the add/edit forms.
export function formatCustomFieldValue(value: unknown, fieldType: CustomFieldType): string {
  if (value === undefined || value === null || value === "") return "—";
  if (fieldType === "BOOLEAN") return value ? "Yes" : "No";
  return String(value);
}
