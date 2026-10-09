/**
 * Builds the snapshot taken when the customer reviews / submits a custom
 * order. Prefers IDs (fabricId / colorId / productTypeId) internally while
 * keeping name snapshots (productTypeName / fabricName / colorName) so
 * historical submissions stay understandable even if an admin later
 * renames anything.
 *
 * `measurements` is stored as a structured object keyed by fieldKey
 * (e.g. { height: 240, width: 120 }) captured at submit time — later
 * admin changes to the measurement configuration never rewrite history.
 *
 * The existing Custom Order flow is client-side only (no submission API),
 * so this snapshot backs the Review step and is the payload shape a future
 * endpoint can persist as-is.
 */
import type { MeasurementFieldOption } from './custom-order-measurements';
import { toSnapshotMeasurements } from './custom-order-measurements';

export interface CustomOrderFormData {
  productType: string;
  productTypeId: string;
  fabric: string;
  fabricId: string;
  color: string;
  colorId: string;
  /** Raw Step 4 input strings keyed by fieldKey. */
  measurementValues: Record<string, string>;
  design: string;
  referenceImage: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  notes: string;
}

export interface CustomOrderSnapshot {
  productTypeId: string;
  productTypeName: string;
  fabricId: string;
  fabricName: string;
  colorId: string;
  colorName: string;
  /** Typed values keyed by fieldKey, e.g. { height: 240, width: 120 }. */
  measurements: Record<string, number | string>;
  design: string;
  referenceImage: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  notes: string;
}

export function buildCustomOrderSnapshot(
  formData: CustomOrderFormData,
  measurementFields: MeasurementFieldOption[] = [],
): CustomOrderSnapshot {
  return {
    productTypeId: formData.productTypeId,
    productTypeName: formData.productType,
    fabricId: formData.fabricId,
    fabricName: formData.fabric,
    colorId: formData.colorId,
    colorName: formData.color,
    measurements: toSnapshotMeasurements(measurementFields, formData.measurementValues),
    design: formData.design,
    referenceImage: formData.referenceImage,
    quantity: formData.quantity,
    customerName: formData.customerName,
    customerPhone: formData.customerPhone,
    customerEmail: formData.customerEmail,
    customerAddress: formData.customerAddress,
    notes: formData.notes,
  };
}
