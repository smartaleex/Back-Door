import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, secondaryButtonClass, dangerButtonClass, inputClass, labelClass, formatCurrency } from "@/components/ui";
import { MaterialForm } from "@/components/materials/MaterialForm";
import { updateMaterial, deleteMaterial, addMaterialSupplier, removeMaterialSupplier } from "@/app/materials/actions";
import { getCustomFieldDefs, CustomFieldEntity } from "@/lib/customFields";

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [material, suppliers, customFieldDefs] = await Promise.all([
    prisma.material.findUnique({
      where: { id },
      include: { suppliers: { include: { supplier: true }, orderBy: { isPreferred: "desc" } } },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    getCustomFieldDefs(CustomFieldEntity.MATERIAL),
  ]);

  if (!material) notFound();

  const updateWithId = updateMaterial.bind(null, id);
  const deleteWithId = deleteMaterial.bind(null, id);
  const addSupplierWithId = addMaterialSupplier.bind(null, id);

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        title={`Edit material — ${material.name}`}
        action={
          <form action={deleteWithId}>
            <button type="submit" className={dangerButtonClass}>
              Delete material
            </button>
          </form>
        }
      />

      <MaterialForm
        action={updateWithId}
        customFieldDefs={customFieldDefs}
        initial={{
          sku: material.sku,
          name: material.name,
          type: material.type,
          metal: material.metal,
          unit: material.unit,
          costPerUnit: Number(material.costPerUnit),
          stockOnHand: material.stockOnHand != null ? Number(material.stockOnHand) : null,
          reorderAt: material.reorderAt != null ? Number(material.reorderAt) : null,
          isActive: material.isActive,
          attributes: (material.attributes as Record<string, unknown>) ?? {},
        }}
      />

      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/60">Suppliers for this material</h2>
        {material.suppliers.length === 0 ? (
          <p className="text-sm text-foreground/60">No suppliers linked yet.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {material.suppliers.map((link) => (
              <li key={link.id} className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10">
                <div>
                  <span className="font-medium">{link.supplier.name}</span>{" "}
                  <span className="text-foreground/60">
                    — {formatCurrency(Number(link.costPerUnit))} / {material.unit}
                    {link.leadTimeDays ? `, ${link.leadTimeDays}d lead time` : ""}
                  </span>
                  {link.isPreferred ? (
                    <span className="ml-2 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background">preferred</span>
                  ) : null}
                </div>
                <form action={removeMaterialSupplier.bind(null, id, link.id)}>
                  <button type="submit" className="text-xs text-red-600 underline underline-offset-4 dark:text-red-400">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={addSupplierWithId} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Supplier</label>
            <select name="supplierId" required className={inputClass}>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Cost / unit</label>
            <input name="costPerUnit" type="number" step="any" min="0" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Lead time (days)</label>
            <input name="leadTimeDays" type="number" step="1" min="0" className={inputClass} />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPreferred" className="h-4 w-4" /> Preferred
            </label>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <button type="submit" className={secondaryButtonClass}>
              Link supplier
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
