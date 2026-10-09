export interface FabricOption {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  displayOrder: number;
}

export interface ColorOption {
  id: string;
  fabricId: string;
  name: string;
  imageUrl: string | null;
  displayOrder: number;
}

export type FabricsResult =
  | { ok: true; fabrics: FabricOption[] }
  | { ok: false };

export type ColorsResult =
  | { ok: true; colors: ColorOption[] }
  | { ok: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toDisplayOrder(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toImageUrl(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

/**
 * Parses the payload returned by GET /api/custom-order/fabrics.
 * Returns { ok: false } for malformed / error payloads so callers can
 * show a friendly error state instead of crashing.
 */
export function parseFabricsResponse(payload: unknown): FabricsResult {
  if (!isRecord(payload) || payload.success !== true || !Array.isArray(payload.data)) {
    return { ok: false };
  }

  const fabrics: FabricOption[] = [];

  for (const entry of payload.data) {
    if (!isRecord(entry)) continue;
    if (typeof entry.id !== 'string' || entry.id.length === 0) continue;
    if (typeof entry.name !== 'string' || entry.name.trim().length === 0) continue;

    fabrics.push({
      id: entry.id,
      name: entry.name,
      slug: typeof entry.slug === 'string' ? entry.slug : '',
      imageUrl: toImageUrl(entry.imageUrl),
      displayOrder: toDisplayOrder(entry.displayOrder),
    });
  }

  return { ok: true, fabrics };
}

/**
 * Parses the payload returned by
 * GET /api/custom-order/fabrics/[fabricId]/colors.
 */
export function parseColorsResponse(payload: unknown): ColorsResult {
  if (!isRecord(payload) || payload.success !== true || !Array.isArray(payload.data)) {
    return { ok: false };
  }

  const colors: ColorOption[] = [];

  for (const entry of payload.data) {
    if (!isRecord(entry)) continue;
    if (typeof entry.id !== 'string' || entry.id.length === 0) continue;
    if (typeof entry.fabricId !== 'string' || entry.fabricId.length === 0) continue;
    if (typeof entry.name !== 'string' || entry.name.trim().length === 0) continue;

    colors.push({
      id: entry.id,
      fabricId: entry.fabricId,
      name: entry.name,
      imageUrl: toImageUrl(entry.imageUrl),
      displayOrder: toDisplayOrder(entry.displayOrder),
    });
  }

  return { ok: true, colors };
}
