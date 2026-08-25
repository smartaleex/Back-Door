// Pure helper for suggesting a product SKU from its category and the
// materials in its recipe. No server/DB imports — safe for client components.

export interface MaterialForSku {
  id: string;
  name: string;
  type: string;
  metal: string;
  attributes: unknown;
}

const CATEGORY_PREFIXES: Record<string, string> = {
  Bracelet: "BR",
  Hat: "HAT",
  Garment: "GA",
};

function categoryPrefix(categoryName: string) {
  if (CATEGORY_PREFIXES[categoryName]) return CATEGORY_PREFIXES[categoryName];
  const letters = categoryName.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
  return letters || "SKU";
}

function shortToken(text: string, maxLen = 8) {
  return text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, maxLen);
}

function metalToken(metal: string) {
  if (metal === "GOLD_316L") return "GLD";
  if (metal === "STAINLESS_316") return "STL";
  return "";
}

/**
 * Builds a suggested SKU like "BR-STL-WHITEBLUE-001" from the category name,
 * the full material catalog, and the ids currently in the recipe. Chain
 * contributes its metal, bead contributes its colour — the two things that
 * usually distinguish one variant of a product from another. Purely a
 * starting point: the SKU field stays editable.
 */
export function suggestProductSku(
  categoryName: string,
  materials: MaterialForSku[],
  selectedMaterialIds: string[],
  sequence: number,
): string {
  const chosen = materials.filter((m) => selectedMaterialIds.includes(m.id));
  const parts = [categoryPrefix(categoryName)];

  const chain = chosen.find((m) => m.type === "CHAIN");
  if (chain) {
    const token = metalToken(chain.metal);
    if (token) parts.push(token);
  }

  const bead = chosen.find((m) => m.type === "BEAD");
  if (bead) {
    const attrs = (bead.attributes && typeof bead.attributes === "object" ? bead.attributes : {}) as Record<string, unknown>;
    const colour = typeof attrs.colour === "string" ? attrs.colour : bead.name;
    parts.push(shortToken(colour));
  }

  parts.push(String(sequence).padStart(3, "0"));
  return parts.join("-");
}
