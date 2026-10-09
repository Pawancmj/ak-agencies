import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { customOrderProductTypeSchema } from '@/lib/validations';

const productTypeSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  displayOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ProductTypeRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function serialize(record: ProductTypeRecord) {
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

    const productType = await prisma.customOrderProductType.findUnique({
      where: { id },
      select: productTypeSelect,
    });

    if (!productType) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serialize(productType),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product type' },
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
    const parsed = customOrderProductTypeSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // Only apply keys actually present in the request body — schema defaults
    // (displayOrder/isActive) must never overwrite existing values on PATCH.
    const providedKeys = Array.isArray(body) ? [] : Object.keys(body ?? {});
    const data = Object.fromEntries(
      Object.entries(parsed.data).filter(([key]) => providedKeys.includes(key)),
    );

    const existing = await prisma.customOrderProductType.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 },
      );
    }

    if (typeof data.slug === 'string' && data.slug) {
      const slugConflict = await prisma.customOrderProductType.findFirst({
        where: { slug: data.slug, id: { not: id } },
        select: { id: true },
      });

      if (slugConflict) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 409 },
        );
      }
    }

    const productType = await prisma.customOrderProductType.update({
      where: { id },
      data,
      select: productTypeSelect,
    });

    return NextResponse.json({
      success: true,
      data: serialize(productType),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update product type' },
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

    const existing = await prisma.customOrderProductType.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 },
      );
    }

    await prisma.customOrderProductType.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete product type' },
      { status: 500 },
    );
  }
}
