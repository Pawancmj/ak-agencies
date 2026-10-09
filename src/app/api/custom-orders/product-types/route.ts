import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const productTypes = await prisma.customOrderProductType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: productTypes,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product types' },
      { status: 500 },
    );
  }
}
