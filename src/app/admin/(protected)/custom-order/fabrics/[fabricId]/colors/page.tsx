'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Palette,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { SingleImageUploader } from '@/components/admin/single-image-uploader';

interface Fabric {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  colorCount: number;
  isActive: boolean;
}

interface Color {
  id: string;
  fabricId: string;
  name: string;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ColorForm {
  name: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

const emptyForm: ColorForm = {
  name: '',
  imageUrl: '',
  displayOrder: 0,
  isActive: true,
};

export default function FabricColorsPage() {
  const params = useParams<{ fabricId: string }>();
  const fabricId = params.fabricId;
  const router = useRouter();

  const [fabric, setFabric] = useState<Fabric | null>(null);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ColorForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Color | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fabricRes, colorsRes] = await Promise.all([
        fetch(`/api/admin/custom-order/fabrics/${fabricId}`),
        fetch(`/api/admin/custom-order/fabrics/${fabricId}/colors`),
      ]);
      const fabricJson = await fabricRes.json();
      const colorsJson = await colorsRes.json();

      if (!fabricJson.success) {
        setError(fabricJson.error ?? 'Fabric not found');
        return;
      }
      setFabric(fabricJson.data);

      if (colorsJson.success) setColors(colorsJson.data);
      else setError(colorsJson.error ?? 'Failed to load colors');
    } catch {
      setError('Failed to load colors');
    } finally {
      setLoading(false);
    }
  }, [fabricId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
    setFeedback(null);
  }

  function openEditModal(color: Color) {
    setEditingId(color.id);
    setForm({
      name: color.name,
      imageUrl: color.imageUrl ?? '',
      displayOrder: color.displayOrder,
      isActive: color.isActive,
    });
    setShowModal(true);
    setFeedback(null);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setFeedback(null);
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const body = editingId
        ? {
            name: form.name,
            // '' means the admin removed the image → clear it (null).
            imageUrl: form.imageUrl || null,
            displayOrder: form.displayOrder,
            isActive: form.isActive,
          }
        : {
            name: form.name,
            imageUrl: form.imageUrl,
            displayOrder: form.displayOrder,
            isActive: form.isActive,
          };

      const url = editingId
        ? `/api/admin/custom-order/colors/${editingId}`
        : `/api/admin/custom-order/fabrics/${fabricId}/colors`;
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
          message: editingId ? 'Color updated' : 'Color created',
        });
        await fetchData();
        setTimeout(closeModal, 1200);
      } else {
        setFeedback({ type: 'error', message: json.error ?? 'Failed to save' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save color' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(color: Color) {
    try {
      const res = await fetch(`/api/admin/custom-order/colors/${color.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !color.isActive }),
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
      const res = await fetch(`/api/admin/custom-order/colors/${deleteConfirm.id}`, {
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
      setFeedback({ type: 'error', message: 'Failed to delete color' });
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/admin/custom-order/fabrics')}
            className="inline-flex items-center gap-1.5 text-sm font-sans text-[#6B5E57] hover:text-[#5B1515] transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Fabrics
          </button>
          <h1 className="font-display text-2xl text-[#241B18]">
            {fabric ? `${fabric.name} — Colors` : 'Colors'}
          </h1>
          <p className="text-sm font-sans text-[#6B5E57] mt-1">
            These colors appear in Step 3 when a customer selects this fabric
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-sans font-medium text-white bg-[#5B1515] rounded-lg hover:bg-[#5B1515]/90 transition-colors"
        >
          <Plus size={16} />
          Add Color
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
            href="/admin/custom-order/fabrics"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-sans font-medium text-[#5B1515] hover:text-[#5B1515]/80"
          >
            <ArrowLeft size={14} />
            Back to Fabrics
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
                <div className="h-10 w-10 bg-[#F8F3EA] rounded-lg" />
                <div className="h-4 w-32 bg-[#F8F3EA] rounded" />
                <div className="h-4 w-16 bg-[#F8F3EA] rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border border-[#E8DFD6] overflow-hidden">
          {colors.length === 0 ? (
            <div className="p-12 text-center">
              <Palette className="mx-auto mb-3 text-[#6B5E57]/40" size={40} />
              <p className="text-sm font-sans text-[#6B5E57]">No colors yet for this fabric</p>
              <button
                onClick={openCreateModal}
                className="mt-3 text-sm font-sans font-medium text-[#5B1515] hover:text-[#5B1515]/80 transition-colors"
              >
                Add the first color
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-[#E8DFD6] bg-[#F8F3EA]/50">
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Image</th>
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Name</th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">
                      Display Order
                    </th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Created</th>
                    <th className="text-right px-5 py-3 font-medium text-[#6B5E57]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.map((color) => (
                    <tr
                      key={color.id}
                      className="border-b border-[#E8DFD6] last:border-0 hover:bg-[#FCFAF6] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F8F3EA] border border-[#E8DFD6] flex items-center justify-center">
                          {color.imageUrl ? (
                            <img
                              src={color.imageUrl}
                              alt={color.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Palette size={16} className="text-[#6B5E57]/40" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#241B18]">{color.name}</td>
                      <td className="px-5 py-3 text-center text-[#6B5E57]">
                        {color.displayOrder}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(color)}
                          title={
                            color.isActive
                              ? 'Deactivate — hide from the Custom Order page'
                              : 'Activate — show on the Custom Order page'
                          }
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans font-medium rounded-full border transition-colors ${
                            color.isActive
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              color.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {color.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-[#6B5E57]">
                        {new Date(color.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(color)}
                            className="p-1.5 text-[#6B5E57] hover:text-[#5B1515] hover:bg-[#F8F3EA] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(color)}
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

      {/* Delete confirmation (soft delete — deactivates the color) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl border border-[#E8DFD6] w-full max-w-sm mx-4 shadow-xl p-5">
            <p className="text-sm font-sans text-[#241B18] mb-1">
              Are you sure you want to delete this color?
            </p>
            <p className="text-sm font-sans font-medium text-[#5B1515] mb-5">
              {deleteConfirm.name}
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
          <div className="bg-white rounded-xl border border-[#E8DFD6] w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8DFD6]">
              <h2 className="font-display text-lg text-[#241B18]">
                {editingId ? 'Edit Color' : 'New Color'}
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
                  Color Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
                  placeholder="e.g. Sky Blue"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                  Color Image *
                </label>
                <SingleImageUploader
                  value={form.imageUrl}
                  onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
                    min={0}
                    max={9999}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
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
                disabled={saving || !form.name.trim() || !form.imageUrl.trim()}
                title={
                  !form.name.trim()
                    ? 'Color name is required'
                    : !form.imageUrl.trim()
                    ? 'Color image is required'
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
