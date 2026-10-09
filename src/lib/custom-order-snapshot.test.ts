import { describe, it, expect } from 'vitest';
import { buildCustomOrderSnapshot } from '@/lib/custom-order-snapshot';
import type { MeasurementFieldOption } from '@/lib/custom-order-measurements';

const curtainFields: MeasurementFieldOption[] = [
  {
    id: 'mf_height',
    fieldKey: 'height',
    label: 'Height',
    description: null,
    inputType: 'NUMBER',
    unit: 'cm',
    placeholder: null,
    displayOrder: 1,
    isRequired: true,
    minValue: 1,
    maxValue: 500,
  },
  {
    id: 'mf_width',
    fieldKey: 'width',
    label: 'Width',
    description: null,
    inputType: 'NUMBER',
    unit: 'cm',
    placeholder: null,
    displayOrder: 2,
    isRequired: true,
    minValue: null,
    maxValue: null,
  },
];

const baseFormData = {
  productType: 'Curtains',
  productTypeId: 'copt_seed_curtains',
  fabric: 'Cotton',
  fabricId: 'cof_seed_cotton',
  color: 'Sky Blue',
  colorId: 'col_sky',
  measurementValues: { height: '240', width: '120' },
  design: 'Floral',
  referenceImage: 'https://example.com/ref.jpg',
  quantity: 2,
  customerName: 'Asha Verma',
  customerPhone: '+919876543210',
  customerEmail: 'asha@example.com',
  customerAddress: 'Barabanki, UP',
  notes: 'Please pre-wash the fabric.',
};

describe('buildCustomOrderSnapshot (final custom-order submission)', () => {
  it('preserves product type id+name, fabric id+name, and color id+name together', () => {
    const snapshot = buildCustomOrderSnapshot(baseFormData, curtainFields);

    expect(snapshot.productTypeId).toBe('copt_seed_curtains');
    expect(snapshot.productTypeName).toBe('Curtains');
    expect(snapshot.fabricId).toBe('cof_seed_cotton');
    expect(snapshot.fabricName).toBe('Cotton');
    expect(snapshot.colorId).toBe('col_sky');
    expect(snapshot.colorName).toBe('Sky Blue');
  });

  it('stores measurements as a structured object of typed values', () => {
    const snapshot = buildCustomOrderSnapshot(baseFormData, curtainFields);

    expect(snapshot.measurements).toEqual({ height: 240, width: 120 });
    expect(snapshot.measurements.height).toBe(240);
    expect(typeof snapshot.measurements.height).toBe('number');
  });

  it('keeps TEXT measurement values as strings', () => {
    const snapshot = buildCustomOrderSnapshot(
      {
        ...baseFormData,
        measurementValues: { height: '240', width: '120', notes: 'Left window only' },
      },
      [
        ...curtainFields,
        {
          id: 'mf_notes',
          fieldKey: 'notes',
          label: 'Notes',
          description: null,
          inputType: 'TEXT',
          unit: null,
          placeholder: null,
          displayOrder: 3,
          isRequired: false,
          minValue: null,
          maxValue: null,
        },
      ],
    );

    expect(snapshot.measurements.notes).toBe('Left window only');
  });

  it('keeps every other custom-order field (steps 5-8 keep working)', () => {
    const snapshot = buildCustomOrderSnapshot(baseFormData, curtainFields);

    expect(snapshot.design).toBe('Floral');
    expect(snapshot.referenceImage).toBe('https://example.com/ref.jpg');
    expect(snapshot.quantity).toBe(2);
    expect(snapshot.customerName).toBe('Asha Verma');
    expect(snapshot.customerPhone).toBe('+919876543210');
    expect(snapshot.customerEmail).toBe('asha@example.com');
    expect(snapshot.customerAddress).toBe('Barabanki, UP');
    expect(snapshot.notes).toBe('Please pre-wash the fabric.');
  });

  it('snapshots names so history survives later admin renames', () => {
    const snapshot = buildCustomOrderSnapshot(baseFormData, curtainFields);

    // Even if "Curtains" / "Cotton" are renamed in admin later, the
    // submitted snapshot still shows what the customer picked.
    expect(snapshot.productTypeName).toBe('Curtains');
    expect(snapshot.fabricName).toBe('Cotton');
    expect(snapshot.colorName).toBe('Sky Blue');
  });

  it('captures measurements at snapshot time — later config changes cannot rewrite it', () => {
    const snapshot = buildCustomOrderSnapshot(baseFormData, curtainFields);

    // The snapshot only contains what the customer entered, keyed by
    // fieldKey; it does not reference the live configuration at all.
    expect(snapshot.measurements).toEqual({ height: 240, width: 120 });

    // Simulates an admin later deactivating Width or changing units —
    // nothing about the captured snapshot depends on the config anymore.
    const afterChange = buildCustomOrderSnapshot(baseFormData, [curtainFields[0]]);
    expect(afterChange.measurements).toEqual({ height: 240 });
    expect(snapshot.measurements).toEqual({ height: 240, width: 120 });
  });

  it('drops empty or unknown measurement values from the snapshot', () => {
    const snapshot = buildCustomOrderSnapshot(
      {
        ...baseFormData,
        measurementValues: { height: '240', width: '   ', ghost: '1' },
      },
      curtainFields,
    );

    expect(snapshot.measurements).toEqual({ height: 240 });
    expect(snapshot.measurements).not.toHaveProperty('ghost');
  });

  it('contains exactly the snapshot shape (no missing/extra fields)', () => {
    const snapshot = buildCustomOrderSnapshot(baseFormData, curtainFields);

    expect(Object.keys(snapshot).sort()).toEqual(
      [
        'colorId',
        'colorName',
        'customerAddress',
        'customerEmail',
        'customerName',
        'customerPhone',
        'design',
        'fabricId',
        'fabricName',
        'measurements',
        'notes',
        'productTypeId',
        'productTypeName',
        'quantity',
        'referenceImage',
      ].sort(),
    );
  });

  it('does not mutate the source form data', () => {
    const original = JSON.parse(JSON.stringify(baseFormData));
    buildCustomOrderSnapshot(baseFormData, curtainFields);
    expect(baseFormData).toEqual(original);
  });
});
