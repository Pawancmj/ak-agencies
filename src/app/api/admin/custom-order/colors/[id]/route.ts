import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { customOrderColorUpdateSchema } from '@/lib/validations';

const colorSelect = {
  id: true,
  fabricId: true,
  name: true,
  imageUrl: true,
  displayOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ColorRecord = {
  id: string;
  fabricId: string;
  name: string;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function serialize(record: ColorRecord) {
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

    const color = await prisma.customOrderColor.findUnique({
      where: { id },
      select: colorSelect,
    });

    if (!color) {
      return NextResponse.json(
        { success: false, error: 'Color not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serialize(color),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch color' },
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
    const parsed = customOrderColorUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // Only apply keys actually present in the request body — schema defaults
    // (displayOrder/isActive) must never overwrite existing values on PATCH.
    // fabricId is immutable: a color always belongs to its original fabric.
    const providedKeys = Array.isArray(body) ? [] : Object.keys(body ?? {});
    const data = Object.fromEntries(
      Object.entries(parsed.data).filter(
        ([key]) => key !== 'fabricId' && providedKeys.includes(key),
      ),
    );

    const existing = await prisma.customOrderColor.findUnique({
      where: { id },
      select: { id: true, fabricId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Color not found' },
        { status: 404 },
      );
    }

    if (typeof data.name === 'string' && data.name) {
      const conflict = await prisma.customOrderColor.findFirst({
        where: {
          fabricId: existing.fabricId,
          id: { not: id },
          name: { equals: data.name, mode: 'insensitive' },
        },
        select: { id: true },
      });

      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'A color with this name already exists for this fabric' },
          { status: 409 },
        );
      }
    }

    const color = await prisma.customOrderColor.update({
      where: { id },
      data,
      select: colorSelect,
    });

    return NextResponse.json({
      success: true,
      data: serialize(color),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update color' },
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

    const existing = await prisma.customOrderColor.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Color not found' },
        { status: 404 },
      );
    }

    // Soft delete — the color row stays manageable from the admin list.
    const color = await prisma.customOrderColor.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, fabricId: true, isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: { id: color.id, fabricId: color.fabricId, isActive: color.isActive },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete color' },
      { status: 500 },
    );
  }
}
