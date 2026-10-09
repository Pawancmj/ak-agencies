import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const fabrics = await prisma.customOrderFabric.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: fabrics,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fabrics' },
      { status: 500 },
    );
  }
}
