import { describe, it, expect } from 'vitest';
import {
  fieldKeyFromLabel,
  parseMeasurementsResponse,
  validateMeasurementValues,
  toSnapshotMeasurements,
  applyProductTypeSelection,
  formatMeasurementSummary,
  type MeasurementFieldOption,
} from '@/lib/custom-order-measurements';

function makeField(overrides: Partial<MeasurementFieldOption> & { fieldKey: string }): MeasurementFieldOption {
  return {
    id: `mf_${overrides.fieldKey}`,
    label: overrides.fieldKey,
    description: null,
    inputType: 'NUMBER',
    unit: null,
    placeholder: null,
    displayOrder: 1,
    isRequired: true,
    minValue: null,
    maxValue: null,
    ...overrides,
  };
}

// Curtains (spec example): Height + Width, NUMBER, cm, required, 1–500.
const curtainsFields: MeasurementFieldOption[] = [
  makeField({
    id: 'mf_height',
    fieldKey: 'height',
    label: 'Height',
    unit: 'cm',
    displayOrder: 1,
    minValue: 1,
    maxValue: 500,
    placeholder: 'Enter height',
  }),
  makeField({
    id: 'mf_width',
    fieldKey: 'width',
    label: 'Width',
    unit: 'cm',
    displayOrder: 2,
  }),
];

// Sofa Cover (spec example): four independent fields.
const sofaCoverFields: MeasurementFieldOption[] = [
  makeField({ id: 'mf_length', fieldKey: 'length', label: 'Length', displayOrder: 1 }),
  makeField({ id: 'mf_sofa_width', fieldKey: 'width', label: 'Width', displayOrder: 2 }),
  makeField({ id: 'mf_seat_depth', fieldKey: 'seat_depth', label: 'Seat Depth', displayOrder: 3 }),
  makeField({ id: 'mf_back_height', fieldKey: 'back_height', label: 'Back Height', displayOrder: 4 }),
];

// ─── fieldKey derivation ─────────────────────────────────────

describe('fieldKeyFromLabel', () => {
  it('converts "Seat Depth" → seat_depth and "Back Height" → back_height', () => {
    expect(fieldKeyFromLabel('Seat Depth')).toBe('seat_depth');
    expect(fieldKeyFromLabel('Back Height')).toBe('back_height');
  });

  it('collapses punctuation and trims stray underscores', () => {
    expect(fieldKeyFromLabel('Height (cm)')).toBe('height_cm');
    expect(fieldKeyFromLabel('  Total   Width  ')).toBe('total_width');
    expect(fieldKeyFromLabel('A / B')).toBe('a_b');
  });

  it('returns an empty string when there are no letters or numbers', () => {
    expect(fieldKeyFromLabel('!!!')).toBe('');
    expect(fieldKeyFromLabel('   ')).toBe('');
  });
});

// ─── response parsing ────────────────────────────────────────

describe('parseMeasurementsResponse', () => {
  const envelope = {
    success: true,
    data: [
      {
        id: 'mf_height',
        label: 'Height',
        fieldKey: 'height',
        description: 'Rod to floor',
        inputType: 'NUMBER',
        unit: 'cm',
        placeholder: 'Enter height',
        displayOrder: 1,
        isRequired: true,
        minValue: 1,
        maxValue: 500,
      },
      {
        id: 'mf_notes',
        label: 'Measurement Notes',
        fieldKey: 'notes',
        description: null,
        inputType: 'TEXT',
        unit: null,
        placeholder: null,
        displayOrder: 2,
        isRequired: false,
        minValue: null,
        maxValue: null,
      },
    ],
  };

  it('parses a valid payload', () => {
    const parsed = parseMeasurementsResponse(envelope);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.fields).toHaveLength(2);
    expect(parsed.fields[0]).toMatchObject({
      fieldKey: 'height',
      inputType: 'NUMBER',
      unit: 'cm',
      isRequired: true,
      minValue: 1,
      maxValue: 500,
    });
    expect(parsed.fields[1].inputType).toBe('TEXT');
    expect(parsed.fields[1].isRequired).toBe(false);
  });

  it('rejects error and malformed envelopes', () => {
    expect(parseMeasurementsResponse({ success: false, error: 'x' }).ok).toBe(false);
    expect(parseMeasurementsResponse(null).ok).toBe(false);
    expect(parseMeasurementsResponse('nope').ok).toBe(false);
    expect(parseMeasurementsResponse({ success: true, data: 'not-an-array' }).ok).toBe(false);
  });

  it('skips individual malformed entries', () => {
    const parsed = parseMeasurementsResponse({
      success: true,
      data: [
        null,
        { id: '', label: 'X', fieldKey: 'x', inputType: 'NUMBER' },
        { id: 'a', label: 'No Key', inputType: 'NUMBER' },
        { id: 'b', label: 'Bad Type', fieldKey: 'bad', inputType: 'RADIO' },
        { id: 'c', label: 'Good', fieldKey: 'good', inputType: 'NUMBER' },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.fields.map((f) => f.fieldKey)).toEqual(['good']);
  });
});

// ─── validation (client gate + server gate share this code) ──

describe('validateMeasurementValues — Curtains returns Height + Width only', () => {
  it('accepts valid numeric values and coerces them to numbers', () => {
    const result = validateMeasurementValues(curtainsFields, { height: '240', width: '120' });
    expect(result.ok).toBe(true);
    expect(result.values).toEqual({ height: 240, width: 120 });
    expect(result.errors).toEqual({});
  });

  it('supports decimal values', () => {
    const result = validateMeasurementValues(curtainsFields, { height: '24.5', width: '120.75' });
    expect(result.ok).toBe(true);
    expect(result.values).toEqual({ height: 24.5, width: 120.75 });
  });

  it('rejects a missing required field', () => {
    const result = validateMeasurementValues(curtainsFields, { height: '240' });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual({ width: 'Width is required' });
  });

  it('rejects an empty required field', () => {
    const result = validateMeasurementValues(curtainsFields, { height: '   ', width: '120' });
    expect(result.ok).toBe(false);
    expect(result.errors.height).toContain('required');
  });

  it('rejects a non-numeric NUMBER value', () => {
    const result = validateMeasurementValues(curtainsFields, { height: 'abc', width: '120' });
    expect(result.ok).toBe(false);
    expect(result.errors.height).toBe('Height must be a valid number');
  });

  it('enforces minValue and maxValue', () => {
    const tooSmall = validateMeasurementValues(curtainsFields, { height: '0', width: '120' });
    expect(tooSmall.ok).toBe(false);
    expect(tooSmall.errors.height).toBe('Height must be at least 1');

    const tooBig = validateMeasurementValues(curtainsFields, { height: '501', width: '120' });
    expect(tooBig.ok).toBe(false);
    expect(tooBig.errors.height).toBe('Height must be at most 500');

    const atBounds = validateMeasurementValues(curtainsFields, { height: '1', width: '120' });
    expect(atBounds.ok).toBe(true);
  });

  it('rejects an unknown measurement key (never blindly accepted)', () => {
    const result = validateMeasurementValues(curtainsFields, {
      height: '240',
      width: '120',
      random_field: 'oops',
    });
    expect(result.ok).toBe(false);
    expect(result.unknownKeys).toEqual(['random_field']);
    expect(result.errors.random_field).toContain('not part of the product configuration');
  });

  it('allows an empty optional field (omitted from values)', () => {
    const optionalWidth = curtainsFields.map((f) =>
      f.fieldKey === 'width' ? { ...f, isRequired: false } : f,
    );
    const result = validateMeasurementValues(optionalWidth, { height: '240', width: '' });
    expect(result.ok).toBe(true);
    expect(result.values).toEqual({ height: 240 });
  });

  it('treats a product with no configured fields as valid (empty submission)', () => {
    expect(validateMeasurementValues([], {})).toMatchObject({ ok: true, values: {} });
  });
});

describe('validateMeasurementValues — Sofa Cover is isolated from Curtains', () => {
  it("accepts Sofa Cover's own four fields", () => {
    const result = validateMeasurementValues(sofaCoverFields, {
      length: '180',
      width: '90',
      seat_depth: '60',
      back_height: '80',
    });
    expect(result.ok).toBe(true);
    expect(result.values).toEqual({
      length: 180,
      width: 90,
      seat_depth: 60,
      back_height: 80,
    });
  });

  it("rejects Curtain-style input against Sofa Cover's config", () => {
    const result = validateMeasurementValues(sofaCoverFields, { height: '240' });
    expect(result.ok).toBe(false);
    expect(result.unknownKeys).toEqual(['height']);
    expect(result.errors.length).toBe('Length is required');
  });
});

describe('validateMeasurementValues — TEXT fields', () => {
  const noteField = [
    makeField({
      fieldKey: 'notes',
      label: 'Measurement Notes',
      inputType: 'TEXT',
      isRequired: false,
      displayOrder: 3,
    }),
  ];

  it('accepts any text and keeps it a string', () => {
    const result = validateMeasurementValues(noteField, { notes: 'Door on the left' });
    expect(result.ok).toBe(true);
    expect(result.values.notes).toBe('Door on the left');
  });

  it('rejects a required TEXT field that is empty', () => {
    const result = validateMeasurementValues(
      [{ ...noteField[0], isRequired: true }],
      { notes: '' },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.notes).toBe('Measurement Notes is required');
  });
});

// ─── snapshot value conversion ───────────────────────────────

describe('toSnapshotMeasurements', () => {
  it('coerces NUMBER fields and keeps TEXT fields as strings', () => {
    const result = toSnapshotMeasurements(
      [
        ...curtainsFields,
        makeField({ fieldKey: 'notes', label: 'Notes', inputType: 'TEXT', isRequired: false }),
      ],
      { height: '240', width: '120.5', notes: 'Left window only' },
    );
    expect(result).toEqual({ height: 240, width: 120.5, notes: 'Left window only' });
  });

  it('drops empty values and keys outside the configuration', () => {
    const result = toSnapshotMeasurements(curtainsFields, {
      height: '240',
      width: '  ',
      ghost: '1',
    });
    expect(result).toEqual({ height: 240 });
  });
});

// ─── Step 1 product-type switching ───────────────────────────

describe('applyProductTypeSelection (changing product type clears measurements)', () => {
  const current = {
    productType: 'Curtains',
    productTypeId: 'copt_seed_curtains',
    fabric: 'Cotton',
    fabricId: 'cof_seed_cotton',
    measurementValues: { height: '240', width: '120' },
  };

  it('clears measurements when the product type changes', () => {
    const next = applyProductTypeSelection(current, {
      id: 'copt_seed_sofa_cover',
      name: 'Sofa Cover',
    });

    expect(next.productTypeId).toBe('copt_seed_sofa_cover');
    expect(next.productType).toBe('Sofa Cover');
    expect(next.measurementValues).toEqual({});
    // unrelated state survives
    expect(next.fabricId).toBe('cof_seed_cotton');
  });

  it('keeps measurements when the same product type is re-selected', () => {
    const next = applyProductTypeSelection(current, {
      id: 'copt_seed_curtains',
      name: 'Curtains',
    });
    expect(next.measurementValues).toEqual({ height: '240', width: '120' });
  });

  it('does not mutate the current state object', () => {
    applyProductTypeSelection(current, { id: 'copt_seed_sofa_cover', name: 'Sofa Cover' });
    expect(current.measurementValues).toEqual({ height: '240', width: '120' });
  });
});

// ─── review-step summary ─────────────────────────────────────

describe('formatMeasurementSummary', () => {
  it('formats label + value + unit in display order', () => {
    expect(
      formatMeasurementSummary(curtainsFields, { height: '240', width: '120' }),
    ).toBe('Height: 240 cm, Width: 120 cm');
  });

  it('returns an empty string when nothing is entered', () => {
    expect(formatMeasurementSummary(curtainsFields, {})).toBe('');
    expect(
      formatMeasurementSummary(curtainsFields, { height: '', width: '   ' }),
    ).toBe('');
  });

  it('omits fields that are not filled in', () => {
    expect(formatMeasurementSummary(curtainsFields, { height: '240' })).toBe('Height: 240 cm');
  });
});
