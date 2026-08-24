import Link from "next/link";
import { inputClass, labelClass, buttonClass, secondaryButtonClass } from "@/components/ui";
import { CustomFieldsFieldset } from "@/components/CustomFieldsFieldset";
import { CustomFieldType } from "@/generated/prisma/client";

type Def = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: CustomFieldType;
  options: unknown;
  isRequired: boolean;
};

type Category = { id: string; name: string };

export interface ProductFormValues {
  sku: string;
  name: string;
  categoryId: string;
  description: string | null;
  imageUrl: string | null;
  laborCost: number;
  overheadCost: number;
  retailPrice: number;
  isActive: boolean;
  attributes: unknown;
}

export function ProductForm({
  action,
  initial,
  categories,
  customFieldDefs,
}: {
  action: (formData: FormData) => void;
  initial?: ProductFormValues;
  categories: Category[];
  customFieldDefs: Def[];
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>SKU</label>
          <input name="sku" defaultValue={initial?.sku} required className={inputClass} placeholder="BR-STL-GLASS-001" />
        </div>
        <div>
          <label className={labelClass}>Name</label>
          <input name="name" defaultValue={initial?.name} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select name="categoryId" defaultValue={initial?.categoryId} required className={inputClass}>
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
          <input name="imageUrl" defaultValue={initial?.imageUrl ?? ""} className={inputClass} placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea name="description" defaultValue={initial?.description ?? ""} rows={2} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Labour cost per unit ($)</label>
          <input name="laborCost" type="number" step="any" min="0" defaultValue={initial?.laborCost ?? 0} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Overhead cost per unit ($)</label>
          <input name="overheadCost" type="number" step="any" min="0" defaultValue={initial?.overheadCost ?? 0} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Retail price ($)</label>
          <input name="retailPrice" type="number" step="any" min="0" defaultValue={initial?.retailPrice ?? 0} className={inputClass} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} className="h-4 w-4" />
        Active (listed in catalog)
      </label>

      <CustomFieldsFieldset defs={customFieldDefs} attributes={initial?.attributes} />

      <div className="flex gap-3">
        <button type="submit" className={buttonClass}>
          Save product
        </button>
        <Link href="/products" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
