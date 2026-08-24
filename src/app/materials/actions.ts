"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MaterialType, MetalOption, Unit, CustomFieldEntity, Prisma } from "@/generated/prisma/client";
import { getCustomFieldDefs, parseCustomFieldValues, mergeCustomIntoAttributes } from "@/lib/customFields";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function num(formData: FormData, key: string) {
  const v = str(formData, key);
  return v === null ? null : Number(v);
}

function buildTypeAttributes(formData: FormData, type: MaterialType) {
  if (type === MaterialType.CHAIN) {
    const linkLengthMm = num(formData, "linkLengthMm");
    return linkLengthMm !== null ? { linkLengthMm } : {};
  }
  if (type === MaterialType.BEAD) {
    const beadMaterial = str(formData, "beadMaterial");
    const diameterMm = num(formData, "diameterMm");
    const shape = str(formData, "shape");
    const colour = str(formData, "colour");
    const colourSecondary = str(formData, "colourSecondary");
    return {
      ...(beadMaterial ? { beadMaterial } : {}),
      ...(diameterMm !== null ? { diameterMm } : {}),
      ...(shape ? { shape } : {}),
      ...(colour ? { colour } : {}),
      ...(colourSecondary ? { colourSecondary } : {}),
    };
  }
  if (type === MaterialType.FABRIC) {
    const weight = str(formData, "weight");
    const colour = str(formData, "colour");
    return {
      ...(weight ? { weight } : {}),
      ...(colour ? { colour } : {}),
    };
  }
  return {};
}

async function buildAttributes(formData: FormData, type: MaterialType) {
  const typeAttrs = buildTypeAttributes(formData, type);
  const defs = await getCustomFieldDefs(CustomFieldEntity.MATERIAL);
  const custom = parseCustomFieldValues(formData, defs);
  return mergeCustomIntoAttributes(typeAttrs, custom) as Prisma.InputJsonValue;
}

export async function createMaterial(formData: FormData) {
  const type = formData.get("type") as MaterialType;
  const attributes = await buildAttributes(formData, type);

  await prisma.material.create({
    data: {
      sku: String(formData.get("sku")).trim(),
      name: String(formData.get("name")).trim(),
      type,
      metal: (formData.get("metal") as MetalOption) || MetalOption.NOT_APPLICABLE,
      unit: formData.get("unit") as Unit,
      costPerUnit: Number(formData.get("costPerUnit")),
      stockOnHand: num(formData, "stockOnHand"),
      reorderAt: num(formData, "reorderAt"),
      isActive: formData.get("isActive") === "on",
      attributes,
    },
  });

  revalidatePath("/materials");
  redirect("/materials");
}

export async function updateMaterial(id: string, formData: FormData) {
  const type = formData.get("type") as MaterialType;
  const attributes = await buildAttributes(formData, type);

  await prisma.material.update({
    where: { id },
    data: {
      sku: String(formData.get("sku")).trim(),
      name: String(formData.get("name")).trim(),
      type,
      metal: (formData.get("metal") as MetalOption) || MetalOption.NOT_APPLICABLE,
      unit: formData.get("unit") as Unit,
      costPerUnit: Number(formData.get("costPerUnit")),
      stockOnHand: num(formData, "stockOnHand"),
      reorderAt: num(formData, "reorderAt"),
      isActive: formData.get("isActive") === "on",
      attributes,
    },
  });

  revalidatePath("/materials");
  redirect("/materials");
}

export async function deleteMaterial(id: string) {
  await prisma.material.delete({ where: { id } });
  revalidatePath("/materials");
  redirect("/materials");
}

export async function addMaterialSupplier(materialId: string, formData: FormData) {
  const supplierId = String(formData.get("supplierId"));
  const costPerUnit = Number(formData.get("costPerUnit"));
  const leadTimeDays = num(formData, "leadTimeDays");
  const isPreferred = formData.get("isPreferred") === "on";

  if (isPreferred) {
    await prisma.materialSupplier.updateMany({
      where: { materialId },
      data: { isPreferred: false },
    });
  }

  await prisma.materialSupplier.upsert({
    where: { materialId_supplierId: { materialId, supplierId } },
    update: { costPerUnit, leadTimeDays, isPreferred },
    create: { materialId, supplierId, costPerUnit, leadTimeDays, isPreferred },
  });

  revalidatePath(`/materials/${materialId}/edit`);
}

export async function removeMaterialSupplier(materialId: string, materialSupplierId: string) {
  await prisma.materialSupplier.delete({ where: { id: materialSupplierId } });
  revalidatePath(`/materials/${materialId}/edit`);
}
