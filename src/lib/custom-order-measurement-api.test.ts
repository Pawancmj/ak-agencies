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
    customOrderMeasurementField: {
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
import { GET as publicMeasurementsGET } from '@/app/api/custom-order/product-types/[productTypeId]/measurements/route';
import { POST as validatePOST } from '@/app/api/custom-order/measurements/validate/route';
import {
  GET as adminListGET,
  POST as adminCreatePOST,
} from '@/app/api/admin/custom-order/product-types/[productTypeId]/measurements/route';
import {
  GET as fieldGET,
  PATCH as fieldPATCH,
  DELETE as fieldDELETE,
} from '@/app/api/admin/custom-order/measurements/[id]/route';

const mockedRequireAdmin = vi.mocked(requireAdmin);

type MockFn = ReturnType<typeof vi.fn>;

const productTypeDb = prisma.customOrderProductType as unknown as Record<
  'findMany' | 'findUnique' | 'findFirst' | 'create' | 'update' | 'delete',
  MockFn
>;
const fieldDb = prisma.customOrderMeasurementField as unknown as Record<
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

const heightRecord = {
  id: 'mf_height',
  productTypeId: 'copt_seed_curtains',
  label: 'Height',
  fieldKey: 'height',
  description: 'Rod to floor',
  inputType: 'NUMBER' as const,
  unit: 'cm',
  placeholder: 'Enter height',
  displayOrder: 1,
  isRequired: true,
  minValue: 1,
  maxValue: 500,
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

const widthRecord = {
  ...heightRecord,
  id: 'mf_width',
  label: 'Width',
  fieldKey: 'width',
  description: null,
  placeholder: 'Enter width',
  displayOrder: 2,
  minValue: null,
  maxValue: null,
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

function typeParams() {
  return { params: Promise.resolve({ productTypeId: 'copt_seed_curtains' }) };
}

function fieldParams() {
  return { params: Promise.resolve({ id: 'mf_height' }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedRequireAdmin.mockResolvedValue(adminSession);
});

// ─── Public API ──────────────────────────────────────────────

describe('GET /api/custom-order/product-types/[productTypeId]/measurements (public)', () => {
  it('returns only active fields sorted by displayOrder asc', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains', isActive: true });
    fieldDb.findMany.mockResolvedValue([
      { id: 'mf_height', label: 'Height', fieldKey: 'height', displayOrder: 1 },
      { id: 'mf_width', label: 'Width', fieldKey: 'width', displayOrder: 2 },
    ]);

    const res = await publicMeasurementsGET(
      makeRequest('http://localhost/x'),
      typeParams(),
    );
    const json = await res.json();

    expect(fieldDb.findMany).toHaveBeenCalledWith({
      where: { productTypeId: 'copt_seed_curtains', isActive: true },
      select: {
        id: true,
        label: true,
        fieldKey: true,
        description: true,
        inputType: true,
        unit: true,
        placeholder: true,
        displayOrder: true,
        isRequired: true,
        minValue: true,
        maxValue: true,
      },
      orderBy: { displayOrder: 'asc' },
    });
    expect(json.success).toBe(true);
    expect(json.data.map((f: { label: string }) => f.label)).toEqual([
      'Height',
      'Width',
    ]);
  });

  it('never exposes admin-only information (isActive/productTypeId/timestamps)', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains', isActive: true });
    fieldDb.findMany.mockResolvedValue([
      { id: 'mf_height', label: 'Height', fieldKey: 'height', inputType: 'NUMBER' },
    ]);

    const res = await publicMeasurementsGET(
      makeRequest('http://localhost/x'),
      typeParams(),
    );
    const json = await res.json();

    expect(JSON.stringify(json)).not.toContain('isActive');
    expect(JSON.stringify(json)).not.toContain('productTypeId');
    expect(JSON.stringify(json)).not.toContain('createdAt');
    expect(json.data[0]).not.toHaveProperty('isActive');
  });

  it('returns 404 for an unknown product type', async () => {
    productTypeDb.findUnique.mockResolvedValue(null);

    const res = await publicMeasurementsGET(
      makeRequest('http://localhost/x'),
      typeParams(),
    );
    expect(res.status).toBe(404);
    expect(fieldDb.findMany).not.toHaveBeenCalled();
  });

  it('returns 404 for a deactivated product type', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains', isActive: false });

    const res = await publicMeasurementsGET(
      makeRequest('http://localhost/x'),
      typeParams(),
    );
    expect(res.status).toBe(404);
    expect(fieldDb.findMany).not.toHaveBeenCalled();
  });

  it("Curtains returns only Curtain fields (product-specific isolation)", async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains', isActive: true });
    fieldDb.findMany.mockResolvedValue([
      { id: 'mf_height', label: 'Height', fieldKey: 'height' },
      { id: 'mf_width', label: 'Width', fieldKey: 'width' },
    ]);

    const res = await publicMeasurementsGET(
      makeRequest('http://localhost/x'),
      typeParams(),
    );
    const json = await res.json();

    expect(json.data.map((f: { fieldKey: string }) => f.fieldKey)).toEqual([
      'height',
      'width',
    ]);
    // The query itself is scoped to the product type in the URL.
    expect(fieldDb.findMany.mock.calls[0][0].where.productTypeId).toBe(
      'copt_seed_curtains',
    );
  });

  it('Sofa Cover queries its own productTypeId, never Curtains fields', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_sofa_cover', isActive: true });
    fieldDb.findMany.mockResolvedValue([
      { id: 'mf_length', label: 'Length', fieldKey: 'length' },
      { id: 'mf_seat', label: 'Seat Depth', fieldKey: 'seat_depth' },
    ]);

    const res = await publicMeasurementsGET(makeRequest('http://localhost/x'), {
      params: Promise.resolve({ productTypeId: 'copt_seed_sofa_cover' }),
    });
    const json = await res.json();

    expect(fieldDb.findMany.mock.calls[0][0].where.productTypeId).toBe(
      'copt_seed_sofa_cover',
    );
    expect(json.data.map((f: { fieldKey: string }) => f.fieldKey)).toEqual([
      'length',
      'seat_depth',
    ]);
  });

  it('returns an empty list when no fields are configured', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_towel', isActive: true });
    fieldDb.findMany.mockResolvedValue([]);

    const res = await publicMeasurementsGET(makeRequest('http://localhost/x'), {
      params: Promise.resolve({ productTypeId: 'copt_seed_towel' }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
  });
});

// ─── Admin authorization ─────────────────────────────────────

describe('admin authorization', () => {
  it('rejects every admin measurement route without an admin session', async () => {
    mockedRequireAdmin.mockResolvedValue({
      response: NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      ),
    });

    const calls: Array<() => Promise<Response>> = [
      () => adminListGET(makeRequest('http://localhost/x'), typeParams()),
      () =>
        adminCreatePOST(
          jsonRequest('http://localhost/x', 'POST', { label: 'Height' }),
          typeParams(),
        ),
      () => fieldGET(makeRequest('http://localhost/x'), fieldParams()),
      () =>
        fieldPATCH(jsonRequest('http://localhost/x', 'PATCH', { label: 'X' }), fieldParams()),
      () =>
        fieldDELETE(makeRequest('http://localhost/x', { method: 'DELETE' }), fieldParams()),
    ];

    for (const call of calls) {
      const res = await call();
      expect(res.status).toBe(401);
    }

    expect(fieldDb.findMany).not.toHaveBeenCalled();
    expect(fieldDb.findUnique).not.toHaveBeenCalled();
    expect(fieldDb.create).not.toHaveBeenCalled();
    expect(fieldDb.update).not.toHaveBeenCalled();
    expect(fieldDb.delete).not.toHaveBeenCalled();
  });
});

// ─── Admin list / create ─────────────────────────────────────

describe('GET/POST /api/admin/custom-order/product-types/[productTypeId]/measurements', () => {
  it('lists all fields (including inactive) scoped to the product type', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains' });
    fieldDb.findMany.mockResolvedValue([
      heightRecord,
      { ...widthRecord, isActive: false },
    ]);

    const res = await adminListGET(makeRequest('http://localhost/x'), typeParams());
    const json = await res.json();

    expect(fieldDb.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productTypeId: 'copt_seed_curtains' },
      }),
    );
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[1].isActive).toBe(false);
    expect(json.data[0].createdAt).toBe(now.toISOString());
  });

  it('supports the status filter and rejects a bogus one', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains' });
    fieldDb.findMany.mockResolvedValue([]);

    await adminListGET(makeRequest('http://localhost/x?status=inactive'), typeParams());
    expect(fieldDb.findMany.mock.calls[0][0].where).toEqual({
      productTypeId: 'copt_seed_curtains',
      isActive: false,
    });

    const res = await adminListGET(
      makeRequest('http://localhost/x?status=bogus'),
      typeParams(),
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when listing fields for an unknown product type', async () => {
    productTypeDb.findUnique.mockResolvedValue(null);

    const res = await adminListGET(makeRequest('http://localhost/x'), typeParams());
    expect(res.status).toBe(404);
    expect(fieldDb.findMany).not.toHaveBeenCalled();
  });

  it('creates a field with the fieldKey derived from the label', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains' });
    fieldDb.findFirst.mockResolvedValue(null);
    fieldDb.create.mockResolvedValue({
      ...heightRecord,
      id: 'mf_seat',
      label: 'Seat Depth',
      fieldKey: 'seat_depth',
    });

    const res = await adminCreatePOST(
      jsonRequest('http://localhost/x', 'POST', {
        label: 'Seat Depth',
        description: 'Front edge to backrest',
        inputType: 'NUMBER',
        unit: 'cm',
        displayOrder: 3,
        isRequired: true,
        minValue: 1,
        maxValue: 200,
        isActive: true,
      }),
      typeParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(fieldDb.create).toHaveBeenCalledWith({
      data: {
        productTypeId: 'copt_seed_curtains',
        label: 'Seat Depth',
        fieldKey: 'seat_depth',
        description: 'Front edge to backrest',
        inputType: 'NUMBER',
        unit: 'cm',
        placeholder: null,
        displayOrder: 3,
        isRequired: true,
        minValue: 1,
        maxValue: 200,
        isActive: true,
      },
      select: expect.anything(),
    });
    expect(json.data.fieldKey).toBe('seat_depth');
  });

  it('accepts an explicit fieldKey when the admin provides one', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains' });
    fieldDb.findFirst.mockResolvedValue(null);
    fieldDb.create.mockResolvedValue(heightRecord);

    const res = await adminCreatePOST(
      jsonRequest('http://localhost/x', 'POST', {
        label: 'Height',
        fieldKey: 'curtain_height',
      }),
      typeParams(),
    );

    expect(res.status).toBe(201);
    expect(fieldDb.create.mock.calls[0][0].data.fieldKey).toBe('curtain_height');
  });

  it('prevents duplicate fieldKeys within the same product type (409)', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains' });
    fieldDb.findFirst.mockResolvedValue({ id: 'mf_height', isActive: true });

    const res = await adminCreatePOST(
      jsonRequest('http://localhost/x', 'POST', { label: 'Height' }),
      typeParams(),
    );

    expect(res.status).toBe(409);
    expect(fieldDb.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productTypeId: 'copt_seed_curtains', fieldKey: 'height' },
      }),
    );
    expect(fieldDb.create).not.toHaveBeenCalled();
  });

  it('blocks re-creating the key of a deactivated field (409 + deactivated hint)', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains' });
    fieldDb.findFirst.mockResolvedValue({ id: 'mf_height', isActive: false });

    const res = await adminCreatePOST(
      jsonRequest('http://localhost/x', 'POST', { label: 'Height' }),
      typeParams(),
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain('deactivated');
  });

  it('returns 404 when creating fields for an unknown product type', async () => {
    productTypeDb.findUnique.mockResolvedValue(null);

    const res = await adminCreatePOST(
      jsonRequest('http://localhost/x', 'POST', { label: 'Height' }),
      typeParams(),
    );
    expect(res.status).toBe(404);
    expect(fieldDb.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid fieldKey format (400)', async () => {
    const res = await adminCreatePOST(
      jsonRequest('http://localhost/x', 'POST', {
        label: 'Seat Depth',
        fieldKey: 'Seat Depth',
      }),
      typeParams(),
    );
    expect(res.status).toBe(400);
    expect(fieldDb.create).not.toHaveBeenCalled();
  });

  it('rejects minValue greater than maxValue (400)', async () => {
    const res = await adminCreatePOST(
      jsonRequest('http://localhost/x', 'POST', {
        label: 'Height',
        minValue: 500,
        maxValue: 100,
      }),
      typeParams(),
    );
    expect(res.status).toBe(400);
    expect(fieldDb.create).not.toHaveBeenCalled();
  });

  it('rejects a blank label (400)', async () => {
    const res = await adminCreatePOST(
      jsonRequest('http://localhost/x', 'POST', { label: '   ' }),
      typeParams(),
    );
    expect(res.status).toBe(400);
    expect(fieldDb.create).not.toHaveBeenCalled();
  });
});

// ─── Admin field detail ──────────────────────────────────────

describe('GET/PATCH/DELETE /api/admin/custom-order/measurements/[id]', () => {
  it('fetches a single field', async () => {
    fieldDb.findUnique.mockResolvedValue(heightRecord);

    const res = await fieldGET(makeRequest('http://localhost/x'), fieldParams());
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.id).toBe('mf_height');
    expect(json.data.fieldKey).toBe('height');
  });

  it('returns 404 for an unknown field', async () => {
    fieldDb.findUnique.mockResolvedValue(null);
    const res = await fieldGET(makeRequest('http://localhost/x'), fieldParams());
    expect(res.status).toBe(404);
  });

  it('updates provided keys only (no injected defaults)', async () => {
    fieldDb.findUnique.mockResolvedValue(heightRecord);
    fieldDb.update.mockResolvedValue({ ...heightRecord, isActive: false });

    const res = await fieldPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { isActive: false }),
      fieldParams(),
    );

    expect(res.status).toBe(200);
    expect(fieldDb.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
    const data = fieldDb.update.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('displayOrder');
    expect(data).not.toHaveProperty('isRequired');
    expect(data).not.toHaveProperty('label');
    expect(data).not.toHaveProperty('inputType');
  });

  it('deactivates a field via PATCH (admin status toggle)', async () => {
    fieldDb.findUnique.mockResolvedValue(heightRecord);
    fieldDb.update.mockResolvedValue({ ...heightRecord, isActive: false });

    const res = await fieldPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { isActive: false }),
      fieldParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.isActive).toBe(false);
  });

  it('never allows a field to move to another product type (productTypeId stripped)', async () => {
    fieldDb.findUnique.mockResolvedValue(heightRecord);
    fieldDb.update.mockResolvedValue(heightRecord);

    const res = await fieldPATCH(
      jsonRequest('http://localhost/x', 'PATCH', {
        productTypeId: 'copt_seed_sofa_cover',
        label: 'Height',
      }),
      fieldParams(),
    );

    expect(res.status).toBe(200);
    expect(fieldDb.update.mock.calls[0][0].data).not.toHaveProperty('productTypeId');
  });

  it('checks fieldKey conflicts against siblings in the same product type (409)', async () => {
    fieldDb.findUnique.mockResolvedValue(heightRecord);
    fieldDb.findFirst.mockResolvedValue({ id: 'mf_other' });

    const res = await fieldPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { fieldKey: 'width' }),
      fieldParams(),
    );

    expect(res.status).toBe(409);
    expect(fieldDb.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          productTypeId: 'copt_seed_curtains',
          id: { not: 'mf_height' },
          fieldKey: 'width',
        },
      }),
    );
    expect(fieldDb.update).not.toHaveBeenCalled();
  });

  it('allows the field to keep its own key when re-saved (excludes self)', async () => {
    fieldDb.findUnique.mockResolvedValue(heightRecord);
    fieldDb.findFirst.mockResolvedValue(null);
    fieldDb.update.mockResolvedValue(heightRecord);

    const res = await fieldPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { fieldKey: 'height' }),
      fieldParams(),
    );
    expect(res.status).toBe(200);
  });

  it('rejects a min/max conflict against the merged record (400)', async () => {
    // Existing maxValue is 100; the body only sends minValue: 900.
    fieldDb.findUnique.mockResolvedValue({ ...heightRecord, maxValue: 100 });

    const res = await fieldPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { minValue: 900 }),
      fieldParams(),
    );

    expect(res.status).toBe(400);
    expect(fieldDb.update).not.toHaveBeenCalled();
  });

  it('clears bounds when null is sent (400 not triggered)', async () => {
    fieldDb.findUnique.mockResolvedValue(heightRecord);
    fieldDb.update.mockResolvedValue({ ...heightRecord, minValue: null, maxValue: null });

    const res = await fieldPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { minValue: null, maxValue: null }),
      fieldParams(),
    );
    expect(res.status).toBe(200);
    expect(fieldDb.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { minValue: null, maxValue: null } }),
    );
  });

  it('returns 404 when patching an unknown field', async () => {
    fieldDb.findUnique.mockResolvedValue(null);

    const res = await fieldPATCH(
      jsonRequest('http://localhost/x', 'PATCH', { isActive: false }),
      fieldParams(),
    );
    expect(res.status).toBe(404);
    expect(fieldDb.update).not.toHaveBeenCalled();
  });

  it('soft deletes a field (isActive: false) instead of hard deleting', async () => {
    fieldDb.findUnique.mockResolvedValue(heightRecord);
    fieldDb.update.mockResolvedValue({ ...heightRecord, isActive: false });

    const res = await fieldDELETE(
      makeRequest('http://localhost/x', { method: 'DELETE' }),
      fieldParams(),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.isActive).toBe(false);
    expect(fieldDb.update).toHaveBeenCalledWith({
      where: { id: 'mf_height' },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
    expect(fieldDb.delete).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting an unknown field', async () => {
    fieldDb.findUnique.mockResolvedValue(null);

    const res = await fieldDELETE(
      makeRequest('http://localhost/x', { method: 'DELETE' }),
      fieldParams(),
    );
    expect(res.status).toBe(404);
    expect(fieldDb.update).not.toHaveBeenCalled();
  });
});

// ─── Server-side submission validation ───────────────────────

describe('POST /api/custom-order/measurements/validate (server-side gate)', () => {
  const curtainsConfig = [
    {
      fieldKey: 'height',
      label: 'Height',
      inputType: 'NUMBER',
      isRequired: true,
      minValue: 1,
      maxValue: 500,
    },
    {
      fieldKey: 'width',
      label: 'Width',
      inputType: 'NUMBER',
      isRequired: true,
      minValue: null,
      maxValue: null,
    },
  ];

  function validate(body: unknown) {
    return validatePOST(jsonRequest('http://localhost/x', 'POST', body));
  }

  it('accepts a valid submission and returns typed values', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains', isActive: true });
    fieldDb.findMany.mockResolvedValue(curtainsConfig);

    const res = await validate({
      productTypeId: 'copt_seed_curtains',
      measurements: { height: '240', width: 120 },
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.values).toEqual({ height: 240, width: 120 });
  });

  it('rejects a submission missing a required measurement (400)', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains', isActive: true });
    fieldDb.findMany.mockResolvedValue(curtainsConfig);

    const res = await validate({
      productTypeId: 'copt_seed_curtains',
      measurements: { height: 240 },
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.errors).toEqual({ width: 'Width is required' });
  });

  it('rejects an unknown measurement key (400)', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains', isActive: true });
    fieldDb.findMany.mockResolvedValue(curtainsConfig);

    const res = await validate({
      productTypeId: 'copt_seed_curtains',
      measurements: { height: 240, width: 120, random_field: 1 },
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.unknownKeys).toEqual(['random_field']);
  });

  it('rejects out-of-range and non-numeric values (400)', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_curtains', isActive: true });
    fieldDb.findMany.mockResolvedValue(curtainsConfig);

    const tooBig = await validate({
      productTypeId: 'copt_seed_curtains',
      measurements: { height: 501, width: 120 },
    });
    expect(tooBig.status).toBe(400);

    const notANumber = await validate({
      productTypeId: 'copt_seed_curtains',
      measurements: { height: 'tall', width: 120 },
    });
    expect(notANumber.status).toBe(400);
  });

  it('validates against the configuration of the product type in the body', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_sofa_cover', isActive: true });
    fieldDb.findMany.mockResolvedValue([
      { fieldKey: 'seat_depth', label: 'Seat Depth', inputType: 'NUMBER', isRequired: true, minValue: null, maxValue: null },
    ]);

    // Curtain measurements must not pass for Sofa Cover.
    const res = await validate({
      productTypeId: 'copt_seed_sofa_cover',
      measurements: { height: 240, width: 120 },
    });

    expect(res.status).toBe(400);
    expect(fieldDb.findMany.mock.calls[0][0].where.productTypeId).toBe(
      'copt_seed_sofa_cover',
    );
  });

  it('accepts a product with no configured fields', async () => {
    productTypeDb.findUnique.mockResolvedValue({ id: 'copt_seed_towel', isActive: true });
    fieldDb.findMany.mockResolvedValue([]);

    const res = await validate({ productTypeId: 'copt_seed_towel', measurements: {} });
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown or inactive product types', async () => {
    productTypeDb.findUnique.mockResolvedValue(null);
    expect(
      (await validate({ productTypeId: 'nope', measurements: {} })).status,
    ).toBe(404);

    productTypeDb.findUnique.mockResolvedValue({ id: 'x', isActive: false });
    expect(
      (await validate({ productTypeId: 'x', measurements: {} })).status,
    ).toBe(404);
  });

  it('rejects a malformed body (400)', async () => {
    expect((await validate({ measurements: {} })).status).toBe(400);
    expect(
      (await validate({ productTypeId: 'x', measurements: 'height=240' })).status,
    ).toBe(400);
    expect((await validate('not-json')).status).toBe(400);
    expect(productTypeDb.findUnique).not.toHaveBeenCalled();
  });
});
