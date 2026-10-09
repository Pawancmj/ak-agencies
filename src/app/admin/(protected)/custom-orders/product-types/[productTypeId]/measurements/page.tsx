'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Ruler,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { fieldKeyFromLabel } from '@/lib/custom-order-measurements';

interface ProductType {
  id: string;
  name: string;
  slug: string;
}

interface MeasurementField {
  id: string;
  productTypeId: string;
  label: string;
  fieldKey: string;
  description: string | null;
  inputType: 'NUMBER' | 'TEXT';
  unit: string | null;
  placeholder: string | null;
  displayOrder: number;
  isRequired: boolean;
  minValue: number | null;
  maxValue: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MeasurementForm {
  label: string;
  fieldKey: string;
  description: string;
  inputType: 'NUMBER' | 'TEXT';
  unit: string;
  placeholder: string;
  displayOrder: number;
  isRequired: boolean;
  minValue: string;
  maxValue: string;
  isActive: boolean;
}

const emptyForm: MeasurementForm = {
  label: '',
  fieldKey: '',
  description: '',
  inputType: 'NUMBER',
  unit: '',
  placeholder: '',
  displayOrder: 0,
  isRequired: true,
  minValue: '',
  maxValue: '',
  isActive: true,
};

const inputClasses =
  'w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]';

export default function ProductTypeMeasurementsPage() {
  const params = useParams<{ productTypeId: string }>();
  const productTypeId = params.productTypeId;
  const router = useRouter();

  const [productType, setProductType] = useState<ProductType | null>(null);
  const [fields, setFields] = useState<MeasurementField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MeasurementForm>(emptyForm);
  const [autoKey, setAutoKey] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MeasurementField | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [typeRes, fieldsRes] = await Promise.all([
        fetch(`/api/admin/custom-orders/product-types/${productTypeId}`),
        fetch(`/api/admin/custom-order/product-types/${productTypeId}/measurements`),
      ]);
      const typeJson = await typeRes.json();
      const fieldsJson = await fieldsRes.json();

      if (!typeJson.success) {
        setError(typeJson.error ?? 'Product type not found');
        return;
      }
      setProductType(typeJson.data);

      if (fieldsJson.success) setFields(fieldsJson.data);
      else setError(fieldsJson.error ?? 'Failed to load measurement fields');
    } catch {
      setError('Failed to load measurement fields');
    } finally {
      setLoading(false);
    }
  }, [productTypeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setAutoKey(true);
    setShowModal(true);
    setFeedback(null);
  }

  function openEditModal(field: MeasurementField) {
    setEditingId(field.id);
    setForm({
      label: field.label,
      fieldKey: field.fieldKey,
      description: field.description ?? '',
      inputType: field.inputType,
      unit: field.unit ?? '',
      placeholder: field.placeholder ?? '',
      displayOrder: field.displayOrder,
      isRequired: field.isRequired,
      minValue: field.minValue === null ? '' : String(field.minValue),
      maxValue: field.maxValue === null ? '' : String(field.maxValue),
      isActive: field.isActive,
    });
    setAutoKey(false);
    setShowModal(true);
    setFeedback(null);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setFeedback(null);
  }

  function handleLabelChange(label: string) {
    setForm((prev) => ({
      ...prev,
      label,
      fieldKey: autoKey ? fieldKeyFromLabel(label) : prev.fieldKey,
    }));
  }

  const minMaxInvalid =
    form.minValue !== '' &&
    form.maxValue !== '' &&
    Number(form.minValue) > Number(form.maxValue);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const body = {
        label: form.label,
        ...(form.fieldKey.trim() ? { fieldKey: form.fieldKey.trim() } : {}),
        description: form.description || null,
        inputType: form.inputType,
        unit: form.unit || null,
        placeholder: form.placeholder || null,
        displayOrder: form.displayOrder,
        isRequired: form.isRequired,
        minValue: form.minValue === '' ? null : Number(form.minValue),
        maxValue: form.maxValue === '' ? null : Number(form.maxValue),
        isActive: form.isActive,
      };

      const url = editingId
        ? `/api/admin/custom-order/measurements/${editingId}`
        : `/api/admin/custom-order/product-types/${productTypeId}/measurements`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({
          type: 'success',
          message: editingId ? 'Measurement field updated' : 'Measurement field created',
        });
        await fetchData();
        setTimeout(closeModal, 1200);
      } else {
        setFeedback({ type: 'error', message: json.error ?? 'Failed to save' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save measurement field' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(field: MeasurementField) {
    try {
      const res = await fetch(`/api/admin/custom-order/measurements/${field.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !field.isActive }),
      });
      const json = await res.json();
      if (json.success) await fetchData();
    } catch {
      // silent
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/admin/custom-order/measurements/${deleteConfirm.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirm(null);
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: json.error ?? 'Failed to delete' });
        setDeleteConfirm(null);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete measurement field' });
      setDeleteConfirm(null);
    }
  }

  function formatRange(field: MeasurementField) {
    if (field.inputType !== 'NUMBER') return '—';
    if (field.minValue === null && field.maxValue === null) return '—';
    if (field.minValue !== null && field.maxValue !== null) {
      return `${field.minValue} – ${field.maxValue}`;
    }
    if (field.minValue !== null) return `≥ ${field.minValue}`;
    return `≤ ${field.maxValue}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/admin/custom-orders/product-types')}
            className="inline-flex items-center gap-1.5 text-sm font-sans text-[#6B5E57] hover:text-[#5B1515] transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Product Types
          </button>
          <h1 className="font-display text-2xl text-[#241B18]">
            {productType ? `${productType.name} — Measurements` : 'Measurements'}
          </h1>
          <p className="text-sm font-sans text-[#6B5E57] mt-1">
            These fields appear in Step 4 when a customer selects this product type
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-sans font-medium text-white bg-[#5B1515] rounded-lg hover:bg-[#5B1515]/90 transition-colors"
        >
          <Plus size={16} />
          Add Measurement Field
        </button>
      </div>

      {/* Feedback */}
      {feedback && !showModal && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm font-sans ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600 font-sans">{error}</p>
          <Link
            href="/admin/custom-orders/product-types"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-sans font-medium text-[#5B1515] hover:text-[#5B1515]/80"
          >
            <ArrowLeft size={14} />
            Back to Product Types
          </Link>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="bg-white rounded-xl border border-[#E8DFD6] overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-[#F8F3EA] border-b border-[#E8DFD6]" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 border-b border-[#E8DFD6] last:border-0 flex items-center px-5 gap-4"
              >
                <div className="h-4 w-32 bg-[#F8F3EA] rounded" />
                <div className="h-4 w-24 bg-[#F8F3EA] rounded" />
                <div className="h-4 w-16 bg-[#F8F3EA] rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border border-[#E8DFD6] overflow-hidden">
          {fields.length === 0 ? (
            <div className="p-12 text-center">
              <Ruler className="mx-auto mb-3 text-[#6B5E57]/40" size={40} />
              <p className="text-sm font-sans text-[#6B5E57]">
                No measurement fields yet for this product type
              </p>
              <button
                onClick={openCreateModal}
                className="mt-3 text-sm font-sans font-medium text-[#5B1515] hover:text-[#5B1515]/80 transition-colors"
              >
                Add the first field
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-[#E8DFD6] bg-[#F8F3EA]/50">
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Label</th>
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Field Key</th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">
                      Input Type
                    </th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">Unit</th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">
                      Required
                    </th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">
                      Range
                    </th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">
                      Display Order
                    </th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">Status</th>
                    <th className="text-right px-5 py-3 font-medium text-[#6B5E57]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr
                      key={field.id}
                      className="border-b border-[#E8DFD6] last:border-0 hover:bg-[#FCFAF6] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="font-medium text-[#241B18]">{field.label}</span>
                        {field.description && (
                          <span className="block text-xs text-[#6B5E57] mt-0.5 max-w-xs truncate">
                            {field.description}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <code className="text-xs bg-[#F8F3EA] border border-[#E8DFD6] rounded px-1.5 py-0.5 text-[#5B1515]">
                          {field.fieldKey}
                        </code>
                      </td>
                      <td className="px-5 py-3 text-center text-[#6B5E57]">
                        {field.inputType === 'NUMBER' ? 'Number' : 'Text'}
                      </td>
                      <td className="px-5 py-3 text-center text-[#6B5E57]">
                        {field.unit ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-center text-[#6B5E57]">
                        {field.isRequired ? 'Yes' : 'No'}
                      </td>
                      <td className="px-5 py-3 text-center text-[#6B5E57]">
                        {formatRange(field)}
                      </td>
                      <td className="px-5 py-3 text-center text-[#6B5E57]">
                        {field.displayOrder}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(field)}
                          title={
                            field.isActive
                              ? 'Deactivate — hide from Step 4 of the Custom Order page'
                              : 'Activate — show in Step 4 of the Custom Order page'
                          }
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans font-medium rounded-full border transition-colors ${
                            field.isActive
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              field.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {field.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(field)}
                            className="p-1.5 text-[#6B5E57] hover:text-[#5B1515] hover:bg-[#F8F3EA] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(field)}
                            className="p-1.5 text-[#6B5E57] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation (soft delete — deactivates the field) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl border border-[#E8DFD6] w-full max-w-sm mx-4 shadow-xl p-5">
            <p className="text-sm font-sans text-[#241B18] mb-1">
              Are you sure you want to delete this measurement field?
            </p>
            <p className="text-sm font-sans font-medium text-[#5B1515] mb-2">
              {deleteConfirm.label}
            </p>
            <p className="text-xs font-sans text-[#6B5E57] mb-5">
              The field is deactivated, not removed — existing order snapshots are
              unaffected and you can re-activate it later.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-sans font-medium text-[#6B5E57] border border-[#E8DFD6] rounded-lg hover:bg-[#F8F3EA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-sans font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl border border-[#E8DFD6] w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8DFD6]">
              <h2 className="font-display text-lg text-[#241B18]">
                {editingId ? 'Edit Measurement Field' : 'New Measurement Field'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-[#6B5E57] hover:text-[#241B18] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {feedback && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg text-sm font-sans ${
                    feedback.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {feedback.type === 'success' ? <Check size={16} /> : <X size={16} />}
                  {feedback.message}
                </div>
              )}

              <div>
                <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                  Field Label *
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className={inputClasses}
                  placeholder="e.g. Seat Depth"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                  Field Key
                </label>
                <input
                  type="text"
                  value={form.fieldKey}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, fieldKey: e.target.value }));
                    setAutoKey(false);
                  }}
                  className={inputClasses}
                  placeholder="seat_depth"
                  maxLength={50}
                />
                <p className="text-xs font-sans text-[#6B5E57] mt-1">
                  Generated from the label. Lowercase letters, numbers, and underscores
                  only. Unique per product type — this is the key stored in order
                  snapshots.
                </p>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className={`${inputClasses} resize-none`}
                  placeholder="e.g. Enter seat depth measured from the front edge to the backrest"
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                    Input Type
                  </label>
                  <select
                    value={form.inputType}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        inputType: e.target.value === 'TEXT' ? 'TEXT' : 'NUMBER',
                      }))
                    }
                    className={inputClasses}
                  >
                    <option value="NUMBER">Number</option>
                    <option value="TEXT">Text</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                    className={inputClasses}
                    placeholder="cm"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={form.placeholder}
                    onChange={(e) => setForm((p) => ({ ...p, placeholder: e.target.value }))}
                    className={inputClasses}
                    placeholder="Enter height"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        displayOrder: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className={inputClasses}
                    min={0}
                    max={9999}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                    Minimum Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.minValue}
                    onChange={(e) => setForm((p) => ({ ...p, minValue: e.target.value }))}
                    className={inputClasses}
                    placeholder="e.g. 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                    Maximum Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.maxValue}
                    onChange={(e) => setForm((p) => ({ ...p, maxValue: e.target.value }))}
                    className={inputClasses}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              {minMaxInvalid && (
                <p className="text-xs font-sans text-red-600">
                  Minimum value cannot exceed maximum value
                </p>
              )}

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRequired}
                    onChange={(e) => setForm((p) => ({ ...p, isRequired: e.target.checked }))}
                    className="w-4 h-4 rounded border-[#E8DFD6] text-[#5B1515] focus:ring-[#5B1515]/20"
                  />
                  <span className="text-sm font-sans text-[#241B18]">Required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-[#E8DFD6] text-[#5B1515] focus:ring-[#5B1515]/20"
                  />
                  <span className="text-sm font-sans text-[#241B18]">Active</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#E8DFD6]">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-sans font-medium text-[#6B5E57] border border-[#E8DFD6] rounded-lg hover:bg-[#F8F3EA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.label.trim() || minMaxInvalid}
                title={
                  !form.label.trim()
                    ? 'Field label is required'
                    : minMaxInvalid
                    ? 'Minimum value cannot exceed maximum value'
                    : undefined
                }
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-sans font-medium text-white bg-[#5B1515] rounded-lg hover:bg-[#5B1515]/90 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
