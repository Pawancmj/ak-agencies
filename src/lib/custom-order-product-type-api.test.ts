import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customOrderProductType: {
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
import { GET as publicGET } from '@/app/api/custom-orders/product-types/route';
import {
  GET as adminListGET,
  POST as adminPOST,
} from '@/app/api/admin/custom-orders/product-types/route';
import {
  GET as adminDetailGET,
  PATCH as adminPATCH,
  DELETE as adminDELETE,
} from '@/app/api/admin/custom-orders/product-types/[id]/route';

const mockedRequireAdmin = vi.mocked(requireAdmin);
const db = prisma.customOrderProductType as unknown as Record<
  'findMany' | 'findUnique' | 'findFirst' | 'create' | 'update' | 'delete',
  ReturnType<typeof vi.fn>
>;

const adminSession = {
  session: {
    userId: 'user-1',
    email: 'admin@example.com',
    role: 'ADMIN',
    name: 'Admin',
  },
};

const sampleRecord = {
  id: 'pt-1',
  name: 'Roman Blinds',
  slug: 'roman-blinds',
  description: 'Custom Roman blinds made to order',
  displayOrder: 8,
  isActive: true,
  createdAt: new Date('2026-10-06T10:00:00.000Z'),
  updatedAt: new Date('2026-10-06T10:00:00.000Z'),
};

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as unknown as NextRequest;
}

function adminListParams() {
  return { params: Promise.resolve({ id: 'pt-1' }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedRequireAdmin.mockResolvedValue(adminSession);
});

// ─── Public API ─────────────────────────────────────────────

describe('GET /api/custom-orders/product-types (public)', () => {
  it('returns only active product types sorted by displayOrder asc', async () => {
    db.findMany.mockResolvedValue([
      { id: 'c1', name: 'Curtains', slug: 'curtains', description: null, displayOrder: 1 },
      { id: 'c7', name: 'Other', slug: 'other', description: null, displayOrder: 7 },
    ]);

    const res = await publicGET();
    const json = await res.json();

    expect(db.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].name).toBe('Curtains');
    expect(json.data[1].name).toBe('Other');
  });

  it('does not expose internal admin fields', async () => {
    db.findMany.mockResolvedValue([
      { id: 'c1', name: 'Curtains', slug: 'curtains', description: null, displayOrder: 1 },
    ]);

    const res = await publicGET();
    const json = await res.json();

    expect(Object.keys(json.data[0]).sort()).toEqual([
      'description',
      'displayOrder',
      'id',
      'name',
      'slug',
    ]);
  });

  it('returns a friendly error without leaking database details on failure', async () => {
    db.findMany.mockRejectedValue(new Error('connection pool exploded'));

    const res = await publicGET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({
      success: false,
      error: 'Failed to fetch product types',
    });
    expect(JSON.stringify(json)).not.toContain('connection pool');
  });
});

// ─── Admin authorization ────────────────────────────────────

describe('admin authorization', () => {
  it('rejects unauthenticated requests on list', async () => {
    mockedRequireAdmin.mockResolvedValue({
      response: NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      ),
    });

    const res = await adminListGET(makeRequest('http://localhost/api/admin/custom-orders/product-types'));
    expect(res.status).toBe(401);
    expect(db.findMany).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated requests on create', async () => {
    mockedRequireAdmin.mockResolvedValue({
      response: NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      ),
    });

    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/custom-orders/product-types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Roman Blinds', slug: 'roman-blinds' }),
      }),
    );
    expect(res.status).toBe(401);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated requests on delete', async () => {
    mockedRequireAdmin.mockResolvedValue({
      response: NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      ),
    });

    const res = await adminDELETE(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/pt-1', { method: 'DELETE' }),
      adminListParams(),
    );
    expect(res.status).toBe(401);
    expect(db.delete).not.toHaveBeenCalled();
  });
});

// ─── Admin list ─────────────────────────────────────────────

describe('GET /api/admin/custom-orders/product-types', () => {
  it('returns all product types ordered by displayOrder', async () => {
    db.findMany.mockResolvedValue([sampleRecord]);

    const res = await adminListGET(
      makeRequest('http://localhost/api/admin/custom-orders/product-types'),
    );
    const json = await res.json();

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      }),
    );
    expect(json.success).toBe(true);
    expect(json.data[0].createdAt).toBe('2026-10-06T10:00:00.000Z');
  });

  it('filters by status', async () => {
    db.findMany.mockResolvedValue([]);

    await adminListGET(
      makeRequest('http://localhost/api/admin/custom-orders/product-types?status=inactive'),
    );

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: false }),
      }),
    );
  });

  it('filters by search term across name and slug', async () => {
    db.findMany.mockResolvedValue([]);

    await adminListGET(
      makeRequest('http://localhost/api/admin/custom-orders/product-types?search=roman'),
    );

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'roman', mode: 'insensitive' } },
            { slug: { contains: 'roman', mode: 'insensitive' } },
          ],
        }),
      }),
    );
  });
});

// ─── Admin create ───────────────────────────────────────────

describe('POST /api/admin/custom-orders/product-types', () => {
  it('creates a valid product type', async () => {
    db.findUnique.mockResolvedValue(null);
    db.create.mockResolvedValue(sampleRecord);

    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/custom-orders/product-types', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Roman Blinds',
          slug: 'roman-blinds',
          description: 'Custom Roman blinds made to order',
          displayOrder: 8,
          isActive: true,
        }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.slug).toBe('roman-blinds');
    expect(db.create).toHaveBeenCalledWith({
      data: {
        name: 'Roman Blinds',
        slug: 'roman-blinds',
        description: 'Custom Roman blinds made to order',
        displayOrder: 8,
        isActive: true,
      },
      select: expect.anything(),
    });
  });

  it('rejects a whitespace-only name', async () => {
    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/custom-orders/product-types', {
        method: 'POST',
        body: JSON.stringify({ name: '   ', slug: 'roman-blinds' }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid slug', async () => {
    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/custom-orders/product-types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Roman Blinds', slug: 'Roman Blinds' }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid displayOrder', async () => {
    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/custom-orders/product-types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Roman Blinds', slug: 'roman-blinds', displayOrder: -3 }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate slug with 409', async () => {
    db.findUnique.mockResolvedValue({ id: 'existing' });

    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/custom-orders/product-types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Curtains', slug: 'curtains' }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe('Slug already exists');
    expect(db.create).not.toHaveBeenCalled();
  });
});

// ─── Admin detail / update / delete ─────────────────────────

describe('GET/PATCH/DELETE /api/admin/custom-orders/product-types/[id]', () => {
  it('fetches a single product type', async () => {
    db.findUnique.mockResolvedValue(sampleRecord);

    const res = await adminDetailGET(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/pt-1'),
      adminListParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.id).toBe('pt-1');
    expect(db.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pt-1' } }),
    );
  });

  it('returns 404 when product type does not exist', async () => {
    db.findUnique.mockResolvedValue(null);

    const res = await adminDetailGET(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/missing'),
      { params: Promise.resolve({ id: 'missing' }) },
    );

    expect(res.status).toBe(404);
  });

  it('updates an existing product type preserving its id', async () => {
    db.findUnique.mockResolvedValueOnce(sampleRecord);
    db.findFirst.mockResolvedValue(null);
    db.update.mockResolvedValue({ ...sampleRecord, name: 'Wooden Blinds' });

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/pt-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Wooden Blinds' }),
      }),
      adminListParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pt-1' } }),
    );
    expect(db.create).not.toHaveBeenCalled();
  });

  it('toggles isActive without touching other fields', async () => {
    db.findUnique.mockResolvedValueOnce(sampleRecord);
    db.update.mockResolvedValue({ ...sampleRecord, isActive: false });

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/pt-1', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      }),
      adminListParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  it('does not inject schema defaults for omitted fields (order/status preserved)', async () => {
    db.findUnique.mockResolvedValueOnce(sampleRecord);
    db.findFirst.mockResolvedValue(null);
    db.update.mockResolvedValue(sampleRecord);

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/pt-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Renamed Blinds' }),
      }),
      adminListParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    const updateArg = db.update.mock.calls[0][0];
    expect(updateArg.data).toEqual({ name: 'Renamed Blinds' });
    expect(updateArg.data).not.toHaveProperty('isActive');
    expect(updateArg.data).not.toHaveProperty('displayOrder');
  });

  it('rejects a duplicate slug on update (different record)', async () => {
    db.findUnique.mockResolvedValueOnce(sampleRecord);
    db.findFirst.mockResolvedValue({ id: 'other' });

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/pt-1', {
        method: 'PATCH',
        body: JSON.stringify({ slug: 'curtains' }),
      }),
      adminListParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe('Slug already exists');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('allows keeping the same slug when editing (no self-conflict)', async () => {
    db.findUnique.mockResolvedValueOnce(sampleRecord);
    db.findFirst.mockResolvedValue(null);
    db.update.mockResolvedValue(sampleRecord);

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/pt-1', {
        method: 'PATCH',
        body: JSON.stringify({ slug: 'roman-blinds' }),
      }),
      adminListParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(db.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'roman-blinds', id: { not: 'pt-1' } },
      }),
    );
  });

  it('rejects an invalid displayOrder on update', async () => {
    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/pt-1', {
        method: 'PATCH',
        body: JSON.stringify({ displayOrder: 2.5 }),
      }),
      adminListParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('deletes a product type', async () => {
    db.findUnique.mockResolvedValue(sampleRecord);
    db.delete.mockResolvedValue(sampleRecord);

    const res = await adminDELETE(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/pt-1', { method: 'DELETE' }),
      adminListParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(db.delete).toHaveBeenCalledWith({ where: { id: 'pt-1' } });
  });

  it('returns 404 when deleting a missing product type', async () => {
    db.findUnique.mockResolvedValue(null);

    const res = await adminDELETE(
      makeRequest('http://localhost/api/admin/custom-orders/product-types/missing', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'missing' }) },
    );

    expect(res.status).toBe(404);
    expect(db.delete).not.toHaveBeenCalled();
  });
});
