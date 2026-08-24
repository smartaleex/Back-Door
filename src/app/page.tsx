import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, Card, buttonClass, secondaryButtonClass, formatCurrency, formatPercent } from "@/components/ui";
import { getProductCostBreakdown } from "@/lib/costing";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [products, materialCount, supplierCount] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.material.count(),
    prisma.supplier.count(),
  ]);

  const breakdowns = await Promise.all(products.map((p) => getProductCostBreakdown(p.id)));
  const rows = products.map((p, i) => ({ product: p, cost: breakdowns[i] }));

  const marginValues = rows.map((r) => r.cost.marginPct).filter((v): v is number => v !== null);
  const avgMargin = marginValues.length ? marginValues.reduce((a, b) => a + b, 0) / marginValues.length : null;
  const lowMargin = rows.filter((r) => r.cost.marginPct !== null && r.cost.marginPct < 30).sort((a, b) => (a.cost.marginPct ?? 0) - (b.cost.marginPct ?? 0));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Levendi's Back Door — cost, quantity and profitability at a glance."
        action={
          <div className="flex gap-2">
            <Link href="/products/new" className={buttonClass}>
              + Add product
            </Link>
            <Link href="/materials/new" className={secondaryButtonClass}>
              + Add material
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Products / SKUs" value={String(products.length)} />
        <StatCard label="Materials" value={String(materialCount)} />
        <StatCard label="Suppliers" value={String(supplierCount)} />
        <StatCard label="Average margin" value={formatPercent(avgMargin)} />
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/60">Products under 30% margin</h2>
        {lowMargin.length === 0 ? (
          <p className="text-sm text-foreground/60">
            {rows.length === 0 ? "Add a product to see profitability here." : "Nothing to flag — all products are at or above 30% margin."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2">Cost</th>
                <th className="py-2">Retail</th>
                <th className="py-2">Margin</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lowMargin.map(({ product, cost }) => (
                <tr key={product.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="py-2">{product.name}</td>
                  <td className="py-2">{formatCurrency(cost.totalCost)}</td>
                  <td className="py-2">{formatCurrency(cost.retailPrice)}</td>
                  <td className="py-2 text-red-600 dark:text-red-400">{formatPercent(cost.marginPct)}</td>
                  <td className="py-2 text-right">
                    <Link href={`/products/${product.id}/edit`} className="text-xs underline underline-offset-4">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <h3 className="font-medium">Materials</h3>
          <p className="mt-1 text-sm text-foreground/60">Chain, findings, beads &amp; fabric with supplier pricing.</p>
          <Link href="/materials" className="mt-3 inline-block text-sm underline underline-offset-4">
            Manage materials →
          </Link>
        </Card>
        <Card>
          <h3 className="font-medium">Products / SKUs</h3>
          <p className="mt-1 text-sm text-foreground/60">Build recipes, see cost &amp; margin, run quantity calculators.</p>
          <Link href="/products" className="mt-3 inline-block text-sm underline underline-offset-4">
            Manage products →
          </Link>
        </Card>
        <Card>
          <h3 className="font-medium">Suppliers</h3>
          <p className="mt-1 text-sm text-foreground/60">Names, contacts, lead times per material.</p>
          <Link href="/suppliers" className="mt-3 inline-block text-sm underline underline-offset-4">
            Manage suppliers →
          </Link>
        </Card>
      </div>
    </div>
  );
}
