import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mapCategoryPayload,
  loadCategories,
  resetCategoryNavCache,
} from '@/lib/category-nav';

function payload(data: unknown) {
  return { success: true, data };
}

function okResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  resetCategoryNavCache();
});

describe('mapCategoryPayload', () => {
  it('maps API categories to strip categories with imageUrl', () => {
    const result = mapCategoryPayload(
      payload([
        { id: 'c1', name: 'Curtains', slug: 'curtains', imageUrl: 'https://images.unsplash.com/x.jpg' },
        { id: 'c2', name: 'Towels', slug: 'towels', imageUrl: null },
      ]),
    );

    expect(result).toEqual([
      { id: 'c1', name: 'Curtains', slug: 'curtains', image: 'https://images.unsplash.com/x.jpg' },
      { id: 'c2', name: 'Towels', slug: 'towels', image: null },
    ]);
  });

  it('treats a missing or empty imageUrl as no image (fallback icon)', () => {
    const result = mapCategoryPayload(
      payload([
        { id: 'c1', name: 'A', slug: 'a' },
        { id: 'c2', name: 'B', slug: 'b', imageUrl: '' },
      ]),
    );

    expect(result.map((c) => c.image)).toEqual([null, null]);
  });

  it('returns an empty list for an empty category set', () => {
    expect(mapCategoryPayload(payload([]))).toEqual([]);
  });

  it('drops malformed entries instead of crashing', () => {
    const result = mapCategoryPayload(
      payload([
        null,
        { id: 'c1' },
        { name: 'No id', slug: 'x' },
        { id: 'c9', name: 'Valid', slug: 'valid' },
      ]),
    );

    expect(result).toEqual([
      { id: 'c9', name: 'Valid', slug: 'valid', image: null },
    ]);
  });

  it('rejects payloads that are not successful responses', () => {
    expect(() => mapCategoryPayload(null)).toThrow();
    expect(() => mapCategoryPayload({ success: false, data: [] })).toThrow();
    expect(() => mapCategoryPayload({ success: true })).toThrow();
    expect(() => mapCategoryPayload({ success: true, data: 'nope' })).toThrow();
  });
});

describe('loadCategories', () => {
  it('fetches, maps, and caches categories', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      okResponse(payload([{ id: 'c1', name: 'Curtains', slug: 'curtains', imageUrl: '/img.jpg' }])),
    );

    const first = await loadCategories(fetcher);
    const second = await loadCategories(fetcher);

    expect(first).toEqual([
      { id: 'c1', name: 'Curtains', slug: 'curtains', image: '/img.jpg' },
    ]);
    expect(second).toEqual(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent requests into a single fetch', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse(payload([])));

    await Promise.all([loadCategories(fetcher), loadCategories(fetcher), loadCategories(fetcher)]);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('rejects when the API responds with an error status', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false }),
    } as Response);

    await expect(loadCategories(fetcher)).rejects.toThrow();
  });

  it('rejects when the payload is malformed', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse({ unexpected: true }));

    await expect(loadCategories(fetcher)).rejects.toThrow();
  });

  it('retries with a fresh request after a failure', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response)
      .mockResolvedValueOnce(okResponse(payload([])));

    await expect(loadCategories(fetcher)).rejects.toThrow();
    await expect(loadCategories(fetcher)).resolves.toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('serves stale cache when a refresh fails', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse(payload([])));
    await loadCategories(fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Force staleness by rewinding the cached timestamp.
    vi.useFakeTimers();
    try {
      vi.setSystemTime(Date.now() + 120_000);
      const staleFetch = vi.fn().mockRejectedValue(new Error('network down'));
      await expect(loadCategories(staleFetch)).resolves.toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});
