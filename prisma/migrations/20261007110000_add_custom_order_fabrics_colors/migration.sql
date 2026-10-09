-- CreateTable
CREATE TABLE "custom_order_fabrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_order_fabrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_order_colors" (
    "id" TEXT NOT NULL,
    "fabricId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_order_colors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_order_fabrics_slug_key" ON "custom_order_fabrics"("slug");

-- CreateIndex
CREATE INDEX "custom_order_fabrics_isActive_idx" ON "custom_order_fabrics"("isActive");

-- CreateIndex
CREATE INDEX "custom_order_fabrics_displayOrder_idx" ON "custom_order_fabrics"("displayOrder");

-- CreateIndex
CREATE INDEX "custom_order_colors_fabricId_idx" ON "custom_order_colors"("fabricId");

-- CreateIndex
CREATE INDEX "custom_order_colors_fabricId_isActive_idx" ON "custom_order_colors"("fabricId", "isActive");

-- AddForeignKey
ALTER TABLE "custom_order_colors" ADD CONSTRAINT "custom_order_colors_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "custom_order_fabrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the existing hardcoded Custom Order fabric options (idempotent: ON
-- CONFLICT DO NOTHING): Cotton, Silk, Velvet, Linen, Polyester, Chiffon,
-- Net, Other. imageUrl is NULL — no external image URLs are invented;
-- admins upload images from Admin → Custom Orders → Fabrics, and the
-- customer page shows a placeholder until then.
INSERT INTO "custom_order_fabrics" ("id", "name", "slug", "imageUrl", "displayOrder", "isActive", "updatedAt")
VALUES
    ('cof_seed_cotton', 'Cotton', 'cotton', NULL, 1, true, CURRENT_TIMESTAMP),
    ('cof_seed_silk', 'Silk', 'silk', NULL, 2, true, CURRENT_TIMESTAMP),
    ('cof_seed_velvet', 'Velvet', 'velvet', NULL, 3, true, CURRENT_TIMESTAMP),
    ('cof_seed_linen', 'Linen', 'linen', NULL, 4, true, CURRENT_TIMESTAMP),
    ('cof_seed_polyester', 'Polyester', 'polyester', NULL, 5, true, CURRENT_TIMESTAMP),
    ('cof_seed_chiffon', 'Chiffon', 'chiffon', NULL, 6, true, CURRENT_TIMESTAMP),
    ('cof_seed_net', 'Net', 'net', NULL, 7, true, CURRENT_TIMESTAMP),
    ('cof_seed_other', 'Other', 'other', NULL, 8, true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
