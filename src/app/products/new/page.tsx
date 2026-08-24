import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { ProductForm } from "@/components/products/ProductForm";
import { createProduct } from "@/app/products/actions";
import { getCustomFieldDefs, CustomFieldEntity } from "@/lib/customFields";

export default async function NewProductPage() {
  const [categories, customFieldDefs] = await Promise.all([
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    getCustomFieldDefs(CustomFieldEntity.PRODUCT),
  ]);

  if (categories.length === 0) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Add product" />
        <EmptyState message="Create a product category first (e.g. Bracelet, Hat)." cta="Add a category" href="/products/categories" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add product" description="Basic details first — you'll add the bill of materials next." />
      <ProductForm action={createProduct} categories={categories} customFieldDefs={customFieldDefs} />
    </div>
  );
}
