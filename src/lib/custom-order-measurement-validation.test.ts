import { describe, it, expect } from 'vitest';
import {
  customOrderMeasurementFieldSchema,
  customOrderMeasurementFieldUpdateSchema,
  customOrderMeasurementSubmitSchema,
} from '@/lib/validations';

const validCreate = {
  label: 'Height',
  fieldKey: 'height',
  description: 'Enter curtain height from rod to floor.',
  inputType: 'NUMBER' as const,
  unit: 'cm',
  placeholder: 'Enter height',
  displayOrder: 1,
  isRequired: true,
  minValue: 1,
  maxValue: 500,
  isActive: true,
};

describe('customOrderMeasurementFieldSchema (create)', () => {
  it('accepts a fully specified field', () => {
    const parsed = customOrderMeasurementFieldSchema.safeParse(validCreate);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toMatchObject({
      label: 'Height',
      fieldKey: 'height',
      inputType: 'NUMBER',
      unit: 'cm',
      displayOrder: 1,
      isRequired: true,
      minValue: 1,
      maxValue: 500,
      isActive: true,
    });
  });

  it('accepts a label-only field (fieldKey derived server-side)', () => {
    const parsed = customOrderMeasurementFieldSchema.safeParse({ label: 'Seat Depth' });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.fieldKey).toBeUndefined();
    // Safe defaults: NUMBER input, required, first in order, active.
    expect(parsed.data.inputType).toBe('NUMBER');
    expect(parsed.data.isRequired).toBe(true);
    expect(parsed.data.displayOrder).toBe(0);
    expect(parsed.data.isActive).toBe(true);
  });

  it('rejects a missing or blank label', () => {
    expect(customOrderMeasurementFieldSchema.safeParse({}).success).toBe(false);
    expect(
      customOrderMeasurementFieldSchema.safeParse({ label: '   ' }).success,
    ).toBe(false);
  });

  it('validates fieldKey format (lowercase, numbers, underscores; no spaces)', () => {
    const badKeys = ['Seat Depth', 'seat depth', 'seatDepth', '-seat', 'seat-', 'SEAT'];
    for (const fieldKey of badKeys) {
      expect(
        customOrderMeasurementFieldSchema.safeParse({ label: 'Seat', fieldKey }).success,
      ).toBe(false);
    }

    for (const fieldKey of ['seat_depth', 'height', 'height2', '3d_size']) {
      expect(
        customOrderMeasurementFieldSchema.safeParse({ label: 'Seat', fieldKey }).success,
      ).toBe(true);
    }
  });

  it('defaults inputType to NUMBER and rejects unsupported types', () => {
    const defaulted = customOrderMeasurementFieldSchema.safeParse({ label: 'Width' });
    expect(defaulted.success && defaulted.data.inputType).toBe('NUMBER');

    expect(
      customOrderMeasurementFieldSchema.safeParse({ label: 'Width', inputType: 'RADIO' })
        .success,
    ).toBe(false);
  });

  it('rejects minValue greater than maxValue', () => {
    const parsed = customOrderMeasurementFieldSchema.safeParse({
      label: 'Height',
      minValue: 500,
      maxValue: 100,
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues[0].message).toBe(
      'Minimum value cannot exceed maximum value',
    );
  });

  it('coerces string bounds from HTML inputs and treats empty as unset', () => {
    const parsed = customOrderMeasurementFieldSchema.safeParse({
      label: 'Height',
      minValue: '1',
      maxValue: '',
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.minValue).toBe(1);
    expect(parsed.data.maxValue).toBeUndefined();
  });

  it('accepts null bounds (clears them) and rejects non-numeric bounds', () => {
    expect(
      customOrderMeasurementFieldSchema.safeParse({
        label: 'Height',
        minValue: null,
        maxValue: null,
      }).success,
    ).toBe(true);

    expect(
      customOrderMeasurementFieldSchema.safeParse({ label: 'Height', minValue: 'abc' })
        .success,
    ).toBe(false);
  });

  it('coerces displayOrder and rejects negative or fractional orders', () => {
    expect(
      customOrderMeasurementFieldSchema.safeParse({ label: 'H', displayOrder: '3' }),
    ).toEqual({ success: true, data: expect.objectContaining({ displayOrder: 3 }) });
    expect(
      customOrderMeasurementFieldSchema.safeParse({ label: 'H', displayOrder: -1 })
        .success,
    ).toBe(false);
    expect(
      customOrderMeasurementFieldSchema.safeParse({ label: 'H', displayOrder: 1.5 })
        .success,
    ).toBe(false);
  });
});

describe('customOrderMeasurementFieldUpdateSchema (PATCH — no injected defaults)', () => {
  it('never injects schema defaults for absent keys', () => {
    const parsed = customOrderMeasurementFieldUpdateSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual({});
    expect(parsed.data).not.toHaveProperty('displayOrder');
    expect(parsed.data).not.toHaveProperty('isActive');
    expect(parsed.data).not.toHaveProperty('isRequired');
    expect(parsed.data).not.toHaveProperty('inputType');
  });

  it('keeps only the provided keys', () => {
    const parsed = customOrderMeasurementFieldUpdateSchema.safeParse({
      isActive: false,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual({ isActive: false });
  });

  it('still validates fieldKey format and the inputType enum', () => {
    expect(
      customOrderMeasurementFieldUpdateSchema.safeParse({ fieldKey: 'Bad Key' }).success,
    ).toBe(false);
    expect(
      customOrderMeasurementFieldUpdateSchema.safeParse({ inputType: 'TEXT' }).success,
    ).toBe(true);
    expect(
      customOrderMeasurementFieldUpdateSchema.safeParse({ inputType: 'CHECKBOX' }).success,
    ).toBe(false);
  });

  it('rejects an in-body min/max conflict but allows updating one side', () => {
    expect(
      customOrderMeasurementFieldUpdateSchema.safeParse({
        minValue: 900,
        maxValue: 100,
      }).success,
    ).toBe(false);

    expect(
      customOrderMeasurementFieldUpdateSchema.safeParse({ minValue: 900 }).success,
    ).toBe(true);
  });
});

describe('customOrderMeasurementSubmitSchema (server-side validation body)', () => {
  it('accepts a productTypeId with a measurements object', () => {
    const parsed = customOrderMeasurementSubmitSchema.safeParse({
      productTypeId: 'copt_seed_curtains',
      measurements: { height: 240, width: 120 },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a missing productTypeId or non-object measurements', () => {
    expect(
      customOrderMeasurementSubmitSchema.safeParse({ measurements: {} }).success,
    ).toBe(false);
    expect(
      customOrderMeasurementSubmitSchema.safeParse({
        productTypeId: 'x',
        measurements: 'height=240',
      }).success,
    ).toBe(false);
  });
});
