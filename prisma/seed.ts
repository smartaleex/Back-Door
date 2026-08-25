import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  MaterialType,
  MetalOption,
  Unit,
  CustomFieldEntity,
  CustomFieldType,
  Prisma,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function upsertSupplier(id: string, name: string, extra: { email?: string } = {}) {
  return prisma.supplier.upsert({
    where: { id },
    update: {},
    create: { id, name, ...extra },
  });
}

async function main() {
  // -------------------------------------------------------------------
  // Real suppliers, from the user's own inventory tracking sheet.
  // -------------------------------------------------------------------
  const irisLi = await upsertSupplier("supplier-iris-li", "Iris Li");
  const neilPark = await upsertSupplier("supplier-neil-park", "Neil Park");
  const dingshanHu = await upsertSupplier("supplier-dingshan-hu", "Dingshan Hu");
  const amyHuang = await upsertSupplier("supplier-amy-huang", "Amy Huang");
  const ivyChen = await upsertSupplier("supplier-ivy-chen", "Ivy Chen");
  const hannahLiao = await upsertSupplier("supplier-hannah-liao", "Hannah Liao");
  const yiwuWhaleDream = await upsertSupplier("supplier-yiwu-whale-dream", "Yiwu Whale Dream Jewelry Co., Ltd.");
  const xhnOfficial = await upsertSupplier("supplier-xhn-official", "XHN Official Store");
  const elleXie = await upsertSupplier("supplier-elle-xie", "Elle Xie");

  async function upsertMaterial(
    sku: string,
    data: {
      name: string;
      type: MaterialType;
      metal?: MetalOption;
      unit: Unit;
      costPerUnit: number;
      stockOnHand?: number;
      attributes?: Record<string, unknown>;
    },
  ) {
    return prisma.material.upsert({
      where: { sku },
      update: {},
      create: {
        sku,
        name: data.name,
        type: data.type,
        metal: data.metal ?? MetalOption.NOT_APPLICABLE,
        unit: data.unit,
        costPerUnit: data.costPerUnit,
        stockOnHand: data.stockOnHand,
        attributes: (data.attributes ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async function linkSupplier(materialId: string, supplierId: string, costPerUnit: number) {
    await prisma.materialSupplier.upsert({
      where: { materialId_supplierId: { materialId, supplierId } },
      update: {},
      create: { materialId, supplierId, costPerUnit, isPreferred: true },
    });
  }

  // -------------------------------------------------------------------
  // Glass "millefiori evil eye" beads — 6 colourways x 2 sizes, from Iris Li.
  // Bought as an assorted 12-strand lot ($38.12 total); cost below is the
  // blended per-bead average from that lot ($0.077/pc).
  // -------------------------------------------------------------------
  const evilEyeColourways = [
    { colour: "White", colourSecondary: "Blue" },
    { colour: "White", colourSecondary: "Black" },
    { colour: "Light Blue", colourSecondary: "Blue" },
    { colour: "Cobalt Blue", colourSecondary: "White" },
    { colour: "Red", colourSecondary: "Blue" },
    { colour: "Green", colourSecondary: "White" },
  ];
  const glassBeadSizes = [
    { diameterMm: 8, stockOnHand: 45 },
    { diameterMm: 10, stockOnHand: 38 },
  ];

  for (const size of glassBeadSizes) {
    for (const [i, c] of evilEyeColourways.entries()) {
      const sku = `BEAD-GLASS-EVILEYE-${size.diameterMm}MM-${i}`;
      const material = await upsertMaterial(sku, {
        name: `${c.colour}/${c.colourSecondary} Evil Eye Glass Bead — ${size.diameterMm}mm`,
        type: MaterialType.BEAD,
        unit: Unit.EACH,
        costPerUnit: 0.077,
        stockOnHand: size.stockOnHand,
        attributes: {
          beadMaterial: "GLASS",
          diameterMm: size.diameterMm,
          shape: "CIRCLE",
          colour: c.colour,
          colourSecondary: c.colourSecondary,
          custom: { beadPattern: "Evil Eye", purchaseLot: "1 strand (of 12, assorted)", status: "In stock", invoiceRef: "718588_310951386001028869_invoice.pdf" },
        },
      });
      await linkSupplier(material.id, irisLi.id, 0.077);
    }
  }

  // -------------------------------------------------------------------
  // Shell + opal beads
  // -------------------------------------------------------------------
  const motherOfPearl = await upsertMaterial("BEAD-SHELL-MOP-ROUND", {
    name: "Mother-of-Pearl Evil Eye Bead — Round",
    type: MaterialType.BEAD,
    unit: Unit.EACH,
    costPerUnit: 1.93,
    stockOnHand: 20,
    attributes: {
      beadMaterial: "SHELL",
      shape: "CIRCLE",
      colour: "Mother-of-Pearl",
      custom: { beadPattern: "Evil Eye", purchaseLot: "20 pcs", status: "In stock", invoiceRef: "699554_310725650501028869_invoice.pdf" },
    },
  });
  await linkSupplier(motherOfPearl.id, neilPark.id, 1.93);

  const naturalShell = await upsertMaterial("BEAD-SHELL-NATURAL-MARQUISE", {
    name: "Natural Shell Evil Eye Bead — Marquise",
    type: MaterialType.BEAD,
    unit: Unit.EACH,
    costPerUnit: 2.38,
    stockOnHand: 20,
    attributes: {
      beadMaterial: "SHELL",
      shape: "MARQUISE",
      colour: "Natural",
      custom: { beadPattern: "Evil Eye", purchaseLot: "20 pcs", status: "In stock", invoiceRef: "699556_310725654501028869_invoice.pdf" },
    },
  });
  await linkSupplier(naturalShell.id, dingshanHu.id, 2.38);

  const syntheticOpal = await upsertMaterial("BEAD-OPAL-SYNTHETIC-BLUE-10MM", {
    name: "Synthetic Blue Evil Eye Opal Bead — 10mm",
    type: MaterialType.BEAD,
    unit: Unit.EACH,
    costPerUnit: 8.79,
    stockOnHand: 10,
    attributes: {
      beadMaterial: "OPAL",
      diameterMm: 10,
      shape: "CIRCLE",
      colour: "Blue",
      custom: { beadPattern: "Evil Eye", purchaseLot: "10 pcs", status: "In stock", invoiceRef: "718594_310951398001028869_invoice.pdf" },
    },
  });
  await linkSupplier(syntheticOpal.id, amyHuang.id, 8.79);

  // -------------------------------------------------------------------
  // Clasp set (lobster + extender + connecting rings), bought/tracked as
  // one bundled unit. Gold/silver split across the 50 sets isn't broken
  // out yet — see supplierNotes custom field.
  // -------------------------------------------------------------------
  const claspSet = await upsertMaterial("FIND-CLASP-SET", {
    name: "Lobster Clasp + Extender + Connecting Rings (Set)",
    type: MaterialType.FINDING,
    unit: Unit.EACH,
    costPerUnit: 0.75,
    stockOnHand: 50,
    attributes: {
      custom: {
        purchaseLot: "50 sets",
        status: "In stock",
        invoiceRef: "718586_310725658501028869_invoice.pdf",
        supplierNotes: "Gold/silver split across the 50 sets is unclear — split into separate gold/silver SKUs once known.",
      },
    },
  });
  await linkSupplier(claspSet.id, ivyChen.id, 0.75);

  // -------------------------------------------------------------------
  // Chain — three styles, each in gold + silver. Cost per cm is derived
  // from the supplier's blended per-metre/per-piece average, since gold
  // vs silver aren't priced separately on the invoice.
  // -------------------------------------------------------------------
  const chainStyles = [
    {
      key: "CABLE-9X3",
      style: "Cable",
      linkSize: "9x3mm",
      supplier: hannahLiao,
      costPerCm: 8.92 / 100, // $8.92/m
      stockOnHandCm: 100, // 1m each metal
      purchaseLot: "1m",
      invoiceRef: "699552_310004591001028869_invoice.pdf",
    },
    {
      key: "PAPERCLIP-4.2",
      style: "Paperclip",
      linkSize: "4.2mm",
      supplier: yiwuWhaleDream,
      costPerCm: 1.25 / 45, // $1.25 per 45cm piece
      stockOnHandCm: 225, // 2.25m main each metal
      purchaseLot: "5 x 45cm",
      invoiceRef: null,
    },
    {
      key: "OVAL-2.5X6.5",
      style: "Oval",
      linkSize: "2.5x6.5mm",
      supplier: elleXie,
      costPerCm: 0.6 / 100, // $0.60/m
      stockOnHandCm: 800, // 8m each metal
      purchaseLot: "4 x 2m",
      invoiceRef: "718592_310951394001028869_invoice.pdf",
    },
  ];

  for (const c of chainStyles) {
    for (const metal of [MetalOption.GOLD_316L, MetalOption.STAINLESS_316] as const) {
      const metalTag = metal === MetalOption.GOLD_316L ? "GLD" : "STL";
      const sku = `CHAIN-${c.key}-${metalTag}`;
      const material = await upsertMaterial(sku, {
        name: `${c.linkSize} ${c.style} Chain — ${metal === MetalOption.GOLD_316L ? "Gold" : "Silver"}`,
        type: MaterialType.CHAIN,
        metal,
        unit: Unit.CM,
        costPerUnit: c.costPerCm,
        stockOnHand: c.stockOnHandCm,
        attributes: {
          linkSize: c.linkSize,
          custom: {
            chainStyle: c.style,
            purchaseLot: c.purchaseLot,
            status: "In stock",
            ...(c.invoiceRef ? { invoiceRef: c.invoiceRef } : {}),
          },
        },
      });
      await linkSupplier(material.id, c.supplier.id, c.costPerCm);
    }
  }

  // -------------------------------------------------------------------
  // Eye pins (head pins), three lengths x gold/silver, from XHN.
  // -------------------------------------------------------------------
  const eyePinLengths = [
    { lengthMm: 15, costEach: 0.055, silverQty: 100, goldQty: 50, status: "Received", invoiceRef: null as string | null },
    { lengthMm: 20, costEach: 0.039, silverQty: 100, goldQty: 50, status: "Incoming", invoiceRef: null },
    { lengthMm: 25, costEach: 0.039, silverQty: 100, goldQty: 50, status: "Incoming", invoiceRef: null },
  ];

  for (const p of eyePinLengths) {
    for (const metal of [MetalOption.GOLD_316L, MetalOption.STAINLESS_316] as const) {
      const isGold = metal === MetalOption.GOLD_316L;
      const sku = `FIND-EYEPIN-${p.lengthMm}MM-${isGold ? "GLD" : "STL"}`;
      const material = await upsertMaterial(sku, {
        name: `Ball/Head Pin — 0.6x${p.lengthMm}mm ${isGold ? "Gold" : "Silver"}`,
        type: MaterialType.FINDING,
        metal,
        unit: Unit.EACH,
        costPerUnit: p.costEach,
        stockOnHand: isGold ? p.goldQty : p.silverQty,
        attributes: {
          custom: { status: p.status },
        },
      });
      await linkSupplier(material.id, xhnOfficial.id, p.costEach);
    }
  }

  // -------------------------------------------------------------------
  // Product categories
  // -------------------------------------------------------------------
  await prisma.productCategory.upsert({
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
  // Custom field definitions
  // -------------------------------------------------------------------
  async function upsertCustomField(
    entity: CustomFieldEntity,
    fieldKey: string,
    label: string,
    sortOrder: number,
    fieldType: CustomFieldType = CustomFieldType.TEXT,
    options?: string[],
  ) {
    await prisma.customFieldDefinition.upsert({
      where: { entity_fieldKey: { entity, fieldKey } },
      update: {},
      create: { entity, fieldKey, label, sortOrder, fieldType, options },
    });
  }

  await upsertCustomField(CustomFieldEntity.MATERIAL, "chainStyle", "Chain Style", 0);
  await upsertCustomField(CustomFieldEntity.MATERIAL, "beadPattern", "Bead Pattern", 1);
  await upsertCustomField(CustomFieldEntity.MATERIAL, "purchaseLot", "Purchase Lot", 2);
  await upsertCustomField(CustomFieldEntity.MATERIAL, "status", "Status", 3, CustomFieldType.SELECT, [
    "In stock",
    "Incoming",
    "Received",
  ]);
  await upsertCustomField(CustomFieldEntity.MATERIAL, "invoiceRef", "Invoice Reference", 4);
  await upsertCustomField(CustomFieldEntity.MATERIAL, "supplierNotes", "Supplier Notes", 5);

  await upsertCustomField(CustomFieldEntity.PRODUCT, "style", "Style", 0);
  await upsertCustomField(CustomFieldEntity.PRODUCT, "material", "Material", 1);
  await upsertCustomField(CustomFieldEntity.PRODUCT, "slogan", "Slogan", 2);

  console.log("Seed complete: real supplier/material data loaded, no demo product created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
