import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { TESTIMONIAL_ADMIN_ORDER_BY } from '@/lib/testimonials';
import { testimonialSchema } from '@/lib/validations';

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const testimonialSelect = {
  id: true,
  customerName: true,
  reviewText: true,
  customerImageUrl: true,
  productName: true,
  rating: true,
  displayOrder: true,
  isActive: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
} as const;

type TestimonialRecord = {
  id: string;
  customerName: string;
  reviewText: string;
  customerImageUrl: string | null;
  productName: string | null;
  rating: number;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function serialize(record: TestimonialRecord) {
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
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const limit = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get('limit') || '20')),
    );
    const skip = (page - 1) * limit;

    const where = {
      ...(search
        ? {
            OR: [
              { customerName: { contains: search, mode: 'insensitive' as const } },
              { reviewText: { contains: search, mode: 'insensitive' as const } },
              { productName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(status ? { isActive: status === 'active' } : {}),
    };

    const [testimonials, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        select: testimonialSelect,
        orderBy: [...TESTIMONIAL_ADMIN_ORDER_BY],
        skip,
        take: limit,
      }),
      prisma.testimonial.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: testimonials.map(serialize),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonials' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const parsed = testimonialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: parsed.data,
      select: testimonialSelect,
    });

    return NextResponse.json(
      { success: true, data: serialize(testimonial) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create testimonial' },
      { status: 500 },
    );
  }
}
