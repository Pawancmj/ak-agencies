import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { testimonialUpdateSchema } from '@/lib/validations';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;

    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
      select: testimonialSelect,
    });

    if (!testimonial) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serialize(testimonial),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonial' },
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
    const parsed = testimonialUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // Only apply keys actually present in the request body — optional
    // fields must never overwrite existing DB values on partial updates.
    const providedKeys = Array.isArray(body) ? [] : Object.keys(body ?? {});
    const data = Object.fromEntries(
      Object.entries(parsed.data).filter(([key]) => providedKeys.includes(key)),
    );

    const existing = await prisma.testimonial.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 },
      );
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data,
      select: testimonialSelect,
    });

    return NextResponse.json({
      success: true,
      data: serialize(testimonial),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update testimonial' },
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

    const existing = await prisma.testimonial.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 },
      );
    }

    await prisma.testimonial.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete testimonial' },
      { status: 500 },
    );
  }
}
