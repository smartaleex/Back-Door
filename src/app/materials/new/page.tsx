import { PageHeader } from "@/components/ui";
import { MaterialForm } from "@/components/materials/MaterialForm";
import { createMaterial } from "@/app/materials/actions";
import { getCustomFieldDefs, CustomFieldEntity } from "@/lib/customFields";

export default async function NewMaterialPage() {
  const customFieldDefs = await getCustomFieldDefs(CustomFieldEntity.MATERIAL);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add material" />
      <MaterialForm action={createMaterial} customFieldDefs={customFieldDefs} />
    </div>
  );
}
