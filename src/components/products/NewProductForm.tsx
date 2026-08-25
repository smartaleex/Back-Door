"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { inputClass, labelClass, buttonClass, secondaryButtonClass } from "@/components/ui";
import { CustomFieldsFieldset } from "@/components/CustomFieldsFieldset";
import { CustomFieldType } from "@/generated/prisma/enums";
import { suggestProductSku, type MaterialForSku } from "@/lib/skuSuggestion";
import { MATERIAL_TYPE_ORDER, MATERIAL_TYPE_LABELS } from "@/lib/materialTypes";

type Def = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: CustomFieldType;
  options: unknown;
  isRequired: boolean;
};

type Category = { id: string; name: string };

export interface MaterialOption extends MaterialForSku {
  sku: string;
  unit: string;
  costPerUnit: number;
  stockOnHand: number | null;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);
}

let rowKeySeq = 0;
function nextRowKey() {
  rowKeySeq += 1;
  return `row-${rowKeySeq}`;
}

export function NewProductForm({
  action,
  categories,
  materials,
  customFieldDefs,
  nextSequenceByCategory,
}: {
  action: (formData: FormData) => void;
  categories: Category[];
  materials: MaterialOption[];
  customFieldDefs: Def[];
  nextSequenceByCategory: Record<string, number>;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [sku, setSku] = useState("");
  const [skuTouched, setSkuTouched] = useState(false);
  const [laborCost, setLaborCost] = useState(0);
  const [overheadCost, setOverheadCost] = useState(0);
  const [retailPrice, setRetailPrice] = useState(0);
  const [rows, setRows] = useState<{ key: string; materialId: string; quantity: number }[]>([]);

  const materialsByType = useMemo(() => {
    const groups: Record<string, MaterialOption[]> = {};
    for (const m of materials) {
      (groups[m.type] ??= []).push(m);
    }
    return groups;
  }, [materials]);

  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";

  function recomputeSku(nextRows: typeof rows, nextCategoryId: string) {
    if (skuTouched) return;
    const catName = categories.find((c) => c.id === nextCategoryId)?.name ?? "";
    const seq = nextSequenceByCategory[nextCategoryId] ?? 1;
    setSku(suggestProductSku(catName, materials, nextRows.map((r) => r.materialId).filter(Boolean), seq));
  }

  function updateRows(next: typeof rows) {
    setRows(next);
    recomputeSku(next, categoryId);
  }

  function addRow() {
    const used = new Set(rows.map((r) => r.materialId));
    const firstAvailable = materials.find((m) => !used.has(m.id));
    updateRows([...rows, { key: nextRowKey(), materialId: firstAvailable?.id ?? "", quantity: 1 }]);
  }

  function removeRow(key: string) {
    updateRows(rows.filter((r) => r.key !== key));
  }

  function setRowMaterial(key: string, materialId: string) {
    updateRows(rows.map((r) => (r.key === key ? { ...r, materialId } : r)));
  }

  function setRowQuantity(key: string, quantity: number) {
    updateRows(rows.map((r) => (r.key === key ? { ...r, quantity } : r)));
  }

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    recomputeSku(rows, id);
  }

  const preview = useMemo(() => {
    let materialCost = 0;
    let buildable: number | null = null;
    let hasUntracked = false;

    for (const row of rows) {
      const material = materials.find((m) => m.id === row.materialId);
      if (!material || !row.quantity || row.quantity <= 0) continue;
      materialCost += material.costPerUnit * row.quantity;

      if (material.stockOnHand == null) {
        hasUntracked = true;
      } else {
        const fromThis = Math.floor(material.stockOnHand / row.quantity);
        buildable = buildable === null ? fromThis : Math.min(buildable, fromThis);
      }
    }

    const totalCost = materialCost + (laborCost || 0) + (overheadCost || 0);
    const margin = retailPrice > 0 ? ((retailPrice - totalCost) / retailPrice) * 100 : null;
    return { materialCost, totalCost, margin, buildable, hasUntracked };
  }, [rows, materials, laborCost, overheadCost, retailPrice]);

  const usedIds = new Set(rows.map((r) => r.materialId));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="recipeJson" value={JSON.stringify(rows.filter((r) => r.materialId && r.quantity > 0))} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>SKU</label>
          <input
            name="sku"
            value={sku}
            onChange={(e) => {
              setSkuTouched(true);
              setSku(e.target.value);
            }}
            required
            className={inputClass}
            placeholder="Auto-suggested from category + materials"
          />
          {!skuTouched ? <p className="mt-1 text-xs text-foreground/50">Auto-filled as you add materials — edit it any time.</p> : null}
        </div>
        <div>
          <label className={labelClass}>Name</label>
          <input name="name" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Link href="/products/categories" className="mt-1 inline-block text-xs underline underline-offset-4 text-foreground/60">
            Manage categories
          </Link>
        </div>
        <div>
          <label className={labelClass}>Image URL (catalog photo)</label>
          <input name="imageUrl" className={inputClass} placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea name="description" rows={2} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Labour cost per unit ($)</label>
          <input
            name="laborCost"
            type="number"
            step="any"
            min="0"
            value={laborCost}
            onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Overhead cost per unit ($)</label>
          <input
            name="overheadCost"
            type="number"
            step="any"
            min="0"
            value={overheadCost}
            onChange={(e) => setOverheadCost(Number(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Retail price ($)</label>
          <input
            name="retailPrice"
            type="number"
            step="any"
            min="0"
            value={retailPrice}
            onChange={(e) => setRetailPrice(Number(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
        Active (listed in catalog)
      </label>

      <div className="space-y-4 border-t border-black/10 pt-4 dark:border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">Bill of materials</p>
          <button type="button" onClick={addRow} className={secondaryButtonClass}>
            + Add component
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-foreground/60">No components yet — add each material this {categoryName || "product"} needs.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => {
              const material = materials.find((m) => m.id === row.materialId);
              return (
                <div key={row.key} className="grid grid-cols-[1fr_auto_auto] items-end gap-2 sm:grid-cols-[2fr_1fr_auto_auto]">
                  <div>
                    <label className={labelClass}>Material</label>
                    <select
                      value={row.materialId}
                      onChange={(e) => setRowMaterial(row.key, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select…</option>
                      {MATERIAL_TYPE_ORDER.map((type) =>
                        materialsByType[type]?.length ? (
                          <optgroup key={type} label={MATERIAL_TYPE_LABELS[type] ?? type}>
                            {materialsByType[type].map((m) => (
                              <option key={m.id} value={m.id} disabled={usedIds.has(m.id) && m.id !== row.materialId}>
                                {m.name} ({m.sku})
                              </option>
                            ))}
                          </optgroup>
                        ) : null,
                      )}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Qty</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={row.quantity}
                      onChange={(e) => setRowQuantity(row.key, Number(e.target.value) || 0)}
                      className={inputClass}
                    />
                  </div>
                  <div className="text-sm text-foreground/50">{material ? material.unit : ""}</div>
                  <button type="button" onClick={() => removeRow(row.key)} className="text-xs text-red-600 underline underline-offset-4 dark:text-red-400">
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-black/10 bg-black/[0.015] p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground/50">Live preview</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-foreground/60">Material cost</p>
            <p className="text-lg font-semibold">{formatMoney(preview.materialCost)}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/60">Total cost</p>
            <p className="text-lg font-semibold">{formatMoney(preview.totalCost)}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/60">Margin</p>
            <p className="text-lg font-semibold">{preview.margin === null ? "—" : `${preview.margin.toFixed(1)}%`}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/60">Buildable now</p>
            <p className="text-lg font-semibold">
              {preview.buildable === null ? "—" : `${preview.hasUntracked ? "~" : ""}${preview.buildable}`}
            </p>
          </div>
        </div>
      </div>

      <CustomFieldsFieldset defs={customFieldDefs} />

      <div className="flex gap-3">
        <button type="submit" className={buttonClass}>
          Create product
        </button>
        <Link href="/products" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
