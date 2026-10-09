import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { customOrderFabricSchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

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

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const url = new URL(request.url);
    const parsed = listQuerySchema.safeParse({
      search: url.searchParams.get('search') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { search, status } = parsed.data;

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { slug: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(status ? { isActive: status === 'active' } : {}),
    };

    const fabrics = await prisma.customOrderFabric.findMany({
      where,
      select: fabricSelect,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: fabrics.map(serialize),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fabrics' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const parsed = customOrderFabricSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // Slug is derived server-side from the name (not sent by the client).
    const slug = slugify(parsed.data.name);
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Name must contain letters or numbers' },
        { status: 400 },
      );
    }

    const existing = await prisma.customOrderFabric.findFirst({
      where: {
        OR: [
          { slug },
          { name: { equals: parsed.data.name, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A fabric with this name already exists' },
        { status: 409 },
      );
    }

    const fabric = await prisma.customOrderFabric.create({
      data: {
        name: parsed.data.name,
        slug,
        imageUrl: parsed.data.imageUrl,
        displayOrder: parsed.data.displayOrder,
        isActive: parsed.data.isActive,
      },
      select: fabricSelect,
    });

    return NextResponse.json(
      { success: true, data: serialize(fabric) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create fabric' },
      { status: 500 },
    );
  }
}
