"use client";

import { useState } from "react";
import { inputClass, labelClass, secondaryButtonClass } from "@/components/ui";
import { MATERIAL_TYPE_ORDER, MATERIAL_TYPE_LABELS } from "@/lib/materialTypes";
import type { RecipeRole } from "@/lib/recipeRoles";

let keySeq = 0;
function nextKey() {
  keySeq += 1;
  return `role-${Date.now()}-${keySeq}`;
}

export function CategoryRolesEditor({
  action,
  initialRoles,
}: {
  action: (formData: FormData) => void;
  initialRoles: RecipeRole[];
}) {
  const [roles, setRoles] = useState<RecipeRole[]>(initialRoles);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<string>("");

  function addRole() {
    if (!newLabel.trim()) return;
    setRoles([...roles, { key: nextKey(), label: newLabel.trim(), materialType: newType || null }]);
    setNewLabel("");
    setNewType("");
  }

  function removeRole(key: string) {
    setRoles(roles.filter((r) => r.key !== key));
  }

  return (
    <form action={action} className="mt-3 rounded-md border border-black/10 p-3 dark:border-white/10">
      <input type="hidden" name="rolesJson" value={JSON.stringify(roles)} />
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
        Bill-of-materials slots (optional)
      </p>
      {roles.length === 0 ? (
        <p className="mb-2 text-xs text-foreground/50">
          None set — new products in this category use a generic &quot;add any component&quot; list.
        </p>
      ) : (
        <ul className="mb-2 flex flex-wrap gap-2">
          {roles.map((r) => (
            <li key={r.key} className="flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10">
              <span className="font-medium">{r.label}</span>
              <span className="text-foreground/50">{r.materialType ? `(${MATERIAL_TYPE_LABELS[r.materialType] ?? r.materialType})` : "(any type)"}</span>
              <button type="button" onClick={() => removeRole(r.key)} className="ml-1 text-red-600 dark:text-red-400">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className={labelClass}>Slot label</label>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className={`${inputClass} w-36`}
            placeholder="e.g. Chain"
          />
        </div>
        <div>
          <label className={labelClass}>Material type</label>
          <select value={newType} onChange={(e) => setNewType(e.target.value)} className={`${inputClass} w-40`}>
            <option value="">Any type</option>
            {MATERIAL_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {MATERIAL_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={addRole} className={secondaryButtonClass}>
          + Add slot
        </button>
        <button type="submit" className="text-xs underline underline-offset-4">
          Save slots
        </button>
      </div>
    </form>
  );
}
