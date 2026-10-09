export interface ProductTypeOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
}

export type ProductTypesResult =
  | { ok: true; types: ProductTypeOption[] }
  | { ok: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Parses the payload returned by GET /api/custom-orders/product-types.
 * Returns { ok: false } for malformed / error payloads so callers can
 * show a friendly error state instead of crashing.
 */
export function parseProductTypesResponse(payload: unknown): ProductTypesResult {
  if (!isRecord(payload) || payload.success !== true || !Array.isArray(payload.data)) {
    return { ok: false };
  }

  const types: ProductTypeOption[] = [];

  for (const entry of payload.data) {
    if (!isRecord(entry)) continue;
    if (typeof entry.id !== 'string' || entry.id.length === 0) continue;
    if (typeof entry.name !== 'string' || entry.name.trim().length === 0) continue;

    types.push({
      id: entry.id,
      name: entry.name,
      slug: typeof entry.slug === 'string' ? entry.slug : '',
      description:
        typeof entry.description === 'string'
          ? entry.description
          : null,
      displayOrder:
        typeof entry.displayOrder === 'number' && Number.isFinite(entry.displayOrder)
          ? entry.displayOrder
          : 0,
    });
  }

  return { ok: true, types };
}
