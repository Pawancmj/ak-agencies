-- Testimonials table for the homepage "What Our Customers Say" section.
-- Demo rows tst_demo_1..8 were migrated from the previously hardcoded
-- review list (src/data/products.ts). They are demo content: edit or
-- delete them anytime from /admin/testimonials (DELETE removes the row).

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "reviewText" TEXT NOT NULL,
    "customerImageUrl" TEXT,
    "productName" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "testimonials_isActive_displayOrder_idx" ON "testimonials"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "testimonials_isActive_isFeatured_idx" ON "testimonials"("isActive", "isFeatured");

-- Seed demo testimonials (no avatars: the original placeholder faces
-- were third-party pravatar URLs, dropped on purpose)
INSERT INTO "testimonials" ("id", "customerName", "reviewText", "customerImageUrl", "productName", "rating", "displayOrder", "isActive", "isFeatured", "createdAt", "updatedAt")
VALUES
  ('tst_demo_1', 'Priya Sharma', 'Absolutely love the quality of the curtains! The fabric is premium and the stitching is perfect. Will definitely order more.', NULL, 'Premium Floral Curtain', 5, 0, true, false, '2026-01-15 10:00:00', '2026-01-15 10:00:00'),
  ('tst_demo_2', 'Rahul Verma', 'The sofa cover transformed our old sofa into something new. Great quality and perfect fit. Highly recommended!', NULL, 'Luxury Velvet Sofa Cover', 5, 1, true, false, '2026-02-03 10:00:00', '2026-02-03 10:00:00'),
  ('tst_demo_3', 'Ananya Gupta', 'Beautiful bedsheet set with lovely print. The cotton quality is excellent. Delivery was also very fast.', NULL, 'Floral Cotton Bedsheet Set', 4, 2, true, false, '2026-02-20 10:00:00', '2026-02-20 10:00:00'),
  ('tst_demo_4', 'Vikram Singh', 'The carpet is stunning! Handwoven quality is evident. It has become the centerpiece of our living room.', NULL, 'Traditional Handwoven Carpet', 5, 3, true, false, '2026-03-05 10:00:00', '2026-03-05 10:00:00'),
  ('tst_demo_5', 'Meera Joshi', 'Excellent custom stitching service. They made curtains exactly as I wanted. Very professional team.', NULL, 'Custom Order - Curtains', 5, 4, true, false, '2026-03-12 10:00:00', '2026-03-12 10:00:00'),
  ('tst_demo_6', 'Arjun Patel', 'Great towel quality and the set was exactly as described. Good value for money. Will order again.', NULL, 'Luxury Bath Towel Set', 4, 5, true, false, '2026-04-01 10:00:00', '2026-04-01 10:00:00'),
  ('tst_demo_7', 'Neha Agarwal', 'The cushion covers are gorgeous. The embroidery work is beautiful and adds such elegance to our living room.', NULL, 'Designer Cushion Cover', 5, 6, true, false, '2026-04-18 10:00:00', '2026-04-18 10:00:00'),
  ('tst_demo_8', 'Sanjay Kumar', 'Amazing collection and excellent customer service. The velvet curtains are worth every penny. Premium quality!', NULL, 'Royal Velvet Curtain', 5, 7, true, false, '2026-05-02 10:00:00', '2026-05-02 10:00:00');
