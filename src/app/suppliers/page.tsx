import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, buttonClass, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { materialLinks: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Track who you buy chain, findings, beads and fabric from."
        action={
          <Link href="/suppliers/new" className={buttonClass}>
            + Add supplier
          </Link>
        }
      />

      {suppliers.length === 0 ? (
        <EmptyState message="No suppliers yet." cta="Add your first supplier" href="/suppliers/new" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left text-xs uppercase tracking-wide text-foreground/50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Materials supplied</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.contactName ?? "—"}</td>
                  <td className="px-4 py-3">{s.email ?? "—"}</td>
                  <td className="px-4 py-3">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3">{s._count.materialLinks}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/suppliers/${s.id}/edit`} className="text-sm font-medium underline underline-offset-4">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
