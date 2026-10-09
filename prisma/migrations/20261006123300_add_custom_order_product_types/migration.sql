-- CreateTable
CREATE TABLE "custom_order_product_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_order_product_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_order_product_types_slug_key" ON "custom_order_product_types"("slug");

-- CreateIndex
CREATE INDEX "custom_order_product_types_isActive_idx" ON "custom_order_product_types"("isActive");

-- CreateIndex
CREATE INDEX "custom_order_product_types_displayOrder_idx" ON "custom_order_product_types"("displayOrder");

-- Seed default Custom Order product types (idempotent: ON CONFLICT DO NOTHING)
-- Preserves the existing hardcoded options: Curtains, Sofa Cover, Bedsheet,
-- Cushion Cover, Table Cover, Towel, Other
INSERT INTO "custom_order_product_types" ("id", "name", "slug", "description", "displayOrder", "isActive", "updatedAt")
VALUES
    ('copt_seed_curtains', 'Curtains', 'curtains', NULL, 1, true, CURRENT_TIMESTAMP),
    ('copt_seed_sofa_cover', 'Sofa Cover', 'sofa-cover', NULL, 2, true, CURRENT_TIMESTAMP),
    ('copt_seed_bedsheet', 'Bedsheet', 'bedsheet', NULL, 3, true, CURRENT_TIMESTAMP),
    ('copt_seed_cushion_cover', 'Cushion Cover', 'cushion-cover', NULL, 4, true, CURRENT_TIMESTAMP),
    ('copt_seed_table_cover', 'Table Cover', 'table-cover', NULL, 5, true, CURRENT_TIMESTAMP),
    ('copt_seed_towel', 'Towel', 'towel', NULL, 6, true, CURRENT_TIMESTAMP),
    ('copt_seed_other', 'Other', 'other', NULL, 7, true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
