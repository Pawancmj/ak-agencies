import { z } from 'zod';

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(12),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;

// ─── Auth Schemas ─────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  phone: z.string().max(20).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Address Schemas ──────────────────────────────────────────

export const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100).trim(),
  phone: z.string().min(1, 'Phone number is required').max(20).trim(),
  addressLine1: z.string().min(1, 'Address is required').max(200).trim(),
  addressLine2: z.string().max(200).trim().optional(),
  city: z.string().min(1, 'City is required').max(100).trim(),
  state: z.string().min(1, 'State is required').max(100).trim(),
  postalCode: z.string().min(1, 'Postal code is required').max(10).trim(),
  country: z.string().min(1, 'Country is required').max(50).trim().default('India'),
  isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ─── Admin Product Schemas ───────────────────────────────────

export const adminProductImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1, 'Image URL is required').max(2000).trim(),
  alt: z.string().max(200).trim().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

export const adminProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  slug: z.string().min(1, 'Slug is required').max(200).trim(),
  shortDescription: z.string().max(500).trim().optional(),
  description: z.string().max(5000).trim().optional(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  badge: z.string().max(50).trim().optional().nullable(),
  inStock: z.boolean().optional().default(true),
  stockQuantity: z.coerce.number().int().min(0, 'Stock must be non-negative').optional().default(0),
  material: z.string().max(200).trim().optional().nullable(),
  colors: z.array(z.string().max(50)).optional().default([]),
  sizes: z.array(z.string().max(50)).optional().default([]),
  fabrics: z.array(z.string().max(50)).optional().default([]),
  features: z.array(z.string().max(200)).optional().default([]),
  careInstructions: z.string().max(1000).trim().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  isActive: z.boolean().optional().default(true),
  images: z.array(adminProductImageSchema).max(20, 'Maximum 20 images allowed').optional(),
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;

export const adminCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  slug: z.string().min(1, 'Slug is required').max(100).trim(),
  description: z.string().max(500).trim().optional().nullable(),
  imageUrl: z.string().max(500).trim().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;

export const adminOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export type AdminOrderStatusInput = z.infer<typeof adminOrderStatusSchema>;

// ─── Contact Submission Schemas ───────────────────────────────

export const contactSubmissionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .refine((v) => v.length > 0, 'Name cannot be empty or whitespace'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone must be at most 20 characters')
    .trim()
    .refine((v) => v.length > 0, 'Phone cannot be empty or whitespace')
    .refine(
      (v) => /^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')),
      'Please enter a valid Indian phone number',
    ),
  email: z
    .string()
    .max(200, 'Email must be at most 200 characters')
    .trim()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Please enter a valid email address'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be at most 200 characters')
    .trim()
    .refine((v) => v.length > 0, 'Subject cannot be empty or whitespace'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be at most 2000 characters')
    .trim()
    .refine((v) => v.length > 0, 'Message cannot be empty or whitespace'),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;

export const adminContactStatusSchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']),
});

export type AdminContactStatusInput = z.infer<typeof adminContactStatusSchema>;

// ─── Custom Order Product Type Schemas ──────────────────────

export const customOrderProductTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .refine((v) => v.length > 0, 'Name cannot be empty or whitespace'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .trim()
    .refine((v) => v.length > 0, 'Slug cannot be empty or whitespace')
    .refine(
      (v) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v),
      'Slug must contain only lowercase letters, numbers, and hyphens',
    ),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .nullable(),
  displayOrder: z.coerce
    .number()
    .int('Display order must be a whole number')
    .min(0, 'Display order must be non-negative')
    .max(9999, 'Display order must be at most 9999')
    .optional()
    .default(0),
  isActive: z.boolean().optional().default(true),
});

export type CustomOrderProductTypeInput = z.infer<typeof customOrderProductTypeSchema>;

// ─── Custom Order Fabric / Color Schemas ─────────────────────

const customOrderNameField = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters')
  .trim()
  .refine((v) => v.length > 0, 'Name cannot be empty or whitespace');

const customOrderImageField = z
  .string()
  .min(1, 'Image URL is required')
  .max(2000, 'Image URL must be at most 2000 characters')
  .trim()
  .refine((v) => v.length > 0, 'Image URL cannot be empty or whitespace');

const customOrderDisplayOrderField = z.coerce
  .number()
  .int('Display order must be a whole number')
  .min(0, 'Display order must be non-negative')
  .max(9999, 'Display order must be at most 9999')
  .optional()
  .default(0);

const customOrderActiveField = z.boolean().optional().default(true);

export const customOrderFabricSchema = z.object({
  name: customOrderNameField,
  imageUrl: customOrderImageField,
  displayOrder: customOrderDisplayOrderField,
  isActive: customOrderActiveField,
});

export type CustomOrderFabricInput = z.infer<typeof customOrderFabricSchema>;

// PATCH variant: every field optional and NO defaults — Zod 4 .partial()
// keeps schema defaults (displayOrder: 0) injected, which would let a
// missing key overwrite existing DB values on partial updates. imageUrl may
// be null to clear it (the DB column is nullable) while '' is still rejected.
export const customOrderFabricUpdateSchema = z.object({
  name: customOrderNameField.optional(),
  imageUrl: customOrderImageField.nullable().optional(),
  displayOrder: z.coerce
    .number()
    .int('Display order must be a whole number')
    .min(0, 'Display order must be non-negative')
    .max(9999, 'Display order must be at most 9999')
    .optional(),
  isActive: z.boolean().optional(),
});

export type CustomOrderFabricUpdateInput = z.infer<typeof customOrderFabricUpdateSchema>;

export const customOrderColorSchema = z.object({
  fabricId: z
    .string()
    .min(1, 'Fabric is required')
    .max(100, 'Fabric ID must be at most 100 characters')
    .trim()
    .refine((v) => v.length > 0, 'Fabric is required'),
  name: customOrderNameField,
  imageUrl: customOrderImageField,
  displayOrder: customOrderDisplayOrderField,
  isActive: customOrderActiveField,
});

export type CustomOrderColorInput = z.infer<typeof customOrderColorSchema>;

// Same default-free rules as customOrderFabricUpdateSchema (see above).
export const customOrderColorUpdateSchema = z.object({
  fabricId: z.string().min(1).max(100).trim().optional(),
  name: customOrderNameField.optional(),
  imageUrl: customOrderImageField.nullable().optional(),
  displayOrder: z.coerce
    .number()
    .int('Display order must be a whole number')
    .min(0, 'Display order must be non-negative')
    .max(9999, 'Display order must be at most 9999')
    .optional(),
  isActive: z.boolean().optional(),
});

export type CustomOrderColorUpdateInput = z.infer<typeof customOrderColorUpdateSchema>;

// ─── Custom Order Measurement Field Schemas ─────────────────

const measurementLabelField = z
  .string()
  .min(1, 'Label is required')
  .max(100, 'Label must be at most 100 characters')
  .trim()
  .refine((v) => v.length > 0, 'Label cannot be empty or whitespace');

const measurementFieldKeyField = z
  .string()
  .min(1, 'Field key is required')
  .max(50, 'Field key must be at most 50 characters')
  .trim()
  .refine((v) => v.length > 0, 'Field key cannot be empty')
  .refine(
    (v) => /^[a-z0-9]+(_[a-z0-9]+)*$/.test(v),
    'Field key must be lowercase letters, numbers, and underscores only (no spaces)',
  );

// HTML number inputs hand back strings; '' means "cleared" → undefined
// (unset) rather than 0. z.coerce.number() would turn null into 0, which
// would silently overwrite an existing min/max with 0 on PATCH.
const measurementBoundField = z.preprocess((value) => {
  if (value === '' || value === undefined) return undefined;
  if (value === null || typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
}, z.number().nullable().optional());

const measurementRangeCheck = (data: {
  minValue?: number | null;
  maxValue?: number | null;
}) =>
  !(
    data.minValue != null &&
    data.maxValue != null &&
    data.minValue > data.maxValue
  );

const measurementRangeMessage = 'Minimum value cannot exceed maximum value';

export const customOrderMeasurementFieldSchema = z
  .object({
    label: measurementLabelField,
    // Optional: the server derives it from the label when omitted
    // ("Seat Depth" → seat_depth) so admins only need to fill the label.
    fieldKey: measurementFieldKeyField.optional(),
    description: z
      .string()
      .max(500, 'Description must be at most 500 characters')
      .trim()
      .optional()
      .nullable(),
    inputType: z.enum(['NUMBER', 'TEXT']).optional().default('NUMBER'),
    unit: z
      .string()
      .max(20, 'Unit must be at most 20 characters')
      .trim()
      .optional()
      .nullable(),
    placeholder: z
      .string()
      .max(200, 'Placeholder must be at most 200 characters')
      .trim()
      .optional()
      .nullable(),
    displayOrder: z.coerce
      .number()
      .int('Display order must be a whole number')
      .min(0, 'Display order must be non-negative')
      .max(9999, 'Display order must be at most 9999')
      .optional()
      .default(0),
    isRequired: z.boolean().optional().default(true),
    minValue: measurementBoundField,
    maxValue: measurementBoundField,
    isActive: z.boolean().optional().default(true),
  })
  .refine(measurementRangeCheck, {
    message: measurementRangeMessage,
    path: ['minValue'],
  });

export type CustomOrderMeasurementFieldInput = z.infer<
  typeof customOrderMeasurementFieldSchema
>;

// PATCH variant: every field optional and NO defaults — schema defaults
// must never overwrite existing DB values on partial updates (see
// customOrderFabricUpdateSchema above). productTypeId is intentionally
// absent so a field can never be moved to another product type.
export const customOrderMeasurementFieldUpdateSchema = z
  .object({
    label: measurementLabelField.optional(),
    fieldKey: measurementFieldKeyField.optional(),
    description: z
      .string()
      .max(500, 'Description must be at most 500 characters')
      .trim()
      .optional()
      .nullable(),
    inputType: z.enum(['NUMBER', 'TEXT']).optional(),
    unit: z
      .string()
      .max(20, 'Unit must be at most 20 characters')
      .trim()
      .optional()
      .nullable(),
    placeholder: z
      .string()
      .max(200, 'Placeholder must be at most 200 characters')
      .trim()
      .optional()
      .nullable(),
    displayOrder: z.coerce
      .number()
      .int('Display order must be a whole number')
      .min(0, 'Display order must be non-negative')
      .max(9999, 'Display order must be at most 9999')
      .optional(),
    isRequired: z.boolean().optional(),
    minValue: measurementBoundField,
    maxValue: measurementBoundField,
    isActive: z.boolean().optional(),
  })
  .refine(measurementRangeCheck, {
    message: measurementRangeMessage,
    path: ['minValue'],
  });

export type CustomOrderMeasurementFieldUpdateInput = z.infer<
  typeof customOrderMeasurementFieldUpdateSchema
>;

// Body schema for POST /api/custom-order/measurements/validate — the
// server-side gate that checks a submission against the live config.
export const customOrderMeasurementSubmitSchema = z.object({
  productTypeId: z
    .string()
    .min(1, 'Product type is required')
    .max(100, 'Product type must be at most 100 characters')
    .trim(),
  measurements: z.record(z.string(), z.unknown()),
});

export type CustomOrderMeasurementSubmitInput = z.infer<
  typeof customOrderMeasurementSubmitSchema
>;

// ─── Testimonial Schemas ─────────────────────────────────────
// Homepage "What Our Customers Say" content, managed from
// /admin/testimonials and served publicly by GET /api/testimonials.

const testimonialNameField = z
  .string()
  .min(1, 'Customer name is required')
  .max(100, 'Customer name must be at most 100 characters')
  .trim()
  .refine((v) => v.length > 0, 'Customer name cannot be empty or whitespace');

const testimonialReviewField = z
  .string()
  .min(1, 'Review is required')
  .max(1000, 'Review must be at most 1000 characters')
  .trim()
  .refine((v) => v.length > 0, 'Review cannot be empty or whitespace');

const testimonialRatingField = z.coerce
  .number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5');

const testimonialDisplayOrderField = z.coerce
  .number()
  .int('Display order must be a whole number')
  .min(0, 'Display order must be non-negative')
  .max(9999, 'Display order must be at most 9999')
  .optional()
  .default(0);

export const testimonialSchema = z.object({
  customerName: testimonialNameField,
  reviewText: testimonialReviewField,
  // '' is rejected, null/undefined clears it (avatar is optional)
  customerImageUrl: customOrderImageField.nullable().optional(),
  productName: z
    .string()
    .max(200, 'Product name must be at most 200 characters')
    .trim()
    .optional()
    .nullable(),
  rating: testimonialRatingField.optional().default(5),
  displayOrder: testimonialDisplayOrderField,
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;

// PATCH variant: every field optional and NO defaults — schema defaults
// must never overwrite existing DB values on partial updates (see
// customOrderFabricUpdateSchema above).
export const testimonialUpdateSchema = z.object({
  customerName: testimonialNameField.optional(),
  reviewText: testimonialReviewField.optional(),
  customerImageUrl: customOrderImageField.nullable().optional(),
  productName: z
    .string()
    .max(200, 'Product name must be at most 200 characters')
    .trim()
    .optional()
    .nullable(),
  rating: testimonialRatingField.optional(),
  displayOrder: z.coerce
    .number()
    .int('Display order must be a whole number')
    .min(0, 'Display order must be non-negative')
    .max(9999, 'Display order must be at most 9999')
    .optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>;
