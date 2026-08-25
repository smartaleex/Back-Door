import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatCard, inputClass, labelClass, buttonClass, secondaryButtonClass, formatCurrency, formatUnitCost, formatQuantity } from "@/components/ui";
import { getBulkRequirements } from "@/lib/costing";

export default async function ProductCalculatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ qty?: string }>;
}) {
  const { id } = await params;
  const { qty } = await searchParams;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const targetQuantity = qty ? Number(qty) : 50;
  const result = Number.isFinite(targetQuantity) && targetQuantity > 0 ? await getBulkRequirements(id, targetQuantity) : null;

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title={`Quantity calculator — ${product.name}`}
        description="Work out how much raw material to buy and what a production run will cost."
        action={
          <Link href={`/products/${id}/edit`} className={secondaryButtonClass}>
            Back to product
          </Link>
        }
      />

      <form method="get" className="flex items-end gap-3">
        <div>
          <label className={labelClass}>How many units?</label>
          <input name="qty" type="number" min="1" step="1" defaultValue={targetQuantity} className={`${inputClass} w-40`} />
        </div>
        <button type="submit" className={buttonClass}>
          Calculate
        </button>
      </form>

      {!result ? (
        <p className="text-sm text-foreground/60">Enter a positive quantity to calculate.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Units" value={String(result.targetQuantity)} />
            <StatCard label="Material cost" value={formatCurrency(result.totalMaterialCost)} />
            <StatCard label="Total production cost" value={formatCurrency(result.grandTotalCost)} hint="incl. labour & overhead" />
            <StatCard label="Cost per unit" value={formatCurrency(result.costPerUnit)} />
          </div>

          <Card>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/60">Raw materials needed</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-foreground/50">
                <tr>
                  <th className="py-2">Material</th>
                  <th className="py-2">Per unit</th>
                  <th className="py-2">Total needed</th>
                  <th className="py-2">Unit cost</th>
                  <th className="py-2">Total cost</th>
                  <th className="py-2">Stock / shortfall</th>
                </tr>
              </thead>
              <tbody>
                {result.materials.map((m) => (
                  <tr key={m.materialId} className="border-t border-black/10 dark:border-white/10">
                    <td className="py-2">
                      {m.materialName} <span className="text-xs text-foreground/50">({m.materialSku})</span>
                    </td>
                    <td className="py-2">
                      {formatQuantity(m.quantityPerUnit)} {m.unit}
                    </td>
                    <td className="py-2">
                      {formatQuantity(m.totalQuantityNeeded)} {m.unit}
                    </td>
                    <td className="py-2">{formatUnitCost(m.unitCost)}</td>
                    <td className="py-2">{formatCurrency(m.totalCost)}</td>
                    <td className="py-2">
                      {m.stockOnHand === null ? (
                        <span className="text-foreground/40">not tracked</span>
                      ) : m.shortfall !== null && m.shortfall > 0 ? (
                        <span className="text-red-600 dark:text-red-400">short {formatQuantity(m.shortfall)}</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">OK ({formatQuantity(m.stockOnHand)})</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
