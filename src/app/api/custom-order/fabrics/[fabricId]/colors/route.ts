import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fabricId: string }> },
) {
  try {
    const { fabricId } = await params;

    const fabric = await prisma.customOrderFabric.findUnique({
      where: { id: fabricId },
      select: { id: true, isActive: true },
    });

    // Unknown and deactivated fabrics both return 404 so the public API
    // never exposes inactive records.
    if (!fabric || !fabric.isActive) {
      return NextResponse.json(
        { success: false, error: 'Fabric not found' },
        { status: 404 },
      );
    }

    const colors = await prisma.customOrderColor.findMany({
      where: { fabricId, isActive: true },
      select: {
        id: true,
        fabricId: true,
        name: true,
        imageUrl: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: colors,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch colors' },
      { status: 500 },
    );
  }
}
