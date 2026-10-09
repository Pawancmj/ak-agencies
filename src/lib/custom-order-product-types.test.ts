import { describe, it, expect } from 'vitest';
import { parseProductTypesResponse } from '@/lib/custom-order-product-types';

describe('parseProductTypesResponse', () => {
  it('parses a valid API response preserving order', () => {
    const result = parseProductTypesResponse({
      success: true,
      data: [
        { id: 'c1', name: 'Curtains', slug: 'curtains', description: null, displayOrder: 1 },
        { id: 'c7', name: 'Other', slug: 'other', description: null, displayOrder: 7 },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.types).toHaveLength(2);
      expect(result.types[0].name).toBe('Curtains');
      expect(result.types[1].name).toBe('Other');
    }
  });

  it('returns empty list for a valid response with no active types', () => {
    const result = parseProductTypesResponse({ success: true, data: [] });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.types).toHaveLength(0);
  });

  it('rejects error payloads from the API', () => {
    const result = parseProductTypesResponse({
      success: false,
      error: 'Failed to fetch product types',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects payloads where data is not an array', () => {
    expect(parseProductTypesResponse({ success: true, data: 'oops' }).ok).toBe(false);
    expect(parseProductTypesResponse({ success: true }).ok).toBe(false);
  });

  it('rejects non-object payloads', () => {
    expect(parseProductTypesResponse(null).ok).toBe(false);
    expect(parseProductTypesResponse(undefined).ok).toBe(false);
    expect(parseProductTypesResponse('string').ok).toBe(false);
  });

  it('skips entries without a valid id or name', () => {
    const result = parseProductTypesResponse({
      success: true,
      data: [
        { id: 'c1', name: 'Curtains', slug: 'curtains', description: null, displayOrder: 1 },
        { name: 'Missing Id', slug: 'missing-id' },
        { id: 'c2' },
        { id: '', name: 'Empty Id' },
        { id: 'c3', name: '   ' },
        null,
        42,
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.types).toHaveLength(1);
      expect(result.types[0].name).toBe('Curtains');
    }
  });

  it('coerces malformed optional fields to safe defaults', () => {
    const result = parseProductTypesResponse({
      success: true,
      data: [{ id: 'c1', name: 'Towel', displayOrder: 'seven', description: 123 }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.types[0].slug).toBe('');
      expect(result.types[0].displayOrder).toBe(0);
      expect(result.types[0].description).toBeNull();
    }
  });
});
