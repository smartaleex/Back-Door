"use client";

import { useState } from "react";
import { MaterialType, MetalOption, Unit } from "@/generated/prisma/enums";
import { inputClass, labelClass, buttonClass, secondaryButtonClass } from "@/components/ui";
import { CustomFieldsFieldset } from "@/components/CustomFieldsFieldset";
import Link from "next/link";

type Def = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: import("@/generated/prisma/enums").CustomFieldType;
  options: unknown;
  isRequired: boolean;
};

export interface MaterialFormValues {
  sku: string;
  name: string;
  type: MaterialType;
  metal: MetalOption;
  unit: Unit;
  costPerUnit: number;
  stockOnHand: number | null;
  reorderAt: number | null;
  isActive: boolean;
  attributes: Record<string, unknown>;
}

export function MaterialForm({
  action,
  initial,
  customFieldDefs,
}: {
  action: (formData: FormData) => void;
  initial?: MaterialFormValues;
  customFieldDefs: Def[];
}) {
  const [type, setType] = useState<MaterialType>(initial?.type ?? MaterialType.CHAIN);
  const attrs = initial?.attributes ?? {};

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>SKU</label>
          <input name="sku" defaultValue={initial?.sku} required className={inputClass} placeholder="CHAIN-GLD-1.5MM" />
        </div>
        <div>
          <label className={labelClass}>Name</label>
          <input name="name" defaultValue={initial?.name} required className={inputClass} placeholder="316L Gold Chain — 1.5mm link" />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select
            name="type"
            defaultValue={type}
            onChange={(e) => setType(e.target.value as MaterialType)}
            className={inputClass}
          >
            {Object.values(MaterialType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Metal</label>
          <select name="metal" defaultValue={initial?.metal ?? MetalOption.NOT_APPLICABLE} className={inputClass}>
            <option value={MetalOption.NOT_APPLICABLE}>Not applicable</option>
            <option value={MetalOption.GOLD_316L}>316L Gold</option>
            <option value={MetalOption.STAINLESS_316}>316 Stainless Steel</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Unit</label>
          <select name="unit" defaultValue={initial?.unit ?? Unit.EACH} className={inputClass}>
            {Object.values(Unit).map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Cost per unit ($)</label>
          <input
            name="costPerUnit"
            type="number"
            step="any"
            min="0"
            defaultValue={initial?.costPerUnit ?? 0}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Stock on hand (optional)</label>
          <input name="stockOnHand" type="number" step="any" defaultValue={initial?.stockOnHand ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Reorder at (optional)</label>
          <input name="reorderAt" type="number" step="any" defaultValue={initial?.reorderAt ?? ""} className={inputClass} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} className="h-4 w-4" />
        Active (available to use in new products)
      </label>

      {type === MaterialType.CHAIN ? (
        <div className="space-y-4 border-t border-black/10 pt-4 dark:border-white/10">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Chain details</p>
          <div className="max-w-xs">
            <label className={labelClass}>Link size</label>
            <input
              name="linkSize"
              type="text"
              placeholder="1.5mm, 9x3mm, 4.2mm paperclip…"
              defaultValue={(attrs.linkSize as string) ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      ) : null}

      {type === MaterialType.BEAD ? (
        <div className="space-y-4 border-t border-black/10 pt-4 dark:border-white/10">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Bead details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Bead material</label>
              <select name="beadMaterial" defaultValue={(attrs.beadMaterial as string) ?? "GLASS"} className={inputClass}>
                <option value="GLASS">Glass</option>
                <option value="PEARL">Pearl</option>
                <option value="OPAL">Opal</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Diameter (mm)</label>
              <input
                name="diameterMm"
                type="number"
                step="any"
                defaultValue={(attrs.diameterMm as number) ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Shape</label>
              <select name="shape" defaultValue={(attrs.shape as string) ?? "CIRCLE"} className={inputClass}>
                <option value="CIRCLE">Circle</option>
                <option value="MARQUISE">Marquise</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Colour</label>
              <input name="colour" defaultValue={(attrs.colour as string) ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Secondary colour (dual-colour beads)</label>
              <input name="colourSecondary" defaultValue={(attrs.colourSecondary as string) ?? ""} className={inputClass} />
            </div>
          </div>
        </div>
      ) : null}

      {type === MaterialType.FABRIC ? (
        <div className="space-y-4 border-t border-black/10 pt-4 dark:border-white/10">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Fabric details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Weight / GSM</label>
              <input name="weight" defaultValue={(attrs.weight as string) ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Colour</label>
              <input name="colour" defaultValue={(attrs.colour as string) ?? ""} className={inputClass} />
            </div>
          </div>
        </div>
      ) : null}

      <CustomFieldsFieldset defs={customFieldDefs} attributes={attrs} />

      <div className="flex gap-3">
        <button type="submit" className={buttonClass}>
          Save material
        </button>
        <Link href="/materials" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
