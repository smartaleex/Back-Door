import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { NewProductForm, type MaterialOption } from "@/components/products/NewProductForm";
import { createProductWithRecipe } from "@/app/products/actions";
import { getCustomFieldDefs, CustomFieldEntity } from "@/lib/customFields";
import { parseRecipeRoles, type RecipeRole } from "@/lib/recipeRoles";

export default async function NewProductPage() {
  const [categories, customFieldDefs, materials, productCountsByCategory] = await Promise.all([
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    getCustomFieldDefs(CustomFieldEntity.PRODUCT),
    prisma.material.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.product.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);

  if (categories.length === 0) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Add product" />
        <EmptyState message="Create a product category first (e.g. Bracelet, Hat)." cta="Add a category" href="/products/categories" />
      </div>
    );
  }

  const materialOptions: MaterialOption[] = materials.map((m) => ({
    id: m.id,
    sku: m.sku,
    name: m.name,
    type: m.type,
    metal: m.metal,
    unit: m.unit,
    costPerUnit: Number(m.costPerUnit),
    stockOnHand: m.stockOnHand != null ? Number(m.stockOnHand) : null,
    attributes: m.attributes,
  }));

  const countByCategory = new Map(productCountsByCategory.map((c) => [c.categoryId, c._count._all]));
  const nextSequenceByCategory = Object.fromEntries(categories.map((c) => [c.id, (countByCategory.get(c.id) ?? 0) + 1]));
  const categoryRoles: Record<string, RecipeRole[]> = Object.fromEntries(
    categories.map((c) => [c.id, parseRecipeRoles(c.recipeRoles)]),
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title="Add product" description="Build the whole SKU in one go — details and bill of materials together." />
      <NewProductForm
        action={createProductWithRecipe}
        categories={categories}
        materials={materialOptions}
        customFieldDefs={customFieldDefs}
        nextSequenceByCategory={nextSequenceByCategory}
        categoryRoles={categoryRoles}
      />
    </div>
  );
}
