export type StripCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
};

export type CategoriesPayload = {
  success?: boolean;
  data?: unknown;
};

const CACHE_TTL_MS = 60_000;

let cached: { categories: StripCategory[]; fetchedAt: number } | null = null;
let inflight: Promise<StripCategory[]> | null = null;

export function mapCategoryPayload(payload: unknown): StripCategory[] {
  const body = payload as CategoriesPayload | null;
  if (!body || body.success !== true || !Array.isArray(body.data)) {
    throw new Error('Unexpected categories payload');
  }

  return body.data
    .map((entry) => {
      const raw = entry as Partial<Record<string, unknown>> | null;
      if (!raw || typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.slug !== 'string') {
        return null;
      }
      return {
        id: raw.id,
        name: raw.name,
        slug: raw.slug,
        image: typeof raw.imageUrl === 'string' && raw.imageUrl.length > 0 ? raw.imageUrl : null,
      } satisfies StripCategory;
    })
    .filter((category): category is StripCategory => category !== null);
}

export function resetCategoryNavCache(): void {
  cached = null;
  inflight = null;
}

export function loadCategories(
  fetcher?: typeof fetch,
): Promise<StripCategory[]> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(cached.categories);
  }

  if (!inflight) {
    const request = fetcher
      ? fetcher('/api/categories')
      : globalThis.fetch('/api/categories');

    inflight = request
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Categories request failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((json: unknown) => {
        const categories = mapCategoryPayload(json);
        cached = { categories, fetchedAt: Date.now() };
        return categories;
      })
      .catch((error: unknown) => {
        if (cached) return cached.categories;
        throw error;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}
