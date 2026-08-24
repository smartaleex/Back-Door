import { prisma } from "@/lib/prisma";
import { PageHeader, Card, inputClass, labelClass, buttonClass, dangerButtonClass } from "@/components/ui";
import { createCustomFieldDef, deleteCustomFieldDef } from "./actions";
import { CustomFieldEntity, CustomFieldType } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const entityLabels: Record<CustomFieldEntity, string> = {
  MATERIAL: "Materials",
  PRODUCT: "Products / SKUs",
  SUPPLIER: "Suppliers",
};

export default async function CustomFieldsSettingsPage() {
  const defs = await prisma.customFieldDefinition.findMany({
    orderBy: [{ entity: "asc" }, { sortOrder: "asc" }],
  });

  const byEntity = (entity: CustomFieldEntity) => defs.filter((d) => d.entity === entity);

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Custom fields"
        description="Add your own fields to Materials, Products or Suppliers as you get a feel for what you need to track — no code changes required."
      />

      {(Object.values(CustomFieldEntity) as CustomFieldEntity[]).map((entity) => (
        <Card key={entity}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/60">{entityLabels[entity]}</h2>

          {byEntity(entity).length > 0 ? (
            <ul className="mb-4 divide-y divide-black/10 dark:divide-white/10">
              {byEntity(entity).map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium">{d.label}</span>{" "}
                    <span className="text-foreground/50">
                      ({d.fieldKey} · {d.fieldType.toLowerCase()}
                      {d.isRequired ? " · required" : ""})
                    </span>
                  </div>
                  <form action={deleteCustomFieldDef.bind(null, d.id)}>
                    <button type="submit" className={dangerButtonClass}>
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-foreground/60">No custom fields yet.</p>
          )}

          <form action={createCustomFieldDef} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input type="hidden" name="entity" value={entity} />
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Field label</label>
              <input name="label" required className={inputClass} placeholder="Slogan" />
            </div>
            <div>
              <label className={labelClass}>Key (optional)</label>
              <input name="fieldKey" className={inputClass} placeholder="slogan" />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select name="fieldType" className={inputClass} defaultValue={CustomFieldType.TEXT}>
                {Object.values(CustomFieldType).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Options (SELECT only, comma separated)</label>
              <input name="options" className={inputClass} placeholder="Small, Medium, Large" />
            </div>
            <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isRequired" className="h-4 w-4" /> Required
              </label>
              <button type="submit" className={`${buttonClass} ml-auto`}>
                Add field
              </button>
            </div>
          </form>
        </Card>
      ))}
    </div>
  );
}
