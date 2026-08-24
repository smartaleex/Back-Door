"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CustomFieldEntity, Prisma } from "@/generated/prisma/client";
import { getCustomFieldDefs, parseCustomFieldValues, mergeCustomIntoAttributes } from "@/lib/customFields";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function num(formData: FormData, key: string, fallback = 0) {
  const v = str(formData, key);
  return v === null ? fallback : Number(v);
}

async function buildAttributes(formData: FormData) {
  const defs = await getCustomFieldDefs(CustomFieldEntity.PRODUCT);
  const custom = parseCustomFieldValues(formData, defs);
  return mergeCustomIntoAttributes({}, custom) as Prisma.InputJsonValue;
}

export async function createProduct(formData: FormData) {
  const attributes = await buildAttributes(formData);

  const product = await prisma.product.create({
    data: {
      sku: String(formData.get("sku")).trim(),
      name: String(formData.get("name")).trim(),
      categoryId: String(formData.get("categoryId")),
      description: str(formData, "description"),
      imageUrl: str(formData, "imageUrl"),
      laborCost: num(formData, "laborCost"),
      overheadCost: num(formData, "overheadCost"),
      retailPrice: num(formData, "retailPrice"),
      isActive: formData.get("isActive") === "on",
      attributes,
    },
  });

  revalidatePath("/products");
  redirect(`/products/${product.id}/edit`);
}

export async function updateProduct(id: string, formData: FormData) {
  const attributes = await buildAttributes(formData);

  await prisma.product.update({
    where: { id },
    data: {
      sku: String(formData.get("sku")).trim(),
      name: String(formData.get("name")).trim(),
      categoryId: String(formData.get("categoryId")),
      description: str(formData, "description"),
      imageUrl: str(formData, "imageUrl"),
      laborCost: num(formData, "laborCost"),
      overheadCost: num(formData, "overheadCost"),
      retailPrice: num(formData, "retailPrice"),
      isActive: formData.get("isActive") === "on",
      attributes,
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}/edit`);
  redirect(`/products/${id}/edit`);
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  redirect("/products");
}

export async function addRecipeItem(productId: string, formData: FormData) {
  const materialId = String(formData.get("materialId"));
  const quantity = Number(formData.get("quantity"));

  await prisma.recipeItem.upsert({
    where: { productId_materialId: { productId, materialId } },
    update: { quantity },
    create: { productId, materialId, quantity },
  });

  revalidatePath(`/products/${productId}/edit`);
}

export async function updateRecipeItemQuantity(productId: string, recipeItemId: string, formData: FormData) {
  const quantity = Number(formData.get("quantity"));
  await prisma.recipeItem.update({ where: { id: recipeItemId }, data: { quantity } });
  revalidatePath(`/products/${productId}/edit`);
}

export async function removeRecipeItem(productId: string, recipeItemId: string) {
  await prisma.recipeItem.delete({ where: { id: recipeItemId } });
  revalidatePath(`/products/${productId}/edit`);
}

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name")).trim();
  const description = str(formData, "description");
  await prisma.productCategory.create({ data: { name, description } });
  revalidatePath("/products/categories");
  revalidatePath("/products/new");
}

export async function deleteCategory(id: string) {
  await prisma.productCategory.delete({ where: { id } });
  revalidatePath("/products/categories");
}
