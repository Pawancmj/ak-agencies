import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productTypeId: string }> },
) {
  try {
    const { productTypeId } = await params;

    const productType = await prisma.customOrderProductType.findUnique({
      where: { id: productTypeId },
      select: { id: true, isActive: true },
    });

    // Unknown and deactivated product types both return 404 so the public
    // API never exposes inactive configuration.
    if (!productType || !productType.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 },
      );
    }

    const fields = await prisma.customOrderMeasurementField.findMany({
      where: { productTypeId, isActive: true },
      select: {
        id: true,
        label: true,
        fieldKey: true,
        description: true,
        inputType: true,
        unit: true,
        placeholder: true,
        displayOrder: true,
        isRequired: true,
        minValue: true,
        maxValue: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: fields,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch measurement fields' },
      { status: 500 },
    );
  }
}
