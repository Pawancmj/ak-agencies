import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { customOrderProductTypeSchema } from '@/lib/validations';

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

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

    const productTypes = await prisma.customOrderProductType.findMany({
      where,
      select: productTypeSelect,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: productTypes.map(serialize),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product types' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const parsed = customOrderProductTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const existing = await prisma.customOrderProductType.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists' },
        { status: 409 },
      );
    }

    const productType = await prisma.customOrderProductType.create({
      data: parsed.data,
      select: productTypeSelect,
    });

    return NextResponse.json(
      { success: true, data: serialize(productType) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create product type' },
      { status: 500 },
    );
  }
}
