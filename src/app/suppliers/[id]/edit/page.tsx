import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, dangerButtonClass } from "@/components/ui";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { updateSupplier, deleteSupplier } from "@/app/suppliers/actions";
import { getCustomFieldDefs, CustomFieldEntity } from "@/lib/customFields";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [supplier, customFieldDefs] = await Promise.all([
    prisma.supplier.findUnique({ where: { id } }),
    getCustomFieldDefs(CustomFieldEntity.SUPPLIER),
  ]);

  if (!supplier) notFound();

  const updateWithId = updateSupplier.bind(null, id);
  const deleteWithId = deleteSupplier.bind(null, id);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={`Edit supplier — ${supplier.name}`}
        action={
          <form action={deleteWithId}>
            <button type="submit" className={dangerButtonClass}>
              Delete supplier
            </button>
          </form>
        }
      />
      <SupplierForm
        action={updateWithId}
        customFieldDefs={customFieldDefs}
        initial={{
          name: supplier.name,
          contactName: supplier.contactName,
          email: supplier.email,
          phone: supplier.phone,
          website: supplier.website,
          notes: supplier.notes,
          attributes: supplier.attributes,
        }}
      />
    </div>
  );
}
