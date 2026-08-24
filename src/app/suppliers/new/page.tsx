import { PageHeader } from "@/components/ui";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { createSupplier } from "@/app/suppliers/actions";
import { getCustomFieldDefs, CustomFieldEntity } from "@/lib/customFields";

export default async function NewSupplierPage() {
  const customFieldDefs = await getCustomFieldDefs(CustomFieldEntity.SUPPLIER);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add supplier" />
      <SupplierForm action={createSupplier} customFieldDefs={customFieldDefs} />
    </div>
  );
}
