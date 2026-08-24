import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const { Decimal } = Prisma;
type DecimalLike = Prisma.Decimal | number | string;

function toDecimal(value: DecimalLike) {
  return value instanceof Decimal ? value : new Decimal(value);
}

/**
 * Effective unit cost for a material: the preferred supplier's price if one
 * is set, otherwise the material's own fallback costPerUnit.
 */
export function effectiveMaterialCost(material: {
  costPerUnit: DecimalLike;
  suppliers?: { costPerUnit: DecimalLike; isPreferred: boolean }[];
}) {
  const preferred = material.suppliers?.find((s) => s.isPreferred);
  return toDecimal(preferred ? preferred.costPerUnit : material.costPerUnit);
}

export interface RecipeLineCost {
  recipeItemId: string;
  materialId: string;
  materialName: string;
  materialSku: string;
  unit: string;
  quantityPerUnit: number;
  unitCost: number;
  lineCost: number;
}

export interface ProductCostBreakdown {
  productId: string;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  retailPrice: number;
  profit: number;
  marginPct: number | null; // null when retailPrice is 0 (undefined margin)
  lines: RecipeLineCost[];
}

/**
 * Full cost + margin breakdown for a single product, based on its current
 * bill of materials and preferred-supplier pricing.
 */
export async function getProductCostBreakdown(productId: string): Promise<ProductCostBreakdown> {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: {
      recipeItems: {
        include: { material: { include: { suppliers: true } } },
      },
    },
  });

  let materialCost = new Decimal(0);
  const lines: RecipeLineCost[] = [];

  for (const item of product.recipeItems) {
    const unitCost = effectiveMaterialCost(item.material);
    const qty = toDecimal(item.quantity);
    const lineCost = unitCost.times(qty);
    materialCost = materialCost.plus(lineCost);

    lines.push({
      recipeItemId: item.id,
      materialId: item.materialId,
      materialName: item.material.name,
      materialSku: item.material.sku,
      unit: item.material.unit,
      quantityPerUnit: qty.toNumber(),
      unitCost: unitCost.toNumber(),
      lineCost: lineCost.toNumber(),
    });
  }

  const laborCost = toDecimal(product.laborCost);
  const overheadCost = toDecimal(product.overheadCost);
  const totalCost = materialCost.plus(laborCost).plus(overheadCost);
  const retailPrice = toDecimal(product.retailPrice);
  const profit = retailPrice.minus(totalCost);
  const marginPct = retailPrice.isZero() ? null : profit.dividedBy(retailPrice).times(100).toNumber();

  return {
    productId,
    materialCost: materialCost.toNumber(),
    laborCost: laborCost.toNumber(),
    overheadCost: overheadCost.toNumber(),
    totalCost: totalCost.toNumber(),
    retailPrice: retailPrice.toNumber(),
    profit: profit.toNumber(),
    marginPct,
    lines,
  };
}

export interface BulkMaterialRequirement {
  materialId: string;
  materialSku: string;
  materialName: string;
  unit: string;
  quantityPerUnit: number;
  totalQuantityNeeded: number;
  unitCost: number;
  totalCost: number;
  stockOnHand: number | null;
  shortfall: number | null; // totalQuantityNeeded - stockOnHand, if stock is tracked
}

export interface BulkRequirementsResult {
  productId: string;
  targetQuantity: number;
  materials: BulkMaterialRequirement[];
  totalMaterialCost: number;
  totalLaborCost: number;
  totalOverheadCost: number;
  grandTotalCost: number;
  costPerUnit: number;
}

/**
 * Given a product and a target production quantity, compute the total raw
 * material needed and the total cost to produce that quantity — useful for
 * purchasing decisions ahead of a production run.
 */
export async function getBulkRequirements(productId: string, targetQuantity: number): Promise<BulkRequirementsResult> {
  if (!Number.isFinite(targetQuantity) || targetQuantity <= 0) {
    throw new Error("targetQuantity must be a positive number");
  }

  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: {
      recipeItems: {
        include: { material: { include: { suppliers: true } } },
      },
    },
  });

  const qtyDecimal = new Decimal(targetQuantity);
  let totalMaterialCost = new Decimal(0);
  const materials: BulkMaterialRequirement[] = [];

  for (const item of product.recipeItems) {
    const unitCost = effectiveMaterialCost(item.material);
    const perUnitQty = toDecimal(item.quantity);
    const totalQty = perUnitQty.times(qtyDecimal);
    const lineCost = unitCost.times(totalQty);
    totalMaterialCost = totalMaterialCost.plus(lineCost);

    const stock = item.material.stockOnHand != null ? toDecimal(item.material.stockOnHand) : null;

    materials.push({
      materialId: item.materialId,
      materialSku: item.material.sku,
      materialName: item.material.name,
      unit: item.material.unit,
      quantityPerUnit: perUnitQty.toNumber(),
      totalQuantityNeeded: totalQty.toNumber(),
      unitCost: unitCost.toNumber(),
      totalCost: lineCost.toNumber(),
      stockOnHand: stock ? stock.toNumber() : null,
      shortfall: stock ? totalQty.minus(stock).toNumber() : null,
    });
  }

  const totalLaborCost = toDecimal(product.laborCost).times(qtyDecimal);
  const totalOverheadCost = toDecimal(product.overheadCost).times(qtyDecimal);
  const grandTotalCost = totalMaterialCost.plus(totalLaborCost).plus(totalOverheadCost);

  return {
    productId,
    targetQuantity,
    materials,
    totalMaterialCost: totalMaterialCost.toNumber(),
    totalLaborCost: totalLaborCost.toNumber(),
    totalOverheadCost: totalOverheadCost.toNumber(),
    grandTotalCost: grandTotalCost.toNumber(),
    costPerUnit: grandTotalCost.dividedBy(qtyDecimal).toNumber(),
  };
}
