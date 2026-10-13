import { describe, it, expect } from 'vitest';
import {
  TESTIMONIAL_PUBLIC_ORDER_BY,
  TESTIMONIAL_PUBLIC_SELECT,
  TESTIMONIAL_PUBLIC_WHERE,
  clampIndex,
  computeTestimonialStats,
  getVisibleWindow,
  nextTestimonialIndex,
  prevTestimonialIndex,
} from '@/lib/testimonials';

describe('computeTestimonialStats', () => {
  it('returns zero stats when there are no testimonials', () => {
    expect(computeTestimonialStats([])).toEqual({
      averageRating: 0,
      reviewCount: 0,
    });
  });

  it('averages a single testimonial', () => {
    expect(computeTestimonialStats([{ rating: 5 }])).toEqual({
      averageRating: 5,
      reviewCount: 1,
    });
  });

  it('rounds the average to one decimal place', () => {
    expect(
      computeTestimonialStats([{ rating: 5 }, { rating: 5 }, { rating: 4 }]),
    ).toEqual({ averageRating: 4.7, reviewCount: 3 });
  });

  it('computes an exact average for evenly divisible totals', () => {
    expect(
      computeTestimonialStats([
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
      ]),
    ).toEqual({ averageRating: 4.6, reviewCount: 5 });
  });

  it('keeps half-star averages exact', () => {
    expect(computeTestimonialStats([{ rating: 5 }, { rating: 4 }])).toEqual({
      averageRating: 4.5,
      reviewCount: 2,
    });
  });

  it('is not inflated by zero-length input', () => {
    expect(computeTestimonialStats([]).averageRating).toBe(0);
    expect(computeTestimonialStats([]).reviewCount).toBe(0);
  });
});

describe('clampIndex', () => {
  it('returns 0 for an empty list', () => {
    expect(clampIndex(3, 0)).toBe(0);
    expect(clampIndex(0, 0)).toBe(0);
  });

  it('wraps forward overflow', () => {
    expect(clampIndex(8, 8)).toBe(0);
    expect(clampIndex(10, 8)).toBe(2);
  });

  it('wraps backward underflow', () => {
    expect(clampIndex(-1, 8)).toBe(7);
    expect(clampIndex(-9, 8)).toBe(7);
  });

  it('keeps in-range indexes untouched', () => {
    expect(clampIndex(0, 8)).toBe(0);
    expect(clampIndex(7, 8)).toBe(7);
  });
});

describe('next/prevTestimonialIndex', () => {
  it('advances and wraps at the end', () => {
    expect(nextTestimonialIndex(0, 8)).toBe(1);
    expect(nextTestimonialIndex(7, 8)).toBe(0);
  });

  it('goes back and wraps at the start', () => {
    expect(prevTestimonialIndex(0, 8)).toBe(7);
    expect(prevTestimonialIndex(1, 8)).toBe(0);
  });

  it('stays put for a single testimonial', () => {
    expect(nextTestimonialIndex(0, 1)).toBe(0);
    expect(prevTestimonialIndex(0, 1)).toBe(0);
  });
});

describe('getVisibleWindow', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  it('returns the first three cards at index 0', () => {
    expect(getVisibleWindow(items, 0)).toEqual(['a', 'b', 'c']);
  });

  it('rotates around the end of the list', () => {
    expect(getVisibleWindow(items, 7)).toEqual(['h', 'a', 'b']);
  });

  it('clamps an out-of-range start index', () => {
    expect(getVisibleWindow(items, 9)).toEqual(['b', 'c', 'd']);
  });

  it('never duplicates cards when fewer than three exist', () => {
    expect(getVisibleWindow(['a', 'b'], 0)).toEqual(['a', 'b']);
    expect(getVisibleWindow(['a'], 0)).toEqual(['a']);
  });

  it('returns nothing for an empty list', () => {
    expect(getVisibleWindow([], 0)).toEqual([]);
  });
});

describe('public query contract', () => {
  it('selects only homepage fields', () => {
    expect(Object.keys(TESTIMONIAL_PUBLIC_SELECT).sort()).toEqual([
      'customerImageUrl',
      'customerName',
      'id',
      'productName',
      'rating',
      'reviewText',
    ]);
  });

  it('only ever exposes active testimonials', () => {
    expect(TESTIMONIAL_PUBLIC_WHERE).toEqual({ isActive: true });
  });

  it('pins featured first, then displayOrder, then newest first', () => {
    expect([...TESTIMONIAL_PUBLIC_ORDER_BY]).toEqual([
      { isFeatured: 'desc' },
      { displayOrder: 'asc' },
      { createdAt: 'desc' },
    ]);
  });
});
