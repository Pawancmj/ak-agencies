import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { customOrderMeasurementFieldSchema } from '@/lib/validations';
import { fieldKeyFromLabel } from '@/lib/custom-order-measurements';

const listQuerySchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
});

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
  request: NextRequest,
  { params }: { params: Promise<{ productTypeId: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { productTypeId } = await params;

    const url = new URL(request.url);
    const parsed = listQuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const productType = await prisma.customOrderProductType.findUnique({
      where: { id: productTypeId },
      select: { id: true },
    });

    if (!productType) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 },
      );
    }

    const fields = await prisma.customOrderMeasurementField.findMany({
      where: {
        productTypeId,
        ...(parsed.data.status
          ? { isActive: parsed.data.status === 'active' }
          : {}),
      },
      select: measurementFieldSelect,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: fields.map(serialize),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch measurement fields' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productTypeId: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { productTypeId } = await params;
    const body = await request.json();
    const parsed = customOrderMeasurementFieldSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const productType = await prisma.customOrderProductType.findUnique({
      where: { id: productTypeId },
      select: { id: true },
    });

    if (!productType) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 },
      );
    }

    // fieldKey defaults to a slug-like derivation of the label
    // ("Seat Depth" → seat_depth); admins may supply their own.
    const fieldKey = parsed.data.fieldKey ?? fieldKeyFromLabel(parsed.data.label);
    if (!fieldKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Label must contain letters or numbers to generate a field key',
        },
        { status: 400 },
      );
    }

    // Duplicate keys are blocked within the same product type — including
    // deactivated rows, which must be re-activated instead of re-created.
    const existing = await prisma.customOrderMeasurementField.findFirst({
      where: { productTypeId, fieldKey },
      select: { id: true, isActive: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: existing.isActive
            ? 'A field with this key already exists for this product type'
            : 'A field with this key already exists for this product type (deactivated) — edit the existing field instead',
        },
        { status: 409 },
      );
    }

    const field = await prisma.customOrderMeasurementField.create({
      data: {
        productTypeId,
        label: parsed.data.label,
        fieldKey,
        description: parsed.data.description ?? null,
        inputType: parsed.data.inputType,
        unit: parsed.data.unit ?? null,
        placeholder: parsed.data.placeholder ?? null,
        displayOrder: parsed.data.displayOrder,
        isRequired: parsed.data.isRequired,
        minValue: parsed.data.minValue ?? null,
        maxValue: parsed.data.maxValue ?? null,
        isActive: parsed.data.isActive,
      },
      select: measurementFieldSelect,
    });

    return NextResponse.json(
      { success: true, data: serialize(field) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create measurement field' },
      { status: 500 },
    );
  }
}
