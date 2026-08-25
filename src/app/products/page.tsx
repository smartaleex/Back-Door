import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, buttonClass, secondaryButtonClass, EmptyState, formatCurrency, formatPercent } from "@/components/ui";
import { getProductCostBreakdown, getMaxBuildable } from "@/lib/costing";
import { getCustomFieldDefs, CustomFieldEntity } from "@/lib/customFields";
import { getCustomValues, formatCustomFieldValue } from "@/lib/customFieldValues";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, customFieldDefs] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    getCustomFieldDefs(CustomFieldEntity.PRODUCT),
  ]);

  const breakdowns = await Promise.all(products.map((p) => getProductCostBreakdown(p.id)));
  const buildables = await Promise.all(products.map((p) => getMaxBuildable(p.id)));
  const rows = products.map((p, i) => ({ product: p, cost: breakdowns[i], buildable: buildables[i] }));

  return (
    <div>
      <PageHeader
        title="Products / SKUs"
        description="Every SKU's build cost, retail price and margin, computed live from your bill of materials."
        action={
          <div className="flex gap-2">
            <Link href="/products/categories" className={secondaryButtonClass}>
              Categories
            </Link>
            <Link href="/products/new" className={buttonClass}>
              + Add product
            </Link>
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState message="No products yet." cta="Add your first SKU" href="/products/new" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left text-xs uppercase tracking-wide text-foreground/50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Retail</th>
                <th className="px-4 py-3">Margin</th>
                <th className="px-4 py-3">Buildable now</th>
                {customFieldDefs.map((def) => (
                  <th key={def.id} className="px-4 py-3">
                    {def.label}
                  </th>
                ))}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ product, cost, buildable }) => {
                const customValues = getCustomValues(product.attributes);
                return (
                <tr key={product.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                  <td className="px-4 py-3">
                    {product.name}
                    {!product.isActive ? <span className="ml-2 rounded bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">inactive</span> : null}
                  </td>
                  <td className="px-4 py-3">{product.category.name}</td>
                  <td className="px-4 py-3">{formatCurrency(cost.totalCost)}</td>
                  <td className="px-4 py-3">{formatCurrency(cost.retailPrice)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        cost.marginPct === null
                          ? "text-foreground/50"
                          : cost.marginPct < 0
                            ? "text-red-600 dark:text-red-400"
                            : cost.marginPct < 30
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {formatPercent(cost.marginPct)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {buildable.maxBuildable === null ? (
                      <span className="text-foreground/40">{buildable.lines.length === 0 ? "no recipe" : "not tracked"}</span>
                    ) : (
                      <span
                        className={buildable.maxBuildable === 0 ? "text-red-600 dark:text-red-400" : ""}
                        title={buildable.hasUntrackedMaterial ? "Approximate — one or more ingredients don't have stock tracked yet" : undefined}
                      >
                        {buildable.hasUntrackedMaterial ? "~" : ""}
                        {buildable.maxBuildable}
                      </span>
                    )}
                  </td>
                  {customFieldDefs.map((def) => (
                    <td key={def.id} className="px-4 py-3 text-foreground/60">
                      {formatCustomFieldValue(customValues[def.fieldKey], def.fieldType)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <Link href={`/products/${product.id}/edit`} className="text-sm font-medium underline underline-offset-4">
                      Edit
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
