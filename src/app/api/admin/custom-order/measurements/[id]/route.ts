import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { customOrderMeasurementFieldUpdateSchema } from '@/lib/validations';

const measurementFieldSelect = {
  id: true,
  productTypeId: true,
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
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type MeasurementFieldRecord = {
  id: string;
  productTypeId: string;
  label: string;
  fieldKey: string;
  description: string | null;
  inputType: 'NUMBER' | 'TEXT';
  unit: string | null;
  placeholder: string | null;
  displayOrder: number;
  isRequired: boolean;
  minValue: number | null;
  maxValue: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function serialize(record: MeasurementFieldRecord) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;

    const field = await prisma.customOrderMeasurementField.findUnique({
      where: { id },
      select: measurementFieldSelect,
    });

    if (!field) {
      return NextResponse.json(
        { success: false, error: 'Measurement field not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serialize(field),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch measurement field' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = customOrderMeasurementFieldUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // Only apply keys actually present in the request body — schema
    // defaults must never overwrite existing values on PATCH, and
    // productTypeId is never writable (fields cannot switch product types).
    const providedKeys = Array.isArray(body) ? [] : Object.keys(body ?? {});
    const data = Object.fromEntries(
      Object.entries(parsed.data).filter(([key]) => providedKeys.includes(key)),
    );

    const existing = await prisma.customOrderMeasurementField.findUnique({
      where: { id },
      select: { id: true, productTypeId: true, minValue: true, maxValue: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Measurement field not found' },
        { status: 404 },
      );
    }

    if (typeof data.fieldKey === 'string' && data.fieldKey) {
      const conflict = await prisma.customOrderMeasurementField.findFirst({
        where: {
          productTypeId: existing.productTypeId,
          id: { not: id },
          fieldKey: data.fieldKey,
        },
        select: { id: true },
      });

      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            error: 'A field with this key already exists for this product type',
          },
          { status: 409 },
        );
      }
    }

    // min/max must hold against the MERGED result (the body may send only
    // one side of the range).
    const effectiveMin = 'minValue' in data ? data.minValue : existing.minValue;
    const effectiveMax = 'maxValue' in data ? data.maxValue : existing.maxValue;
    if (effectiveMin != null && effectiveMax != null && effectiveMin > effectiveMax) {
      return NextResponse.json(
        { success: false, error: 'Minimum value cannot exceed maximum value' },
        { status: 400 },
      );
    }

    const field = await prisma.customOrderMeasurementField.update({
      where: { id },
      data,
      select: measurementFieldSelect,
    });

    return NextResponse.json({
      success: true,
      data: serialize(field),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update measurement field' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;

    const existing = await prisma.customOrderMeasurementField.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Measurement field not found' },
        { status: 404 },
      );
    }

    // Soft delete — historical custom-order snapshots reference the field
    // only by key, and admins can re-activate the row from the list.
    const field = await prisma.customOrderMeasurementField.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: { id: field.id, isActive: field.isActive },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete measurement field' },
      { status: 500 },
    );
  }
}
