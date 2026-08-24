import { CustomFieldType } from "@/generated/prisma/enums";
import { customFieldFormName, getCustomValues } from "@/lib/customFieldValues";
import { inputClass, labelClass } from "@/components/ui";

type Def = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: CustomFieldType;
  options: unknown;
  isRequired: boolean;
};

export function CustomFieldsFieldset({
  defs,
  attributes,
}: {
  defs: Def[];
  attributes?: unknown;
}) {
  if (defs.length === 0) return null;
  const values = getCustomValues(attributes);

  return (
    <div className="space-y-4 border-t border-black/10 pt-4 dark:border-white/10">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Custom fields</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {defs.map((def) => {
          const name = customFieldFormName(def.fieldKey);
          const value = values[def.fieldKey];
          if (def.fieldType === CustomFieldType.BOOLEAN) {
            return (
              <label key={def.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={name} defaultChecked={Boolean(value)} className="h-4 w-4" />
                {def.label}
              </label>
            );
          }
          if (def.fieldType === CustomFieldType.SELECT) {
            const options = Array.isArray(def.options) ? (def.options as string[]) : [];
            return (
              <div key={def.id}>
                <label className={labelClass}>{def.label}</label>
                <select name={name} defaultValue={value != null ? String(value) : ""} className={inputClass} required={def.isRequired}>
                  <option value="">Select…</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          }
          return (
            <div key={def.id}>
              <label className={labelClass}>{def.label}</label>
              <input
                type={def.fieldType === CustomFieldType.NUMBER ? "number" : def.fieldType === CustomFieldType.DATE ? "date" : "text"}
                step={def.fieldType === CustomFieldType.NUMBER ? "any" : undefined}
                name={name}
                defaultValue={value != null ? String(value) : ""}
                className={inputClass}
                required={def.isRequired}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
