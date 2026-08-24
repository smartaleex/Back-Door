import { prisma } from "@/lib/prisma";
import { CustomFieldEntity, CustomFieldType } from "@/generated/prisma/client";

export { CustomFieldEntity, CustomFieldType };
export { customFieldFormName, parseCustomFieldValues, mergeCustomIntoAttributes, getCustomValues } from "@/lib/customFieldValues";

export async function getCustomFieldDefs(entity: CustomFieldEntity) {
  return prisma.customFieldDefinition.findMany({
    where: { entity },
    orderBy: { sortOrder: "asc" },
  });
}
