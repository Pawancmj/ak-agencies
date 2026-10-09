/**
 * Shared logic for the product-type-specific Measurement system
 * (Custom Order Step 4).
 *
 * The database configuration (active CustomOrderMeasurementField rows for
 * the selected product type) is the single source of truth for which
 * measurements a product requires — there is no product-specific logic
 * anywhere in this module or in the frontend.
 *
 * The same validation core runs client-side (Step 4 gating + inline
 * messages) and server-side (POST /api/custom-order/measurements/validate)
 * so the browser is never the only gate.
 */

export type MeasurementInputType = 'NUMBER' | 'TEXT';

export interface MeasurementFieldOption {
  id: string;
  fieldKey: string;
  label: string;
  description: string | null;
  inputType: MeasurementInputType;
  unit: string | null;
  placeholder: string | null;
  displayOrder: number;
  isRequired: boolean;
  minValue: number | null;
  maxValue: number | null;
}

export type MeasurementValues = Record<string, string>;

export interface MeasurementValidation {
  ok: boolean;
  /** Known, non-empty fields with NUMBER values coerced to numbers. */
  values: Record<string, number | string>;
  /** Inline messages keyed by fieldKey (only fields with problems). */
  errors: Record<string, string>;
  /** Submitted keys that are not part of the configuration. */
  unknownKeys: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Derives a fieldKey from a label: "Seat Depth" → "seat_depth",
 * "Back Height" → "back_height", "Height (cm)" → "height_cm".
 * Returns '' when the label has no letters or numbers.
 */
export function fieldKeyFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Conservative shape check for anything parsed from an API payload. */
function parseField(entry: unknown): MeasurementFieldOption | null {
  if (!isRecord(entry)) return null;
  if (typeof entry.id !== 'string' || entry.id.length === 0) return null;
  if (typeof entry.fieldKey !== 'string' || entry.fieldKey.length === 0) return null;
  if (typeof entry.label !== 'string' || entry.label.trim().length === 0) return null;
  if (entry.inputType !== 'NUMBER' && entry.inputType !== 'TEXT') return null;

  return {
    id: entry.id,
    fieldKey: entry.fieldKey,
    label: entry.label,
    description: typeof entry.description === 'string' ? entry.description : null,
    inputType: entry.inputType,
    unit: typeof entry.unit === 'string' ? entry.unit : null,
    placeholder: typeof entry.placeholder === 'string' ? entry.placeholder : null,
    displayOrder:
      typeof entry.displayOrder === 'number' && Number.isFinite(entry.displayOrder)
        ? entry.displayOrder
        : 0,
    isRequired: typeof entry.isRequired === 'boolean' ? entry.isRequired : true,
    minValue:
      typeof entry.minValue === 'number' && Number.isFinite(entry.minValue)
        ? entry.minValue
        : null,
    maxValue:
      typeof entry.maxValue === 'number' && Number.isFinite(entry.maxValue)
        ? entry.maxValue
        : null,
  };
}

export type MeasurementsResult =
  | { ok: true; fields: MeasurementFieldOption[] }
  | { ok: false };

/**
 * Parses GET /api/custom-order/product-types/[productTypeId]/measurements.
 * Malformed entries are skipped; a malformed envelope yields { ok: false }
 * so callers can show a retry state instead of crashing.
 */
export function parseMeasurementsResponse(payload: unknown): MeasurementsResult {
  if (!isRecord(payload) || payload.success !== true || !Array.isArray(payload.data)) {
    return { ok: false };
  }

  const fields: MeasurementFieldOption[] = [];
  for (const entry of payload.data) {
    const field = parseField(entry);
    if (field) fields.push(field);
  }

  return { ok: true, fields };
}

/** Config subset needed to validate a submission (client and server). */
export type MeasurementFieldConfig = Pick<
  MeasurementFieldOption,
  'fieldKey' | 'label' | 'inputType' | 'isRequired' | 'minValue' | 'maxValue'
>;

/**
 * Validates submitted values against a product type's measurement
 * configuration. Used on the client to gate Step 4 and inline errors,
 * and on the server as the authoritative check before an order is accepted.
 *
 * Rules:
 * - every key not in the configuration is rejected (unknownKeys)
 * - required fields must be present with a non-empty value
 * - NUMBER fields must parse as finite numbers and respect min/max
 * - empty optional fields are simply omitted from `values`
 */
export function validateMeasurementValues(
  fields: MeasurementFieldConfig[],
  submitted: Record<string, unknown>,
): MeasurementValidation {
  const errors: Record<string, string> = {};
  const values: Record<string, number | string> = {};
  const known = new Set(fields.map((f) => f.fieldKey));

  const unknownKeys = Object.keys(submitted).filter((key) => !known.has(key));
  for (const key of unknownKeys) {
    errors[key] = 'This measurement is not part of the product configuration';
  }

  for (const field of fields) {
    const raw = submitted[field.fieldKey];
    const present =
      raw !== undefined &&
      raw !== null &&
      (typeof raw === 'string' ? raw.trim().length > 0 : true);

    if (!present) {
      if (field.isRequired) {
        errors[field.fieldKey] = `${field.label} is required`;
      }
      continue;
    }

    if (field.inputType === 'TEXT') {
      values[field.fieldKey] = String(raw);
      continue;
    }

    const numeric = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (!Number.isFinite(numeric)) {
      errors[field.fieldKey] = `${field.label} must be a valid number`;
      continue;
    }
    if (field.minValue !== null && numeric < field.minValue) {
      errors[field.fieldKey] = `${field.label} must be at least ${field.minValue}`;
      continue;
    }
    if (field.maxValue !== null && numeric > field.maxValue) {
      errors[field.fieldKey] = `${field.label} must be at most ${field.maxValue}`;
      continue;
    }
    values[field.fieldKey] = numeric;
  }

  return {
    ok: Object.keys(errors).length === 0,
    values,
    errors,
    unknownKeys,
  };
}

/**
 * Converts raw input strings into the stored snapshot shape:
 * NUMBER fields become numbers, TEXT fields stay strings, and anything
 * empty or not part of the configuration is dropped.
 */
export function toSnapshotMeasurements(
  fields: Pick<MeasurementFieldOption, 'fieldKey' | 'inputType'>[],
  submitted: Record<string, unknown>,
): Record<string, number | string> {
  const out: Record<string, number | string> = {};

  for (const field of fields) {
    const raw = submitted[field.fieldKey];
    if (raw === undefined || raw === null) continue;
    if (typeof raw === 'string' && raw.trim().length === 0) continue;

    if (field.inputType === 'NUMBER') {
      const numeric = typeof raw === 'number' ? raw : Number(String(raw).trim());
      out[field.fieldKey] = Number.isFinite(numeric) ? numeric : String(raw);
    } else {
      out[field.fieldKey] = String(raw);
    }
  }

  return out;
}

/**
 * Step 1 selection helper: stores the chosen product type and clears any
 * measurements entered for a different product type so Curtain values are
 * never submitted for a Sofa Cover. Re-selecting the same type keeps the
 * customer's input.
 */
export function applyProductTypeSelection<
  T extends {
    productType: string;
    productTypeId: string;
    measurementValues: MeasurementValues;
  },
>(current: T, type: { id: string; name: string }): T {
  const changed = current.productTypeId !== type.id;
  return {
    ...current,
    productType: type.name,
    productTypeId: type.id,
    measurementValues: changed ? {} : current.measurementValues,
  };
}

/**
 * Human-readable summary for the review step, e.g.
 * "Height: 240 cm, Width: 120 cm". Returns '' when nothing is filled in
 * so the review row can be dropped entirely.
 */
export function formatMeasurementSummary(
  fields: Pick<
    MeasurementFieldOption,
    'fieldKey' | 'label' | 'inputType' | 'displayOrder' | 'unit'
  >[],
  submitted: Record<string, unknown>,
): string {
  const values = toSnapshotMeasurements(fields, submitted);
  const parts: string[] = [];

  for (const field of [...fields].sort((a, b) => a.displayOrder - b.displayOrder)) {
    const value = values[field.fieldKey];
    if (value === undefined) continue;
    parts.push(`${field.label}: ${value}${field.unit ? ` ${field.unit}` : ''}`);
  }

  return parts.join(', ');
}
