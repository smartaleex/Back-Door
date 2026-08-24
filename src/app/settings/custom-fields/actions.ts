"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CustomFieldEntity, CustomFieldType } from "@/generated/prisma/client";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function createCustomFieldDef(formData: FormData) {
  const entity = formData.get("entity") as CustomFieldEntity;
  const label = String(formData.get("label")).trim();
  const fieldKey = slugify(String(formData.get("fieldKey") || label));
  const fieldType = formData.get("fieldType") as CustomFieldType;
  const isRequired = formData.get("isRequired") === "on";
  const optionsRaw = String(formData.get("options") || "").trim();
  const options =
    fieldType === CustomFieldType.SELECT && optionsRaw
      ? optionsRaw.split(",").map((o) => o.trim()).filter(Boolean)
      : undefined;

  const count = await prisma.customFieldDefinition.count({ where: { entity } });

  await prisma.customFieldDefinition.create({
    data: {
      entity,
      fieldKey,
      label,
      fieldType,
      isRequired,
      options,
      sortOrder: count,
    },
  });

  revalidatePath("/settings/custom-fields");
}

export async function deleteCustomFieldDef(id: string) {
  await prisma.customFieldDefinition.delete({ where: { id } });
  revalidatePath("/settings/custom-fields");
}
