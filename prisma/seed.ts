import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, MaterialType, MetalOption, Unit, CustomFieldEntity, CustomFieldType, type Material } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // -------------------------------------------------------------------
  // Suppliers
  // -------------------------------------------------------------------
  const chainSupplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-chain" },
    update: {},
    create: {
      id: "seed-supplier-chain",
      name: "Example Chain & Findings Co.",
      email: "sales@example-chain.com",
      website: "https://example-chain.com",
      notes: "Placeholder supplier — replace with your real 316L/316 supplier.",
    },
  });

  const beadSupplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-beads" },
    update: {},
    create: {
      id: "seed-supplier-beads",
      name: "Example Bead Supplier",
      email: "orders@example-beads.com",
      notes: "Placeholder supplier — replace with your real bead supplier.",
    },
  });

  // -------------------------------------------------------------------
  // Chain materials — 316L gold & 316 stainless, by link length (mm)
  // -------------------------------------------------------------------
  const chainVariants: { metal: MetalOption; label: string; linkMm: number; costPerCm: number }[] = [
    { metal: MetalOption.GOLD_316L, label: "316L Gold", linkMm: 1.5, costPerCm: 0.18 },
    { metal: MetalOption.GOLD_316L, label: "316L Gold", linkMm: 2.0, costPerCm: 0.22 },
    { metal: MetalOption.STAINLESS_316, label: "316 Stainless Steel", linkMm: 1.5, costPerCm: 0.12 },
    { metal: MetalOption.STAINLESS_316, label: "316 Stainless Steel", linkMm: 2.0, costPerCm: 0.15 },
  ];

  const chains = [];
  for (const c of chainVariants) {
    const sku = `CHAIN-${c.metal === MetalOption.GOLD_316L ? "GLD" : "STL"}-${c.linkMm}MM`;
    const material = await prisma.material.upsert({
      where: { sku },
      update: {},
      create: {
        sku,
        name: `${c.label} Chain — ${c.linkMm}mm link`,
        type: MaterialType.CHAIN,
        metal: c.metal,
        unit: Unit.CM,
        costPerUnit: c.costPerCm,
        attributes: { linkLengthMm: c.linkMm },
      },
    });
    chains.push(material);
    await prisma.materialSupplier.upsert({
      where: { materialId_supplierId: { materialId: material.id, supplierId: chainSupplier.id } },
      update: {},
      create: {
        materialId: material.id,
        supplierId: chainSupplier.id,
        costPerUnit: c.costPerCm,
        leadTimeDays: 21,
        isPreferred: true,
      },
    });
  }

  // -------------------------------------------------------------------
  // Findings — pin, lobster claw, bead pin — in both 316 metal options
  // -------------------------------------------------------------------
  const findingDefs = [
    { key: "PIN", name: "Head Pin", costGold: 0.08, costSteel: 0.05 },
    { key: "LOBSTER", name: "Lobster Claw Clasp", costGold: 0.35, costSteel: 0.2 },
    { key: "BEADPIN", name: "Bead Pin", costGold: 0.09, costSteel: 0.06 },
  ];

  const findings: Record<string, { gold: Material; steel: Material }> = {};
  for (const f of findingDefs) {
    const gold = await prisma.material.upsert({
      where: { sku: `FIND-${f.key}-GLD` },
      update: {},
      create: {
        sku: `FIND-${f.key}-GLD`,
        name: `${f.name} — 316L Gold`,
        type: MaterialType.FINDING,
        metal: MetalOption.GOLD_316L,
        unit: Unit.EACH,
        costPerUnit: f.costGold,
      },
    });
    const steel = await prisma.material.upsert({
      where: { sku: `FIND-${f.key}-STL` },
      update: {},
      create: {
        sku: `FIND-${f.key}-STL`,
        name: `${f.name} — 316 Stainless Steel`,
        type: MaterialType.FINDING,
        metal: MetalOption.STAINLESS_316,
        unit: Unit.EACH,
        costPerUnit: f.costSteel,
      },
    });
    for (const m of [gold, steel]) {
      const supplierCost = m.metal === MetalOption.GOLD_316L ? f.costGold : f.costSteel;
      await prisma.materialSupplier.upsert({
        where: { materialId_supplierId: { materialId: m.id, supplierId: chainSupplier.id } },
        update: {},
        create: {
          materialId: m.id,
          supplierId: chainSupplier.id,
          costPerUnit: supplierCost,
          leadTimeDays: 21,
          isPreferred: true,
        },
      });
    }
    findings[f.key] = { gold, steel };
  }

  // -------------------------------------------------------------------
  // Beads — material x diameter x shape x colour
  // -------------------------------------------------------------------
  const beadDefs = [
    { material: "GLASS", diameterMm: 6, shape: "CIRCLE", colour: "Cobalt Blue", cost: 0.15 },
    { material: "GLASS", diameterMm: 8, shape: "CIRCLE", colour: "Clear", cost: 0.18 },
    { material: "PEARL", diameterMm: 6, shape: "CIRCLE", colour: "White", cost: 0.45 },
    { material: "PEARL", diameterMm: 8, shape: "MARQUISE", colour: "Cream", colourSecondary: "Pink", cost: 0.65 },
    { material: "OPAL", diameterMm: 6, shape: "CIRCLE", colour: "White Opal", cost: 0.9 },
    { material: "OPAL", diameterMm: 10, shape: "MARQUISE", colour: "Blue Opal", colourSecondary: "White", cost: 1.2 },
  ];

  const beads = [];
  for (const [i, b] of beadDefs.entries()) {
    const sku = `BEAD-${b.material}-${b.shape}-${b.diameterMm}MM-${i}`;
    const material = await prisma.material.upsert({
      where: { sku },
      update: {},
      create: {
        sku,
        name: `${b.colour} ${b.material} Bead — ${b.diameterMm}mm ${b.shape.toLowerCase()}`,
        type: MaterialType.BEAD,
        metal: MetalOption.NOT_APPLICABLE,
        unit: Unit.EACH,
        costPerUnit: b.cost,
        attributes: {
          beadMaterial: b.material,
          diameterMm: b.diameterMm,
          shape: b.shape,
          colour: b.colour,
          ...(b.colourSecondary ? { colourSecondary: b.colourSecondary } : {}),
        },
      },
    });
    beads.push(material);
    await prisma.materialSupplier.upsert({
      where: { materialId_supplierId: { materialId: material.id, supplierId: beadSupplier.id } },
      update: {},
      create: {
        materialId: material.id,
        supplierId: beadSupplier.id,
        costPerUnit: b.cost,
        leadTimeDays: 14,
        isPreferred: true,
      },
    });
  }

  // -------------------------------------------------------------------
  // Product categories
  // -------------------------------------------------------------------
  const braceletCategory = await prisma.productCategory.upsert({
    where: { name: "Bracelet" },
    update: {},
    create: { name: "Bracelet", description: "Chain + bead bracelets" },
  });
  await prisma.productCategory.upsert({
    where: { name: "Hat" },
    update: {},
    create: { name: "Hat", description: "Hats — style, material, slogan" },
  });
  await prisma.productCategory.upsert({
    where: { name: "Garment" },
    update: {},
    create: { name: "Garment", description: "General garments" },
  });

  // -------------------------------------------------------------------
  // Sample bracelet product with a full BOM:
  // 15cm chain + pin + lobster claw + bead + bead pin (steel, glass bead)
  // -------------------------------------------------------------------
  const sampleChain = chains.find(
    (c) => c.metal === MetalOption.STAINLESS_316 && (c.attributes as { linkLengthMm?: number }).linkLengthMm === 1.5,
  )!;
  const sampleBead = beads[0];

  const product = await prisma.product.upsert({
    where: { sku: "BR-STL-GLASS-001" },
    update: {},
    create: {
      sku: "BR-STL-GLASS-001",
      name: "Cobalt Glass Bead Bracelet — Stainless",
      categoryId: braceletCategory.id,
      description: "15cm stainless steel chain bracelet with a cobalt blue glass bead.",
      laborCost: 2.5,
      overheadCost: 0.5,
      retailPrice: 24.99,
      attributes: { chainLinkMm: 1.5 },
    },
  });

  const braceletBom = [
    { materialId: sampleChain.id, quantity: 15 }, // 15cm chain
    { materialId: findings.PIN.steel.id, quantity: 1 },
    { materialId: findings.LOBSTER.steel.id, quantity: 1 },
    { materialId: findings.BEADPIN.steel.id, quantity: 1 },
    { materialId: sampleBead.id, quantity: 1 },
  ];

  for (const item of braceletBom) {
    await prisma.recipeItem.upsert({
      where: { productId_materialId: { productId: product.id, materialId: item.materialId } },
      update: { quantity: item.quantity },
      create: { productId: product.id, materialId: item.materialId, quantity: item.quantity },
    });
  }

  // -------------------------------------------------------------------
  // Example custom fields for the upcoming hats line — demonstrates the
  // custom fields system (Settings → Custom Fields) without hardcoding
  // hat-specific columns into the Product model.
  // -------------------------------------------------------------------
  const hatFields = [
    { fieldKey: "style", label: "Style", fieldType: CustomFieldType.TEXT, sortOrder: 0 },
    { fieldKey: "material", label: "Material", fieldType: CustomFieldType.TEXT, sortOrder: 1 },
    { fieldKey: "slogan", label: "Slogan", fieldType: CustomFieldType.TEXT, sortOrder: 2 },
  ];
  for (const f of hatFields) {
    await prisma.customFieldDefinition.upsert({
      where: { entity_fieldKey: { entity: CustomFieldEntity.PRODUCT, fieldKey: f.fieldKey } },
      update: {},
      create: { entity: CustomFieldEntity.PRODUCT, ...f },
    });
  }

  console.log("Seed complete:");
  console.log(`  Suppliers: 2`);
  console.log(`  Chain materials: ${chains.length}`);
  console.log(`  Finding materials: ${Object.keys(findings).length * 2}`);
  console.log(`  Bead materials: ${beads.length}`);
  console.log(`  Sample product: ${product.sku}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
