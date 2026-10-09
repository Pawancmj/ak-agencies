import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { customOrderColorSchema } from '@/lib/validations';

const listQuerySchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
});

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
  request: NextRequest,
  { params }: { params: Promise<{ fabricId: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { fabricId } = await params;

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

    const fabric = await prisma.customOrderFabric.findUnique({
      where: { id: fabricId },
      select: { id: true },
    });

    if (!fabric) {
      return NextResponse.json(
        { success: false, error: 'Fabric not found' },
        { status: 404 },
      );
    }

    const colors = await prisma.customOrderColor.findMany({
      where: {
        fabricId,
        ...(parsed.data.status
          ? { isActive: parsed.data.status === 'active' }
          : {}),
      },
      select: colorSelect,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: colors.map(serialize),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch colors' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fabricId: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { fabricId } = await params;
    const body = await request.json();
    const parsed = customOrderColorSchema.safeParse({ ...body, fabricId });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const fabric = await prisma.customOrderFabric.findUnique({
      where: { id: fabricId },
      select: { id: true },
    });

    if (!fabric) {
      return NextResponse.json(
        { success: false, error: 'Fabric not found' },
        { status: 404 },
      );
    }

    // Prevent duplicate color names within the same fabric — including
    // deactivated rows, which must be re-activated instead of re-created.
    const existing = await prisma.customOrderColor.findFirst({
      where: {
        fabricId,
        name: { equals: parsed.data.name, mode: 'insensitive' },
      },
      select: { id: true, isActive: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: existing.isActive
            ? 'A color with this name already exists for this fabric'
            : 'A color with this name already exists for this fabric (deactivated) — edit the existing color instead',
        },
        { status: 409 },
      );
    }

    const color = await prisma.customOrderColor.create({
      data: {
        fabricId,
        name: parsed.data.name,
        imageUrl: parsed.data.imageUrl,
        displayOrder: parsed.data.displayOrder,
        isActive: parsed.data.isActive,
      },
      select: colorSelect,
    });

    return NextResponse.json(
      { success: true, data: serialize(color) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create color' },
      { status: 500 },
    );
  }
}
