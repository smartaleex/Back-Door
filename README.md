# Levendi's Back Door — Cost & SKU Manager

An internal tool for costing, quantities and SKU management across Back Door's
product lines (bracelets/jewellery today, hats and garments as they're added).
It's being built in phases — this covers Phase 1.

## What's built so far (Phase 1)

- **Materials** — chain, findings (pins/lobster claws/bead pins), beads, and
  fabric, each with a cost per unit. Chain and findings track metal (316L
  Gold / 316 Stainless Steel); beads track material (glass/pearl/opal),
  diameter, shape, and colour (including a second colour for dual-colour
  beads).
- **Suppliers** — name/contact/notes, plus per-material pricing and lead
  time. Mark one supplier "preferred" per material and that's the price used
  in costing.
- **Products / SKUs** — build a bill of materials (BOM) for each product from
  your materials, and cost, retail price and margin are computed live. Works
  for bracelets today and any future category (hats, garments) without code
  changes — categories are just a list you manage yourself.
- **Quantity calculator** — for any product, enter a target quantity and see
  the total raw materials needed and total production cost, ready to hand to
  a supplier or use for a purchasing decision.
- **Custom fields** — under Settings → Custom Fields, add your own fields to
  Materials, Products or Suppliers (text/number/checkbox/dropdown/date)
  without touching code. They show up in the relevant forms immediately.
  Example: Product custom fields for `style`, `material`, `slogan` are
  pre-seeded, ready for when hats get added as a category.
- **Dashboard** — product/material/supplier counts, average margin, and a
  list of products under 30% margin so low-profitability SKUs are easy to
  spot.

Costs use a **Decimal** type throughout (not floating point), so currency
math stays accurate. Prices display in AUD by default — change the locale in
`src/components/ui.tsx` (`formatCurrency`) if you sell in a different
currency.

## Not built yet (later phases, in the order they were raised)

Roughly the order these matter, but nothing here is committed to — tell me
which to tackle next and I'll pick that one up:

1. Shipping & packaging costs (own cost inputs, and roll into product cost)
2. Inventory: stock on hand tracking + reorder alerts (the DB fields already
   exist on Material and Product — `stockOnHand` / `reorderAt` /
   `inventoryGoal` — the calculator already shows shortfalls if you fill
   `stockOnHand` in; a proper "receive stock" / "adjust stock" UI is next)
3. Lead time roll-up to an estimated delivery date per order
4. Store tax invoices (GST, invoice numbering, PDF export)
5. Catalog images per SKU (currently just a URL field — swap for real image
   upload once decided where images live, e.g. Supabase Storage)
6. Multi-supplier lead-time comparison / reordering workflow

## Tech stack

- **Next.js 16** (App Router, Server Actions) + TypeScript + Tailwind CSS
- **PostgreSQL** via **Prisma ORM 7** (driver adapter: `@prisma/adapter-pg`)
- No auth yet — this is a single-operator internal tool. If it ever needs
  more than one login, that's a small addition on top of this.

## Local development

Requires Node 22+ and a Postgres database (local or cloud).

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL
npx prisma migrate dev # creates tables
npx prisma db seed     # loads starter data (see prisma/seed.ts)
npm run dev
```

Open http://localhost:3000.

### Running against a local Postgres

If you have Postgres installed locally:

```bash
createdb backdoor
# .env: DATABASE_URL="postgresql://<user>:<password>@localhost:5432/backdoor?schema=public"
```

## Cloud setup (Supabase)

You chose cloud-hosted from day one, so here's the fastest path:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, go to **Project Settings → Database → Connection string**.
3. For `prisma migrate` / `prisma db seed`, use the **direct connection**
   (port `5432`) — connection poolers don't support the schema-altering SQL
   Migrate needs:
   ```
   postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
   ```
4. For the deployed app itself, use the pooled **"Transaction" connection**
   (port `6543`) — better suited to serverless hosting (e.g. Vercel):
   ```
   postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. Put the direct URL in `.env` locally, run migrations + seed once against
   it, then set the pooled URL as `DATABASE_URL` in your hosting provider's
   environment variables for the live app.

## Editing structure vs. editing fields

Two ways to change what the app tracks, matching how you said you want to
work:

- **Bigger changes** (new entity types, new relationships, new pages) — ask
  me and I'll add them properly, including a database migration.
- **New fields on existing things** — use **Settings → Custom Fields**
  yourself, no need to ask. Pick which entity (Material/Product/Supplier),
  give it a label and a type, and it appears in that entity's form right
  away.

## Project structure

```
prisma/schema.prisma      Database schema
prisma/seed.ts            Starter data (chain/finding/bead materials, one sample bracelet SKU)
src/lib/prisma.ts         Prisma client singleton
src/lib/costing.ts        Cost/margin + bulk-quantity calculations
src/lib/customFields.ts   Custom field definitions (server-side, DB-backed)
src/app/materials/        Materials CRUD
src/app/suppliers/        Suppliers CRUD
src/app/products/         Products/SKUs, BOM builder, quantity calculator, categories
src/app/settings/         Custom fields admin
```
