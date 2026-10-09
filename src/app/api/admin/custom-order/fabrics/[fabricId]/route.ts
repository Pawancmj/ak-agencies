import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { customOrderFabricUpdateSchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';

const fabricSelect = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
  displayOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { colors: true } },
} as const;

type FabricRecord = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { colors: number };
};

function serialize(record: FabricRecord) {
  const { _count, ...rest } = record;
  return {
    ...rest,
    colorCount: _count.colors,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fabricId: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { fabricId } = await params;

    const fabric = await prisma.customOrderFabric.findUnique({
      where: { id: fabricId },
      select: fabricSelect,
    });

    if (!fabric) {
      return NextResponse.json(
        { success: false, error: 'Fabric not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serialize(fabric),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fabric' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fabricId: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { fabricId } = await params;
    const body = await request.json();
    const parsed = customOrderFabricUpdateSchema.safeParse(body);

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

    const existing = await prisma.customOrderFabric.findUnique({
      where: { id: fabricId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Fabric not found' },
        { status: 404 },
      );
    }

    // Renaming re-derives the slug (the client never sends a slug).
    if (typeof data.name === 'string' && data.name) {
      const slug = slugify(data.name);
      if (!slug) {
        return NextResponse.json(
          { success: false, error: 'Name must contain letters or numbers' },
          { status: 400 },
        );
      }

      const conflict = await prisma.customOrderFabric.findFirst({
        where: {
          id: { not: fabricId },
          OR: [
            { slug },
            { name: { equals: data.name, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });

      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'A fabric with this name already exists' },
          { status: 409 },
        );
      }

      data.slug = slug;
    }

    const fabric = await prisma.customOrderFabric.update({
      where: { id: fabricId },
      data,
      select: fabricSelect,
    });

    return NextResponse.json({
      success: true,
      data: serialize(fabric),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update fabric' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fabricId: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { fabricId } = await params;

    const existing = await prisma.customOrderFabric.findUnique({
      where: { id: fabricId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Fabric not found' },
        { status: 404 },
      );
    }

    // Soft delete — never hard-delete a fabric, its colors stay intact and
    // the row remains manageable (re-activatable) from the admin list.
    const fabric = await prisma.customOrderFabric.update({
      where: { id: fabricId },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: { id: fabric.id, isActive: fabric.isActive },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete fabric' },
      { status: 500 },
    );
  }
}
