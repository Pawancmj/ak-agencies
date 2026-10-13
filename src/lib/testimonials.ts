// Shared Testimonial helpers — imported by both server routes and the
// client homepage section, so this module must stay free of Prisma
// runtime imports (plain `as const` objects are passed to Prisma calls).

export interface TestimonialPublic {
  id: string;
  customerName: string;
  reviewText: string;
  customerImageUrl: string | null;
  productName: string | null;
  rating: number;
}

export interface TestimonialStats {
  averageRating: number;
  reviewCount: number;
}

// Public payload: only the fields the homepage renders (never admin-only
// flags such as isFeatured/isActive/displayOrder).
export const TESTIMONIAL_PUBLIC_SELECT = {
  id: true,
  customerName: true,
  reviewText: true,
  customerImageUrl: true,
  productName: true,
  rating: true,
} as const;

export const TESTIMONIAL_PUBLIC_WHERE = { isActive: true } as const;

export const TESTIMONIAL_PUBLIC_ORDER_BY = [
  { isFeatured: 'desc' },
  { displayOrder: 'asc' },
  { createdAt: 'desc' },
] as const;

export const TESTIMONIAL_ADMIN_ORDER_BY = [
  { displayOrder: 'asc' },
  { createdAt: 'asc' },
] as const;

export function computeTestimonialStats(
  testimonials: Array<{ rating: number }>,
): TestimonialStats {
  const reviewCount = testimonials.length;
  if (reviewCount === 0) return { averageRating: 0, reviewCount: 0 };

  const total = testimonials.reduce((sum, t) => sum + t.rating, 0);
  const averageRating = Math.round((total / reviewCount) * 10) / 10;

  return { averageRating, reviewCount };
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export function nextTestimonialIndex(current: number, length: number): number {
  return clampIndex(current + 1, length);
}

export function prevTestimonialIndex(current: number, length: number): number {
  return clampIndex(current - 1, length);
}

// Rotating window of up to `visibleCount` cards starting at `current`.
// For length >= 3 this matches the original desktop carousel exactly;
// for length 1-2 it no longer renders duplicate cards.
export function getVisibleWindow<T>(
  items: T[],
  current: number,
  visibleCount = 3,
): T[] {
  if (items.length === 0) return [];
  const start = clampIndex(current, items.length);
  const count = Math.min(visibleCount, items.length);
  const window: T[] = [];
  for (let i = 0; i < count; i++) {
    window.push(items[(start + i) % items.length]);
  }
  return window;
}
