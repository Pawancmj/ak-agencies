import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { customOrderMeasurementSubmitSchema } from '@/lib/validations';
import { validateMeasurementValues } from '@/lib/custom-order-measurements';

/**
 * Server-side measurement validation (never trust the browser alone).
 *
 * The customer's Step 4 already gates "Next" with the same rules, but the
 * configuration can change between Step 4 and Submit — this endpoint
 * re-checks a submission against the LIVE configuration and rejects
 * missing required fields, unknown keys, invalid numbers, and out-of-range
 * values with 400 + per-field errors.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = customOrderMeasurementSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const productType = await prisma.customOrderProductType.findUnique({
      where: { id: parsed.data.productTypeId },
      select: { id: true, isActive: true },
    });

    if (!productType || !productType.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 },
      );
    }

    const fields = await prisma.customOrderMeasurementField.findMany({
      where: { productTypeId: parsed.data.productTypeId, isActive: true },
      select: {
        fieldKey: true,
        label: true,
        inputType: true,
        isRequired: true,
        minValue: true,
        maxValue: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    const result = validateMeasurementValues(fields, parsed.data.measurements);

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Some measurements are invalid for this product',
          errors: result.errors,
          unknownKeys: result.unknownKeys,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { values: result.values },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to validate measurements' },
      { status: 500 },
    );
  }
}
