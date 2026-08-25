import { prisma } from "@/lib/prisma";
import { PageHeader, Card, inputClass, labelClass, buttonClass, dangerButtonClass } from "@/components/ui";
import { createCategory, deleteCategory, updateCategoryRoles } from "@/app/products/actions";
import { CategoryRolesEditor } from "@/components/products/CategoryRolesEditor";
import { parseRecipeRoles } from "@/lib/recipeRoles";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.productCategory.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        title="Product categories"
        description="Bracelets, hats, garments — add as many as you need. Optionally define bill-of-materials slots for each so the new-product form shows labeled component pickers instead of a generic list."
      />

      <Card>
        <ul className="mb-4 divide-y divide-black/10 dark:divide-white/10">
          {categories.map((c) => (
            <li key={c.id} className="py-3">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    {c.description ? <p className="text-sm text-foreground/60">{c.description}</p> : null}
                    <p className="text-xs text-foreground/50">{c._count.products} product(s)</p>
                  </div>
                  {c._count.products === 0 ? (
                    <form action={deleteCategory.bind(null, c.id)}>
                      <button type="submit" className={dangerButtonClass}>
                        Delete
                      </button>
                    </form>
                  ) : null}
                </div>
                <CategoryRolesEditor action={updateCategoryRoles.bind(null, c.id)} initialRoles={parseRecipeRoles(c.recipeRoles)} />
              </div>
            </li>
          ))}
        </ul>

        <form action={createCategory} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>New category name</label>
            <input name="name" required className={inputClass} placeholder="Hat" />
          </div>
          <div>
            <label className={labelClass}>Description (optional)</label>
            <input name="description" className={inputClass} placeholder="Style, material, slogan" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={buttonClass}>
              Add category
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
