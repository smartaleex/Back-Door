"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CustomFieldEntity, Prisma } from "@/generated/prisma/client";
import { getCustomFieldDefs, parseCustomFieldValues } from "@/lib/customFields";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

async function buildAttributes(formData: FormData) {
  const defs = await getCustomFieldDefs(CustomFieldEntity.SUPPLIER);
  return { custom: parseCustomFieldValues(formData, defs) } as Prisma.InputJsonValue;
}

export async function createSupplier(formData: FormData) {
  const attributes = await buildAttributes(formData);

  await prisma.supplier.create({
    data: {
      name: String(formData.get("name")).trim(),
      contactName: str(formData, "contactName"),
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      website: str(formData, "website"),
      notes: str(formData, "notes"),
      attributes,
    },
  });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(id: string, formData: FormData) {
  const attributes = await buildAttributes(formData);

  await prisma.supplier.update({
    where: { id },
    data: {
      name: String(formData.get("name")).trim(),
      contactName: str(formData, "contactName"),
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      website: str(formData, "website"),
      notes: str(formData, "notes"),
      attributes,
    },
  });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(id: string) {
  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/suppliers");
  redirect("/suppliers");
}
