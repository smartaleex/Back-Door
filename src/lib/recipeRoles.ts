// Pure helpers for a category's self-service bill-of-materials "roles" —
// e.g. Bracelet: Chain, Bead, Clasp. Stored as JSON on ProductCategory so
// adding a new role never needs a schema change. No server/DB imports.

export interface RecipeRole {
  key: string;
  label: string;
  materialType: string | null; // null = any material type
}

export function parseRecipeRoles(value: unknown): RecipeRole[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (r): r is RecipeRole => !!r && typeof r === "object" && typeof (r as RecipeRole).key === "string" && typeof (r as RecipeRole).label === "string",
  );
}
