// Shared display order/labels for MaterialType, used to group material
// dropdowns (Chain / Bead / Finding / Fabric / Other) consistently wherever
// a recipe/BOM picker appears.
export const MATERIAL_TYPE_ORDER = ["CHAIN", "BEAD", "FINDING", "FABRIC", "OTHER"] as const;

export const MATERIAL_TYPE_LABELS: Record<string, string> = {
  CHAIN: "Chain",
  BEAD: "Bead",
  FINDING: "Finding (pins, clasps, etc.)",
  FABRIC: "Fabric",
  OTHER: "Other",
};
