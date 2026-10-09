-- CreateEnum
CREATE TYPE "MeasurementInputType" AS ENUM ('NUMBER', 'TEXT');

-- CreateTable
CREATE TABLE "custom_order_measurement_fields" (
    "id" TEXT NOT NULL,
    "productTypeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "description" TEXT,
    "inputType" "MeasurementInputType" NOT NULL DEFAULT 'NUMBER',
    "unit" TEXT,
    "placeholder" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_order_measurement_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_order_measurement_fields_productTypeId_isActive_idx" ON "custom_order_measurement_fields"("productTypeId", "isActive");

-- CreateIndex
CREATE INDEX "custom_order_measurement_fields_productTypeId_displayOrder_idx" ON "custom_order_measurement_fields"("productTypeId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "custom_order_measurement_fields_productTypeId_fieldKey_key" ON "custom_order_measurement_fields"("productTypeId", "fieldKey");

-- AddForeignKey
ALTER TABLE "custom_order_measurement_fields" ADD CONSTRAINT "custom_order_measurement_fields_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "custom_order_product_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

