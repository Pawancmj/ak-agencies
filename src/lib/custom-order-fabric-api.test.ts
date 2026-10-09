import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customOrderFabric: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customOrderColor: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { GET as publicFabricsGET } from '@/app/api/custom-order/fabrics/route';
import { GET as publicColorsGET } from '@/app/api/custom-order/fabrics/[fabricId]/colors/route';
import {
  GET as adminFabricsGET,
  POST as adminFabricsPOST,
} from '@/app/api/admin/custom-order/fabrics/route';
import {
  GET as fabricGET,
  PATCH as fabricPATCH,
  DELETE as fabricDELETE,
} from '@/app/api/admin/custom-order/fabrics/[fabricId]/route';
import {
  GET as adminColorsGET,
  POST as adminColorsPOST,
} from '@/app/api/admin/custom-order/fabrics/[fabricId]/colors/route';
import {
  GET as colorGET,
  PATCH as colorPATCH,
  DELETE as colorDELETE,
} from '@/app/api/admin/custom-order/colors/[id]/route';

const mockedRequireAdmin = vi.mocked(requireAdmin);

type MockFn = ReturnType<typeof vi.fn>;

const fabricDb = prisma.customOrderFabric as unknown as Record<
  'findMany' | 'findUnique' | 'findFirst' | 'create' | 'update' | 'delete',
  MockFn
>;
const colorDb = prisma.customOrderColor as unknown as Record<
  'findMany' | 'findUnique' | 'findFirst' | 'create' | 'update' | 'delete',
  MockFn
>;

const adminSession = {
  session: {
    userId: 'user-1',
    email: 'admin@example.com',
    role: 'ADMIN',
    name: 'Admin',
  },
};

const now = new Date('2026-10-07T10:00:00.000Z');

const cottonRecord = {
  id: 'cof_seed_cotton',
  name: 'Cotton',
  slug: 'cotton',
  imageUrl: null,
  displayOrder: 1,
  isActive: true,
  createdAt: now,
  updatedAt: now,
  _count: { colors: 3 },
};

const silkRecord = {
  id: 'cof_seed_silk',
  name: 'Silk',
  slug: 'silk',
  imageUrl: '/uploads/silk.jpg',
  displayOrder: 2,
  isActive: false,
  createdAt: now,
  updatedAt: now,
  _count: { colors: 0 },
};

const whiteColorRecord = {
  id: 'col_white',
  fabricId: 'cof_seed_cotton',
  name: 'White',
  imageUrl: '/uploads/white.jpg',
  displayOrder: 1,
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as unknown as NextRequest;
}

function jsonRequest(url: string, method: string, body: unknown): NextRequest {
  return makeRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function fabricParams() {
  return { params: Promise.resolve({ fabricId: 'cof_seed_cotton' }) };
}

function colorParams() {
  return { params: Promise.resolve({ id: 'col_white' }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedRequireAdmin.mockResolvedValue(adminSession);
});

// ─── Public APIs ─────────────────────────────────────────────

describe('GET /api/custom-order/fabrics (public)', () => {
  it('lists only active fabrics sorted by displayOrder asc', async () => {
    fabricDb.findMany.mockResolvedValue([
      { id: 'cof_seed_cotton', name: 'Cotton', slug: 'cotton', imageUrl: null, displayOrder: 1 },
      { id: 'cof_seed_silk', name: 'Silk', slug: 'silk', imageUrl: '/uploads/silk.jpg', displayOrder: 2 },
    ]);

    const res = await publicFabricsGET();
    const json = await res.json();

    expect(fabricDb.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' },
    });
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].name).toBe('Cotton');
  });

  it('never exposes inactive fabrics (filtered by isActive: true)', async () => {
    // The database only returns rows matching the where clause, so the
    // public payload can never contain a deactivated fabric.
    fabricDb.findMany.mockResolvedValue([
      { id: 'cof_seed_cotton', name: 'Cotton', slug: 'cotton', imageUrl: null, displayOrder: 1 },
    ]);

    const res = await publicFabricsGET();
    const json = await res.json();

    const call = fabricDb.findMany.mock.calls[0][0];
    expect(call.where).toEqual({ isActive: true });
    expect(json.data.every((f: { isActive?: boolean }) => f.isActive === undefined)).toBe(true);
    expect(JSON.stringify(json)).not.toContain('isActive');
  });

  it('returns a friendly error without leaking database details on failure', async () => {
    fabricDb.findMany.mockRejectedValue(new Error('connection pool exploded'));

    const res = await publicFabricsGET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ success: false, error: 'Failed to fetch fabrics' });
    expect(JSON.stringify(json)).not.toContain('connection pool');
  });
});

describe('GET /api/custom-order/fabrics/[fabricId]/colors (public)', () => {
  it('returns 404 for an unknown fabric', async () => {
    fabricDb.findUnique.mockResolvedValue(null);

    const res = await publicColorsGET(makeRequest('http://localhost/x'), fabricParams());
    expect(res.status).toBe(404);
    expect(colorDb.findMany).not.toHaveBeenCalled();
  });

  it('returns 404 for a deactivated fabric', async () => {
    fabricDb.findUnique.mockResolvedValue({ id: 'cof_seed_silk', isActive: false });

    const res = await publicColorsGET(makeRequest('http://localhost/x'), fabricParams());
    expect(res.status).toBe(404);
    expect(colorDb.findMany).not.toHaveBeenCalled();
  });

  it('loads only Cotton colors when Cotton is selected', async () => {
    fabricDb.findUnique.mockResolvedValue({ id: 'cof_seed_cotton', isActive: true });
    colorDb.findMany.mockResolvedValue([
      { id: 'col_white', fabricId: 'cof_seed_cotton', name: 'White', imageUrl: null, displayOrder: 1 },
      { id: 'col_sky', fabricId: 'cof_seed_cotton', name: 'Sky Blue', imageUrl: null, displayOrder: 2 },
    ]);

    const res = await publicColorsGET(
      makeRequest('http://localhost/x'),
      { params: Promise.resolve({ fabricId: 'cof_seed_cotton' }) },
    );
    const json = await res.json();

    expect(colorDb.findMany).toHaveBeenCalledWith({
      where: { fabricId: 'cof_seed_cotton', isActive: true },
      select: { id: true, fabricId: true, name: true, imageUrl: true, displayOrder: true },
      orderBy: { displayOrder: 'asc' },
    });
    expect(json.success).toBe(true);
    expect(json.data.map((c: { name: string }) => c.name)).toEqual(['White', 'Sky Blue']);
    expect(json.data.every((c: { fabricId: string }) => c.fabricId === 'cof_seed_cotton')).toBe(true);
  });

  it('loads only Silk colors when Silk is selected', async () => {
    fabricDb.findUnique.mockResolvedValue({ id: 'cof_seed_silk', isActive: true });
    colorDb.findMany.mockResolvedValue([
      { id: 'col_ivory', fabricId: 'cof_seed_silk', name: 'Ivory', imageUrl: null, displayOrder: 1 },
    ]);

    const res = await publicColorsGET(
      makeRequest('http://localhost/x'),
      { params: Promise.resolve({ fabricId: 'cof_seed_silk' }) },
    );
    const json = await res.json();

    expect(colorDb.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { fabricId: 'cof_seed_silk', isActive: true },
      }),
    );
    expect(json.data.map((c: { name: string }) => c.name)).toEqual(['Ivory']);
  });

  it('excludes inactive colors (isActive: true in the query)', async () => {
    fabricDb.findUnique.mockResolvedValue({ id: 'cof_seed_cotton', isActive: true });
    colorDb.findMany.mockResolvedValue([
      { id: 'col_white', fabricId: 'cof_seed_cotton', name: 'White', imageUrl: null, displayOrder: 1 },
    ]);

    await publicColorsGET(makeRequest('http://localhost/x'), fabricParams());

    const call = colorDb.findMany.mock.calls[0][0];
    expect(call.where).toEqual({ fabricId: 'cof_seed_cotton', isActive: true });
  });

  it('returns an empty list when the fabric has no active colors', async () => {
    fabricDb.findUnique.mockResolvedValue({ id: 'cof_seed_cotton', isActive: true });
    colorDb.findMany.mockResolvedValue([]);

    const res = await publicColorsGET(makeRequest('http://localhost/x'), fabricParams());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
  });
});

// ─── Admin authorization (customers cannot access) ──────────

describe('admin authorization', () => {
  it('rejects every admin fabric/color route without an admin session', async () => {
    mockedRequireAdmin.mockResolvedValue({
      response: NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      ),
    });

    const calls: Array<() => Promise<Response>> = [
      () => adminFabricsGET(makeRequest('http://localhost/api/admin/custom-order/fabrics')),
      () =>
        adminFabricsPOST(
          jsonRequest('http://localhost/api/admin/custom-order/fabrics', 'POST', {
            name: 'Cotton',
            imageUrl: '/uploads/cotton.jpg',
          }),
        ),
      () => fabricGET(makeRequest('http://localhost/x'), fabricParams()),
      () => fabricPATCH(jsonRequest('http://localhost/x', 'PATCH', { name: 'X' }), fabricParams()),
      () => fabricDELETE(makeRequest('http://localhost/x', { method: 'DELETE' }), fabricParams()),
      () => adminColorsGET(makeRequest('http://localhost/x'), fabricParams()),
      () =>
        adminColorsPOST(
          jsonRequest('http://localhost/x', 'POST', { name: 'White', imageUrl: '/uploads/w.jpg' }),
          fabricParams(),
        ),
      () => colorGET(makeRequest('http://localhost/x'), colorParams()),
      () => colorPATCH(jsonRequest('http://localhost/x', 'PATCH', { name: 'X' }), colorParams()),
      () => colorDELETE(makeRequest('http://localhost/x', { method: 'DELETE' }), colorParams()),
    ];

    for (const call of calls) {
      const res = await call();
      expect(res.status).toBe(401);
    }

    expect(fabricDb.findMany).not.toHaveBeenCalled();
    expect(fabricDb.create).not.toHaveBeenCalled();
    expect(fabricDb.update).not.toHaveBeenCalled();
    expect(fabricDb.delete).not.toHaveBeenCalled();
    expect(colorDb.findMany).not.toHaveBeenCalled();
    expect(colorDb.create).not.toHaveBeenCalled();
    expect(colorDb.update).not.toHaveBeenCalled();
    expect(colorDb.delete).not.toHaveBeenCalled();
  });
});

// ─── Admin fabric list / create ──────────────────────────────

describe('GET/POST /api/admin/custom-order/fabrics', () => {
  it('lists fabrics with color counts for admins', async () => {
    fabricDb.findMany.mockResolvedValue([cottonRecord, silkRecord]);

    const res = await adminFabricsGET(
      makeRequest('http://localhost/api/admin/custom-order/fabrics'),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data[0].colorCount).toBe(3);
    expect(json.data[0].createdAt).toBe(now.toISOString());
    expect(json.data[1].isActive).toBe(false);
  });

  it('supports the status and search filters', async () => {
    fabricDb.findMany.mockResolvedValue([]);

    await adminFabricsGET(
      makeRequest('http://localhost/api/admin/custom-order/fabrics?search=cot&status=inactive'),
    );

    const call = fabricDb.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
    expect(call.where.isActive).toBe(false);
  });

  it('rejects an invalid status filter with 400', async () => {
    const res = await adminFabricsGET(
      makeRequest('http://localhost/api/admin/custom-order/fabrics?status=bogus'),
    );
    expect(res.status).toBe(400);
    expect(fabricDb.findMany).not.toHaveBeenCalled();
  });

  it('creates a fabric with a slug derived from the name', async () => {
    fabricDb.findFirst.mockResolvedValue(null);
    fabricDb.create.mockResolvedValue({
      ...cottonRecord,
      name: 'Cotton Voile',
      slug: 'cotton-voile',
    });

    const res = await adminFabricsPOST(
      jsonRequest('http://localhost/api/admin/custom-order/fabrics', 'POST', {
        name: 'Cotton Voile',
        imageUrl: '/uploads/cotton-voile.jpg',
        displayOrder: 9,
        isActive: false,
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(fabricDb.create).toHaveBeenCalledWith({
      data: {
        name: 'Cotton Voile',
        slug: 'cotton-voile',
        imageUrl: '/uploads/cotton-voile.jpg',
        displayOrder: 9,
        isActive: false,
      },
      select: expect.anything(),
    });
    expect(json.data.slug).toBe('cotton-voile');
  });

  it('rejects fabric creation without an image (400)', async () => {
    const res = await adminFabricsPOST(
      jsonRequest('http://localhost/api/admin/custom-order/fabrics', 'POST', {
        name: 'Cotton',
      }),
    );
    expect(res.status).toBe(400);
    expect(fabricDb.create).not.toHaveBeenCalled();
  });

  it('rejects fabric creation with a blank name (400)', async () => {
    const res = await adminFabricsPOST(
      jsonRequest('http://localhost/api/admin/custom-order/fabrics', 'POST', {
        name: '   ',
        imageUrl: '/uploads/x.jpg',
      }),
    );
    expect(res.status).toBe(400);
    expect(fabricDb.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate fabric name/slug with 409', async () => {
    fabricDb.findFirst.mockResolvedValue({ id: 'cof_seed_cotton' });

    const res = await adminFabricsPOST(
      jsonRequest('http://localhost/api/admin/custom-order/fabrics', 'POST', {
        name: 'Cotton',
        imageUrl: '/uploads/another-cotton.jpg',
      }),
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain('already exists');
    expect(fabricDb.create).not.toHaveBeenCalled();
  });

  it('rejects a name with no letters or numbers (unslugifiable, 400)', async () => {
    const res = await adminFabricsPOST(
      jsonRequest('http://localhost/api/admin/custom-order/fabrics', 'POST', {
        name: '!!!',
        imageUrl: '/uploads/x.jpg',
      }),
    );
    expect(res.status).toBe(400);
    expect(fabricDb.create).not.toHaveBeenCalled();
  });
});

// ─── Admin fabric detail ─────────────────────────────────────

describe('GET/PATCH/DELETE /api/admin/custom-order/fabrics/[id]', () => {
  it('fetches a single fabric with its color count', async () => {
    fabricDb.findUnique.mockResolvedValue(cottonRecord);

    const res = await fabricGET(makeRequest('http://localhost/x'), fabricParams());
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.id).toBe('cof_seed_cotton');
    expect(json.data.colorCount).toBe(3);
  });

  it('returns 404 for an unknown fabric', async () => {
    fabricDb.findUnique.mockResolvedValue(null);
    const res = await fabricGET(makeRequest('http://localhost/x'), fabricParams());
    expect(res.status).toBe(404);
  });

  it('updates a fabric and re-derives the slug on rename', async () => {
    fabricDb.findUnique.mockResolvedValue(cottonRecord);
    fabricDb.findFirst.mockResolvedValue(null);
    fabricDb.update.mockResolvedValue({
      ...cottonRecord,
      name: 'Organic Cotton',
      slug: 'organic-cotton',
    });

    const res = await fabricPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { name: 'Organic Cotton' }),
      fabricParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(fabricDb.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cof_seed_cotton' },
        data: { name: 'Organic Cotton', slug: 'organic-cotton' },
      }),
    );
    expect(json.data.slug).toBe('organic-cotton');
  });

  it('does not inject schema defaults on a partial update', async () => {
    fabricDb.findUnique.mockResolvedValue(cottonRecord);
    fabricDb.update.mockResolvedValue({ ...cottonRecord, isActive: false });

    const res = await fabricPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { isActive: false }),
      fabricParams(),
    );

    expect(res.status).toBe(200);
    expect(fabricDb.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
    const data = fabricDb.update.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('displayOrder');
    expect(data).not.toHaveProperty('name');
  });

  it('rejects renaming onto another fabric with 409', async () => {
    fabricDb.findUnique.mockResolvedValue(silkRecord);
    fabricDb.findFirst.mockResolvedValue({ id: 'cof_seed_cotton' });

    const res = await fabricPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { name: 'Cotton' }),
      { params: Promise.resolve({ fabricId: 'cof_seed_silk' }) },
    );

    expect(res.status).toBe(409);
    expect(fabricDb.update).not.toHaveBeenCalled();
  });

  it('returns 404 when patching an unknown fabric', async () => {
    fabricDb.findUnique.mockResolvedValue(null);

    const res = await fabricPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { isActive: false }),
      fabricParams(),
    );
    expect(res.status).toBe(404);
    expect(fabricDb.update).not.toHaveBeenCalled();
  });

  it('soft deletes a fabric (isActive: false) instead of hard deleting', async () => {
    fabricDb.findUnique.mockResolvedValue(cottonRecord);
    fabricDb.update.mockResolvedValue({ ...cottonRecord, isActive: false });

    const res = await fabricDELETE(
      makeRequest('http://localhost/x', { method: 'DELETE' }),
      fabricParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.isActive).toBe(false);
    expect(fabricDb.update).toHaveBeenCalledWith({
      where: { id: 'cof_seed_cotton' },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
    expect(fabricDb.delete).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting an unknown fabric', async () => {
    fabricDb.findUnique.mockResolvedValue(null);

    const res = await fabricDELETE(
      makeRequest('http://localhost/x', { method: 'DELETE' }),
      fabricParams(),
    );
    expect(res.status).toBe(404);
    expect(fabricDb.update).not.toHaveBeenCalled();
  });
});

// ─── Admin color list / create (nested under a fabric) ───────

describe('GET/POST /api/admin/custom-order/fabrics/[fabricId]/colors', () => {
  it('lists colors scoped to the fabric, including inactive ones', async () => {
    fabricDb.findUnique.mockResolvedValue({ id: 'cof_seed_cotton' });
    colorDb.findMany.mockResolvedValue([
      whiteColorRecord,
      { ...whiteColorRecord, id: 'col_sky', name: 'Sky Blue', isActive: false, displayOrder: 2 },
    ]);

    const res = await adminColorsGET(makeRequest('http://localhost/x'), fabricParams());
    const json = await res.json();

    expect(colorDb.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { fabricId: 'cof_seed_cotton' } }),
    );
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[1].name).toBe('Sky Blue');
  });

  it('supports the status filter for colors', async () => {
    fabricDb.findUnique.mockResolvedValue({ id: 'cof_seed_cotton' });
    colorDb.findMany.mockResolvedValue([]);

    await adminColorsGET(makeRequest('http://localhost/x?status=inactive'), fabricParams());

    const call = colorDb.findMany.mock.calls[0][0];
    expect(call.where).toEqual({ fabricId: 'cof_seed_cotton', isActive: false });
  });

  it('returns 404 when listing colors for an unknown fabric', async () => {
    fabricDb.findUnique.mockResolvedValue(null);

    const res = await adminColorsGET(makeRequest('http://localhost/x'), fabricParams());
    expect(res.status).toBe(404);
    expect(colorDb.findMany).not.toHaveBeenCalled();
  });

  it('creates a color that belongs to the fabric in the URL', async () => {
    fabricDb.findUnique.mockResolvedValue({ id: 'cof_seed_cotton' });
    colorDb.findFirst.mockResolvedValue(null);
    colorDb.create.mockResolvedValue({
      ...whiteColorRecord,
      name: 'Cream',
      id: 'col_cream',
    });

    const res = await adminColorsPOST(
      jsonRequest('http://localhost/x', 'POST', {
        name: 'Cream',
        imageUrl: '/uploads/cream.jpg',
        displayOrder: 3,
      }),
      fabricParams(),
    );

    expect(res.status).toBe(201);
    expect(colorDb.create).toHaveBeenCalledWith({
      data: {
        fabricId: 'cof_seed_cotton',
        name: 'Cream',
        imageUrl: '/uploads/cream.jpg',
        displayOrder: 3,
        isActive: true,
      },
      select: expect.anything(),
    });
  });

  it('returns 404 when creating a color for an unknown fabric', async () => {
    fabricDb.findUnique.mockResolvedValue(null);

    const res = await adminColorsPOST(
      jsonRequest('http://localhost/x', 'POST', { name: 'Cream', imageUrl: '/uploads/c.jpg' }),
      fabricParams(),
    );

    expect(res.status).toBe(404);
    expect(colorDb.create).not.toHaveBeenCalled();
  });

  it('prevents duplicate color names within the same fabric (409)', async () => {
    fabricDb.findUnique.mockResolvedValue({ id: 'cof_seed_cotton' });
    colorDb.findFirst.mockResolvedValue({ id: 'col_white', isActive: true });

    const res = await adminColorsPOST(
      jsonRequest('http://localhost/x', 'POST', {
        name: 'white',
        imageUrl: '/uploads/w2.jpg',
      }),
      fabricParams(),
    );

    expect(res.status).toBe(409);
    // Duplicate check is scoped to this fabric, case-insensitively.
    expect(colorDb.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fabricId: 'cof_seed_cotton',
          name: { equals: 'white', mode: 'insensitive' },
        },
      }),
    );
    expect(colorDb.create).not.toHaveBeenCalled();
  });

  it('blocks re-creating the name of a deactivated color (409)', async () => {
    fabricDb.findUnique.mockResolvedValue({ id: 'cof_seed_cotton' });
    colorDb.findFirst.mockResolvedValue({ id: 'col_white', isActive: false });

    const res = await adminColorsPOST(
      jsonRequest('http://localhost/x', 'POST', { name: 'White', imageUrl: '/uploads/w.jpg' }),
      fabricParams(),
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain('deactivated');
    expect(colorDb.create).not.toHaveBeenCalled();
  });

  it('rejects color creation without an image (400)', async () => {
    const res = await adminColorsPOST(
      jsonRequest('http://localhost/x', 'POST', { name: 'White' }),
      fabricParams(),
    );

    expect(res.status).toBe(400);
    expect(colorDb.create).not.toHaveBeenCalled();
  });
});

// ─── Admin color detail ──────────────────────────────────────

describe('GET/PATCH/DELETE /api/admin/custom-order/colors/[id]', () => {
  it('fetches a single color', async () => {
    colorDb.findUnique.mockResolvedValue(whiteColorRecord);

    const res = await colorGET(makeRequest('http://localhost/x'), colorParams());
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.id).toBe('col_white');
    expect(json.data.fabricId).toBe('cof_seed_cotton');
  });

  it('returns 404 for an unknown color', async () => {
    colorDb.findUnique.mockResolvedValue(null);
    const res = await colorGET(makeRequest('http://localhost/x'), colorParams());
    expect(res.status).toBe(404);
  });

  it('updates a color and checks duplicates within its own fabric', async () => {
    colorDb.findUnique.mockResolvedValue(whiteColorRecord);
    colorDb.findFirst.mockResolvedValue(null);
    colorDb.update.mockResolvedValue({ ...whiteColorRecord, name: 'Navy Blue' });

    const res = await colorPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { name: 'Navy Blue' }),
      colorParams(),
    );

    expect(res.status).toBe(200);
    expect(colorDb.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fabricId: 'cof_seed_cotton',
          id: { not: 'col_white' },
          name: { equals: 'Navy Blue', mode: 'insensitive' },
        },
      }),
    );
    expect(colorDb.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Navy Blue' } }),
    );
  });

  it('rejects renaming onto an existing color in the same fabric (409)', async () => {
    colorDb.findUnique.mockResolvedValue(whiteColorRecord);
    colorDb.findFirst.mockResolvedValue({ id: 'col_other' });

    const res = await colorPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { name: 'Sky Blue' }),
      colorParams(),
    );

    expect(res.status).toBe(409);
    expect(colorDb.update).not.toHaveBeenCalled();
  });

  it('does not allow a color to move to another fabric (fabricId stripped)', async () => {
    colorDb.findUnique.mockResolvedValue(whiteColorRecord);
    colorDb.update.mockResolvedValue(whiteColorRecord);

    const res = await colorPATCH(
      jsonRequest('http://localhost/x', 'PATCH', {
        fabricId: 'cof_seed_silk',
        isActive: false,
      }),
      colorParams(),
    );

    expect(res.status).toBe(200);
    expect(colorDb.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
    expect(colorDb.update.mock.calls[0][0].data).not.toHaveProperty('fabricId');
  });

  it('does not inject schema defaults on a partial color update', async () => {
    colorDb.findUnique.mockResolvedValue(whiteColorRecord);
    colorDb.update.mockResolvedValue({ ...whiteColorRecord, displayOrder: 5 });

    const res = await colorPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { displayOrder: 5 }),
      colorParams(),
    );

    expect(res.status).toBe(200);
    const data = colorDb.update.mock.calls[0][0].data;
    expect(data).toEqual({ displayOrder: 5 });
    expect(data).not.toHaveProperty('isActive');
    expect(data).not.toHaveProperty('name');
  });

  it('returns 404 when patching an unknown color', async () => {
    colorDb.findUnique.mockResolvedValue(null);

    const res = await colorPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { isActive: false }),
      colorParams(),
    );
    expect(res.status).toBe(404);
    expect(colorDb.update).not.toHaveBeenCalled();
  });

  it('soft deletes a color (isActive: false) instead of hard deleting', async () => {
    colorDb.findUnique.mockResolvedValue(whiteColorRecord);
    colorDb.update.mockResolvedValue({ ...whiteColorRecord, isActive: false });

    const res = await colorDELETE(
      makeRequest('http://localhost/x', { method: 'DELETE' }),
      colorParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.isActive).toBe(false);
    expect(colorDb.update).toHaveBeenCalledWith({
      where: { id: 'col_white' },
      data: { isActive: false },
      select: { id: true, fabricId: true, isActive: true },
    });
    expect(colorDb.delete).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting an unknown color', async () => {
    colorDb.findUnique.mockResolvedValue(null);

    const res = await colorDELETE(
      makeRequest('http://localhost/x', { method: 'DELETE' }),
      colorParams(),
    );
    expect(res.status).toBe(404);
    expect(colorDb.update).not.toHaveBeenCalled();
  });
});
