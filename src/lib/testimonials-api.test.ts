import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    testimonial: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { GET as publicGET } from '@/app/api/testimonials/route';
import {
  GET as adminListGET,
  POST as adminPOST,
} from '@/app/api/admin/testimonials/route';
import {
  GET as adminDetailGET,
  PATCH as adminPATCH,
  DELETE as adminDELETE,
} from '@/app/api/admin/testimonials/[id]/route';

const mockedRequireAdmin = vi.mocked(requireAdmin);
const db = prisma.testimonial as unknown as Record<
  'findMany' | 'findUnique' | 'count' | 'create' | 'update' | 'delete',
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
  id: 'tst-1',
  customerName: 'Priya Sharma',
  reviewText: 'Absolutely love the quality of the curtains!',
  customerImageUrl: null,
  productName: 'Premium Floral Curtain',
  rating: 5,
  displayOrder: 0,
  isActive: true,
  isFeatured: false,
  createdAt: new Date('2026-01-15T10:00:00.000Z'),
  updatedAt: new Date('2026-01-15T10:00:00.000Z'),
};

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as unknown as NextRequest;
}

function idParams(id = 'tst-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedRequireAdmin.mockResolvedValue(adminSession);
  db.count.mockResolvedValue(0);
});

// ─── Public API ─────────────────────────────────────────────

describe('GET /api/testimonials (public)', () => {
  it('returns only active testimonials in featured/displayOrder/createdAt order', async () => {
    db.findMany.mockResolvedValue([
      {
        id: 'tst-2',
        customerName: 'Rahul Verma',
        reviewText: 'Great quality and perfect fit.',
        customerImageUrl: null,
        productName: 'Luxury Velvet Sofa Cover',
        rating: 5,
      },
      {
        id: 'tst-3',
        customerName: 'Ananya Gupta',
        reviewText: 'Beautiful bedsheet set with lovely print.',
        customerImageUrl: '/api/img/abc',
        productName: 'Floral Cotton Bedsheet Set',
        rating: 4,
      },
    ]);

    const res = await publicGET();
    const json = await res.json();

    expect(db.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: {
        id: true,
        customerName: true,
        reviewText: true,
        customerImageUrl: true,
        productName: true,
        rating: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].customerName).toBe('Rahul Verma');
  });

  it('does not expose admin-only fields', async () => {
    db.findMany.mockResolvedValue([
      {
        id: 'tst-2',
        customerName: 'Rahul Verma',
        reviewText: 'Great quality and perfect fit.',
        customerImageUrl: null,
        productName: 'Luxury Velvet Sofa Cover',
        rating: 5,
      },
    ]);

    const res = await publicGET();
    const json = await res.json();

    expect(Object.keys(json.data[0]).sort()).toEqual([
      'customerImageUrl',
      'customerName',
      'id',
      'productName',
      'rating',
      'reviewText',
    ]);
    expect(JSON.stringify(json.data)).not.toContain('isFeatured');
    expect(JSON.stringify(json.data)).not.toContain('isActive');
  });

  it('returns a friendly error without leaking database details on failure', async () => {
    db.findMany.mockRejectedValue(new Error('connection pool exploded'));

    const res = await publicGET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({
      success: false,
      error: 'Failed to fetch testimonials',
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

    const res = await adminListGET(
      makeRequest('http://localhost/api/admin/testimonials'),
    );
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
      makeRequest('http://localhost/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({ customerName: 'A', reviewText: 'B' }),
      }),
    );
    expect(res.status).toBe(401);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated requests on update and delete', async () => {
    mockedRequireAdmin.mockResolvedValue({
      response: NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      ),
    });

    const patchRes = await adminPATCH(
      makeRequest('http://localhost/api/admin/testimonials/tst-1', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      }),
      idParams(),
    );
    const deleteRes = await adminDELETE(
      makeRequest('http://localhost/api/admin/testimonials/tst-1', {
        method: 'DELETE',
      }),
      idParams(),
    );

    expect(patchRes.status).toBe(401);
    expect(deleteRes.status).toBe(401);
    expect(db.update).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });
});

// ─── Admin list ─────────────────────────────────────────────

describe('GET /api/admin/testimonials', () => {
  it('returns testimonials ordered by displayOrder then createdAt with pagination', async () => {
    db.findMany.mockResolvedValue([sampleRecord]);
    db.count.mockResolvedValue(1);

    const res = await adminListGET(
      makeRequest('http://localhost/api/admin/testimonials?limit=10'),
    );
    const json = await res.json();

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        skip: 0,
        take: 10,
      }),
    );
    expect(json.success).toBe(true);
    expect(json.data[0].createdAt).toBe('2026-01-15T10:00:00.000Z');
    expect(json.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('filters by status', async () => {
    db.findMany.mockResolvedValue([]);

    await adminListGET(
      makeRequest('http://localhost/api/admin/testimonials?status=inactive'),
    );

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: false }),
      }),
    );
  });

  it('filters by search term across name, review, and product', async () => {
    db.findMany.mockResolvedValue([]);

    await adminListGET(
      makeRequest('http://localhost/api/admin/testimonials?search=curtain'),
    );

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { customerName: { contains: 'curtain', mode: 'insensitive' } },
            { reviewText: { contains: 'curtain', mode: 'insensitive' } },
            { productName: { contains: 'curtain', mode: 'insensitive' } },
          ],
        }),
      }),
    );
  });

  it('rejects an invalid status filter', async () => {
    const res = await adminListGET(
      makeRequest('http://localhost/api/admin/testimonials?status=bogus'),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(db.findMany).not.toHaveBeenCalled();
  });
});

// ─── Admin create ───────────────────────────────────────────

describe('POST /api/admin/testimonials', () => {
  it('creates a valid testimonial', async () => {
    db.create.mockResolvedValue(sampleRecord);

    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'Priya Sharma',
          reviewText: 'Absolutely love the quality of the curtains!',
          productName: 'Premium Floral Curtain',
          rating: 5,
          displayOrder: 0,
          isActive: true,
          isFeatured: false,
        }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.customerName).toBe('Priya Sharma');
    expect(db.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerName: 'Priya Sharma',
        reviewText: 'Absolutely love the quality of the curtains!',
        productName: 'Premium Floral Curtain',
        rating: 5,
        displayOrder: 0,
        isActive: true,
        isFeatured: false,
      }),
      select: expect.anything(),
    });
  });

  it('applies defaults when only the required fields are sent', async () => {
    db.create.mockResolvedValue(sampleRecord);

    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'Priya Sharma',
          reviewText: 'Great product!',
        }),
      }),
    );

    expect(res.status).toBe(201);
    expect(db.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rating: 5,
          displayOrder: 0,
          isActive: true,
          isFeatured: false,
        }),
      }),
    );
  });

  it('rejects a missing customer name', async () => {
    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({ reviewText: 'Great product!' }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only review', async () => {
    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({ customerName: 'Priya Sharma', reviewText: '   ' }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects a rating below 1', async () => {
    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'Priya Sharma',
          reviewText: 'Great product!',
          rating: 0,
        }),
      }),
    );

    expect(res.status).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects a rating above 5', async () => {
    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'Priya Sharma',
          reviewText: 'Great product!',
          rating: 6,
        }),
      }),
    );

    expect(res.status).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects a non-integer rating', async () => {
    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'Priya Sharma',
          reviewText: 'Great product!',
          rating: 2.5,
        }),
      }),
    );

    expect(res.status).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid displayOrder', async () => {
    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'Priya Sharma',
          reviewText: 'Great product!',
          displayOrder: -3,
        }),
      }),
    );

    expect(res.status).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('rejects an empty avatar URL instead of storing it', async () => {
    const res = await adminPOST(
      makeRequest('http://localhost/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'Priya Sharma',
          reviewText: 'Great product!',
          customerImageUrl: '',
        }),
      }),
    );

    expect(res.status).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  });
});

// ─── Admin detail / update / delete ─────────────────────────

describe('GET/PATCH/DELETE /api/admin/testimonials/[id]', () => {
  it('fetches a single testimonial', async () => {
    db.findUnique.mockResolvedValue(sampleRecord);

    const res = await adminDetailGET(
      makeRequest('http://localhost/api/admin/testimonials/tst-1'),
      idParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.id).toBe('tst-1');
    expect(db.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tst-1' } }),
    );
  });

  it('returns 404 when the testimonial does not exist', async () => {
    db.findUnique.mockResolvedValue(null);

    const res = await adminDetailGET(
      makeRequest('http://localhost/api/admin/testimonials/missing'),
      idParams('missing'),
    );

    expect(res.status).toBe(404);
  });

  it('updates an existing testimonial preserving its id', async () => {
    db.findUnique.mockResolvedValueOnce(sampleRecord);
    db.update.mockResolvedValue({ ...sampleRecord, rating: 4 });

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/testimonials/tst-1', {
        method: 'PATCH',
        body: JSON.stringify({ rating: 4 }),
      }),
      idParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tst-1' } }),
    );
    expect(db.create).not.toHaveBeenCalled();
  });

  it('toggles isActive without touching other fields', async () => {
    db.findUnique.mockResolvedValueOnce(sampleRecord);
    db.update.mockResolvedValue({ ...sampleRecord, isActive: false });

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/testimonials/tst-1', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      }),
      idParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  it('toggles isFeatured without touching other fields', async () => {
    db.findUnique.mockResolvedValueOnce(sampleRecord);
    db.update.mockResolvedValue({ ...sampleRecord, isFeatured: true });

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/testimonials/tst-1', {
        method: 'PATCH',
        body: JSON.stringify({ isFeatured: true }),
      }),
      idParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isFeatured: true } }),
    );
  });

  it('does not inject schema defaults for omitted fields', async () => {
    db.findUnique.mockResolvedValueOnce(sampleRecord);
    db.update.mockResolvedValue(sampleRecord);

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/testimonials/tst-1', {
        method: 'PATCH',
        body: JSON.stringify({ customerName: 'Renamed Customer' }),
      }),
      idParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    const updateArg = db.update.mock.calls[0][0];
    expect(updateArg.data).toEqual({ customerName: 'Renamed Customer' });
    expect(updateArg.data).not.toHaveProperty('rating');
    expect(updateArg.data).not.toHaveProperty('displayOrder');
    expect(updateArg.data).not.toHaveProperty('isActive');
    expect(updateArg.data).not.toHaveProperty('isFeatured');
  });

  it('clears the avatar when customerImageUrl is null', async () => {
    db.findUnique.mockResolvedValueOnce(sampleRecord);
    db.update.mockResolvedValue({
      ...sampleRecord,
      customerImageUrl: '/api/img/abc',
    });

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/testimonials/tst-1', {
        method: 'PATCH',
        body: JSON.stringify({ customerImageUrl: null }),
      }),
      idParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { customerImageUrl: null } }),
    );
  });

  it('rejects an invalid rating on update', async () => {
    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/testimonials/tst-1', {
        method: 'PATCH',
        body: JSON.stringify({ rating: 0 }),
      }),
      idParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only review on update', async () => {
    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/testimonials/tst-1', {
        method: 'PATCH',
        body: JSON.stringify({ reviewText: '   ' }),
      }),
      idParams(),
    );

    expect(res.status).toBe(400);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 404 when updating a missing testimonial', async () => {
    db.findUnique.mockResolvedValue(null);

    const res = await adminPATCH(
      makeRequest('http://localhost/api/admin/testimonials/missing', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      }),
      idParams('missing'),
    );

    expect(res.status).toBe(404);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('deletes a testimonial', async () => {
    db.findUnique.mockResolvedValue(sampleRecord);
    db.delete.mockResolvedValue(sampleRecord);

    const res = await adminDELETE(
      makeRequest('http://localhost/api/admin/testimonials/tst-1', {
        method: 'DELETE',
      }),
      idParams(),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(db.delete).toHaveBeenCalledWith({ where: { id: 'tst-1' } });
  });

  it('returns 404 when deleting a missing testimonial', async () => {
    db.findUnique.mockResolvedValue(null);

    const res = await adminDELETE(
      makeRequest('http://localhost/api/admin/testimonials/missing', {
        method: 'DELETE',
      }),
      idParams('missing'),
    );

    expect(res.status).toBe(404);
    expect(db.delete).not.toHaveBeenCalled();
  });
});
