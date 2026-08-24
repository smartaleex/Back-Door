import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, buttonClass, EmptyState, formatCurrency } from "@/components/ui";
import { effectiveMaterialCost } from "@/lib/costing";

export const dynamic = "force-dynamic";

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;

  const materials = await prisma.material.findMany({
    where: type ? { type: type as never } : undefined,
    include: { suppliers: { include: { supplier: true } } },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const types = ["CHAIN", "FINDING", "BEAD", "FABRIC", "OTHER"];

  return (
    <div>
      <PageHeader
        title="Materials"
        description="Raw components — chain, findings, beads, fabric — used to build your products."
        action={
          <Link href="/materials/new" className={buttonClass}>
            + Add material
          </Link>
        }
      />

      <div className="mb-4 flex gap-2 overflow-x-auto">
        <Link
          href="/materials"
          className={`rounded-full px-3 py-1 text-xs font-medium ${!type ? "bg-foreground text-background" : "bg-black/5 dark:bg-white/10"}`}
        >
          All
        </Link>
        {types.map((t) => (
          <Link
            key={t}
            href={`/materials?type=${t}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${type === t ? "bg-foreground text-background" : "bg-black/5 dark:bg-white/10"}`}
          >
            {t}
          </Link>
        ))}
      </div>

      {materials.length === 0 ? (
        <EmptyState message="No materials yet." cta="Add your first material" href="/materials/new" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left text-xs uppercase tracking-wide text-foreground/50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Metal</th>
                <th className="px-4 py-3">Unit cost</th>
                <th className="px-4 py-3">Preferred supplier</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => {
                const cost = effectiveMaterialCost(m).toNumber();
                const preferred = m.suppliers.find((s) => s.isPreferred);
                return (
                  <tr key={m.id} className="border-t border-black/10 dark:border-white/10">
                    <td className="px-4 py-3 font-mono text-xs">{m.sku}</td>
                    <td className="px-4 py-3">
                      {m.name}
                      {!m.isActive ? <span className="ml-2 rounded bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">inactive</span> : null}
                    </td>
                    <td className="px-4 py-3">{m.type}</td>
                    <td className="px-4 py-3">{m.metal === "NOT_APPLICABLE" ? "—" : m.metal.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(cost)} / {m.unit}
                    </td>
                    <td className="px-4 py-3 text-foreground/60">{preferred?.supplier.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/materials/${m.id}/edit`} className="text-sm font-medium underline underline-offset-4">
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
