import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  TESTIMONIAL_PUBLIC_ORDER_BY,
  TESTIMONIAL_PUBLIC_SELECT,
  TESTIMONIAL_PUBLIC_WHERE,
} from '@/lib/testimonials';

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: TESTIMONIAL_PUBLIC_WHERE,
      select: TESTIMONIAL_PUBLIC_SELECT,
      orderBy: [...TESTIMONIAL_PUBLIC_ORDER_BY],
    });

    return NextResponse.json({
      success: true,
      data: testimonials,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonials' },
      { status: 500 },
    );
  }
}
