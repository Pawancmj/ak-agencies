import { describe, it, expect } from 'vitest';
import {
  parseFabricsResponse,
  parseColorsResponse,
} from '@/lib/custom-order-fabrics';

describe('parseFabricsResponse (Custom Order Step 2 payload)', () => {
  it('parses a valid fabrics payload from GET /api/custom-order/fabrics', () => {
    const result = parseFabricsResponse({
      success: true,
      data: [
        { id: 'cof_seed_cotton', name: 'Cotton', slug: 'cotton', imageUrl: null, displayOrder: 1 },
        { id: 'cof_seed_silk', name: 'Silk', slug: 'silk', imageUrl: '/uploads/silk.jpg', displayOrder: 2 },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fabrics).toHaveLength(2);
      expect(result.fabrics[0]).toEqual({
        id: 'cof_seed_cotton',
        name: 'Cotton',
        slug: 'cotton',
        imageUrl: null,
        displayOrder: 1,
      });
      expect(result.fabrics[1].imageUrl).toBe('/uploads/silk.jpg');
    }
  });

  it('keeps server ordering (displayOrder asc)', () => {
    const result = parseFabricsResponse({
      success: true,
      data: [
        { id: 'f1', name: 'Cotton', slug: 'cotton', displayOrder: 1 },
        { id: 'f2', name: 'Silk', slug: 'silk', displayOrder: 2 },
        { id: 'f3', name: 'Linen', slug: 'linen', displayOrder: 3 },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fabrics.map((f) => f.name)).toEqual(['Cotton', 'Silk', 'Linen']);
    }
  });

  it('drops entries without an id or name', () => {
    const result = parseFabricsResponse({
      success: true,
      data: [
        { id: '', name: 'Cotton', slug: 'cotton' },
        { id: 'f2', name: '   ', slug: 'silk' },
        { id: 'f3', name: 'Linen', slug: 'linen' },
        'not-an-object',
        null,
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fabrics.map((f) => f.name)).toEqual(['Linen']);
    }
  });

  it('treats missing/blank imageUrl as null and bad displayOrder as 0', () => {
    const result = parseFabricsResponse({
      success: true,
      data: [{ id: 'f1', name: 'Cotton', slug: 'cotton', imageUrl: '  ', displayOrder: 'x' }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fabrics[0].imageUrl).toBeNull();
      expect(result.fabrics[0].displayOrder).toBe(0);
    }
  });

  it('returns ok:false for an error payload', () => {
    expect(parseFabricsResponse({ success: false, error: 'boom' }).ok).toBe(false);
  });

  it('returns ok:false for malformed payloads', () => {
    expect(parseFabricsResponse(null).ok).toBe(false);
    expect(parseFabricsResponse(undefined).ok).toBe(false);
    expect(parseFabricsResponse('nope').ok).toBe(false);
    expect(parseFabricsResponse({ success: true }).ok).toBe(false);
    expect(parseFabricsResponse({ success: true, data: 'not-array' }).ok).toBe(false);
  });
});

describe('parseColorsResponse (Custom Order Step 3 payload)', () => {
  it('parses a valid colors payload scoped to a fabric', () => {
    const result = parseColorsResponse({
      success: true,
      data: [
        { id: 'c1', fabricId: 'cof_seed_cotton', name: 'White', imageUrl: '/uploads/white.jpg', displayOrder: 1 },
        { id: 'c2', fabricId: 'cof_seed_cotton', name: 'Sky Blue', imageUrl: null, displayOrder: 2 },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.colors).toHaveLength(2);
      expect(result.colors[0].fabricId).toBe('cof_seed_cotton');
      expect(result.colors[1].name).toBe('Sky Blue');
    }
  });

  it('drops entries missing a fabricId (cannot be attributed to a fabric)', () => {
    const result = parseColorsResponse({
      success: true,
      data: [
        { id: 'c1', fabricId: 'cof_seed_cotton', name: 'White' },
        { id: 'c2', name: 'Orphan' },
        { id: 'c3', fabricId: 'cof_seed_cotton', name: 'Cream' },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.colors.map((c) => c.name)).toEqual(['White', 'Cream']);
    }
  });

  it('returns ok:false for an error payload', () => {
    expect(parseColorsResponse({ success: false, error: 'boom' }).ok).toBe(false);
  });

  it('returns ok:false for malformed payloads', () => {
    expect(parseColorsResponse(null).ok).toBe(false);
    expect(parseColorsResponse({ success: true, data: 42 }).ok).toBe(false);
  });
});
