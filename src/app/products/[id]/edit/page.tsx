import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  PageHeader,
  Card,
  StatCard,
  inputClass,
  labelClass,
  buttonClass,
  secondaryButtonClass,
  dangerButtonClass,
  formatCurrency,
  formatUnitCost,
  formatPercent,
} from "@/components/ui";
import { ProductForm } from "@/components/products/ProductForm";
import { updateProduct, deleteProduct, addRecipeItem, updateRecipeItemQuantity, removeRecipeItem } from "@/app/products/actions";
import { getCustomFieldDefs, CustomFieldEntity } from "@/lib/customFields";
import { getProductCostBreakdown, getMaxBuildable } from "@/lib/costing";
import { MATERIAL_TYPE_ORDER, MATERIAL_TYPE_LABELS } from "@/lib/materialTypes";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories, customFieldDefs, materials, cost, buildable] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    getCustomFieldDefs(CustomFieldEntity.PRODUCT),
    prisma.material.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getProductCostBreakdown(id),
    getMaxBuildable(id),
  ]);

  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, id);
  const deleteWithId = deleteProduct.bind(null, id);
  const addRecipeItemWithId = addRecipeItem.bind(null, id);

  const usedMaterialIds = new Set(cost.lines.map((l) => l.materialId));
  const availableMaterials = materials.filter((m) => !usedMaterialIds.has(m.id));

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title={`Edit product — ${product.name}`}
        action={
          <div className="flex gap-2">
            <Link href={`/products/${id}/calculator`} className={secondaryButtonClass}>
              Quantity calculator
            </Link>
            <form action={deleteWithId}>
              <button type="submit" className={dangerButtonClass}>
                Delete product
              </button>
            </form>
          </div>
        }
      />

      <ProductForm
        action={updateWithId}
        categories={categories}
        customFieldDefs={customFieldDefs}
        initial={{
          sku: product.sku,
          name: product.name,
          categoryId: product.categoryId,
          description: product.description,
          imageUrl: product.imageUrl,
          laborCost: Number(product.laborCost),
          overheadCost: Number(product.overheadCost),
          retailPrice: Number(product.retailPrice),
          isActive: product.isActive,
          attributes: product.attributes,
        }}
      />

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/60">Cost summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Material cost" value={formatCurrency(cost.materialCost)} />
          <StatCard label="Total cost" value={formatCurrency(cost.totalCost)} hint="material + labour + overhead" />
          <StatCard label="Profit / unit" value={formatCurrency(cost.profit)} />
          <StatCard label="Margin" value={formatPercent(cost.marginPct)} />
          <StatCard
            label="Buildable now"
            value={buildable.maxBuildable === null ? (buildable.lines.length === 0 ? "—" : "not tracked") : `${buildable.hasUntrackedMaterial ? "~" : ""}${buildable.maxBuildable}`}
            hint={
              buildable.limitingMaterialId
                ? `limited by ${buildable.lines.find((l) => l.materialId === buildable.limitingMaterialId)?.materialName}`
                : buildable.hasUntrackedMaterial
                  ? "some materials not tracked"
                  : undefined
            }
          />
        </div>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/60">Bill of materials</h2>

        {cost.lines.length === 0 ? (
          <p className="mb-4 text-sm text-foreground/60">No materials added yet — add each component this product needs below.</p>
        ) : (
          <table className="mb-6 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="py-2">Material</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Unit cost</th>
                <th className="py-2">Line cost</th>
                <th className="py-2">Max from stock</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {cost.lines.map((line) => {
                const buildLine = buildable.lines.find((l) => l.materialId === line.materialId);
                const isLimiting = buildable.limitingMaterialId === line.materialId;
                return (
                <tr key={line.recipeItemId} className="border-t border-black/10 dark:border-white/10">
                  <td className="py-2">
                    {line.materialName} <span className="text-xs text-foreground/50">({line.materialSku})</span>
                  </td>
                  <td className="py-2">
                    <form action={updateRecipeItemQuantity.bind(null, id, line.recipeItemId)} className="flex items-center gap-1">
                      <input
                        name="quantity"
                        type="number"
                        step="any"
                        min="0"
                        defaultValue={line.quantityPerUnit}
                        className={`${inputClass} w-20 py-1`}
                      />
                      <span className="text-xs text-foreground/50">{line.unit}</span>
                      <button type="submit" className="text-xs underline underline-offset-4">
                        Update
                      </button>
                    </form>
                  </td>
                  <td className="py-2">{formatUnitCost(line.unitCost)}</td>
                  <td className="py-2">{formatCurrency(line.lineCost)}</td>
                  <td className="py-2">
                    {buildLine?.maxFromThis == null ? (
                      <span className="text-foreground/40">not tracked</span>
                    ) : (
                      <span className={isLimiting ? "font-medium text-amber-600 dark:text-amber-400" : ""}>
                        {buildLine.maxFromThis}
                        {isLimiting ? " ←" : ""}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <form action={removeRecipeItem.bind(null, id, line.recipeItemId)}>
                      <button type="submit" className="text-xs text-red-600 underline underline-offset-4 dark:text-red-400">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {availableMaterials.length === 0 ? (
          <p className="text-sm text-foreground/60">
            All active materials are already in this recipe.{" "}
            <Link href="/materials/new" className="underline underline-offset-4">
              Add another material
            </Link>
            .
          </p>
        ) : (
          <form action={addRecipeItemWithId} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-2">
              <label className={labelClass}>Material</label>
              <select name="materialId" required className={inputClass}>
                {MATERIAL_TYPE_ORDER.map((type) => {
                  const group = availableMaterials.filter((m) => m.type === type);
                  if (group.length === 0) return null;
                  return (
                    <optgroup key={type} label={MATERIAL_TYPE_LABELS[type] ?? type}>
                      {group.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.sku})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
            <div>
              <label className={labelClass}>Quantity</label>
              <input name="quantity" type="number" step="any" min="0" required defaultValue={1} className={inputClass} />
            </div>
            <div className="flex items-end">
              <button type="submit" className={buttonClass}>
                Add to recipe
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
