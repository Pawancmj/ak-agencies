'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Scissors, Plus, Pencil, Trash2, X, Check, Loader2, Search, Ruler } from 'lucide-react';
import { slugify } from '@/lib/utils';

interface ProductType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductTypeForm {
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

const emptyForm: ProductTypeForm = {
  name: '',
  slug: '',
  description: '',
  displayOrder: 0,
  isActive: true,
};

export default function ProductTypesPage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductTypeForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<ProductType | null>(null);

  const fetchProductTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedSearch) params.set('search', appliedSearch);
      if (status) params.set('status', status);
      const query = params.toString();

      const res = await fetch(`/api/admin/custom-orders/product-types${query ? `?${query}` : ''}`);
      const json = await res.json();
      if (json.success) setProductTypes(json.data);
      else setError(json.error ?? 'Failed to load product types');
    } catch {
      setError('Failed to load product types');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, status]);

  useEffect(() => {
    fetchProductTypes();
  }, [fetchProductTypes]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setAutoSlug(true);
    setShowModal(true);
    setFeedback(null);
  }

  function openEditModal(type: ProductType) {
    setEditingId(type.id);
    setForm({
      name: type.name,
      slug: type.slug,
      description: type.description ?? '',
      displayOrder: type.displayOrder,
      isActive: type.isActive,
    });
    setAutoSlug(false);
    setShowModal(true);
    setFeedback(null);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setFeedback(null);
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: autoSlug ? slugify(name) : prev.slug,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const body = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || undefined,
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      };

      const url = editingId
        ? `/api/admin/custom-orders/product-types/${editingId}`
        : '/api/admin/custom-orders/product-types';
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
          message: editingId ? 'Product type updated' : 'Product type created',
        });
        await fetchProductTypes();
        setTimeout(closeModal, 1200);
      } else {
        setFeedback({ type: 'error', message: json.error ?? 'Failed to save' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save product type' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(type: ProductType) {
    try {
      const res = await fetch(`/api/admin/custom-orders/product-types/${type.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !type.isActive }),
      });
      const json = await res.json();
      if (json.success) await fetchProductTypes();
    } catch {
      // silent
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/admin/custom-orders/product-types/${deleteConfirm.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirm(null);
        await fetchProductTypes();
      } else {
        setFeedback({ type: 'error', message: json.error ?? 'Failed to delete' });
        setDeleteConfirm(null);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete product type' });
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-[#241B18]">Product Types</h1>
          <p className="text-sm font-sans text-[#6B5E57] mt-1">
            Manage the product types shown on the Custom Order page
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-sans font-medium text-white bg-[#5B1515] rounded-lg hover:bg-[#5B1515]/90 transition-colors"
        >
          <Plus size={16} />
          Add Product Type
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E8DFD6] p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5E57]"
            />
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] placeholder:text-[#6B5E57]/50 focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-sans font-medium text-white bg-[#5B1515] rounded-lg hover:bg-[#5B1515]/90 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600 font-sans">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="bg-white rounded-xl border border-[#E8DFD6] overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-[#F8F3EA] border-b border-[#E8DFD6]" />
            {Array.from({ length: 4 }).map((_, i) => (
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
          {productTypes.length === 0 ? (
            <div className="p-12 text-center">
              <Scissors className="mx-auto mb-3 text-[#6B5E57]/40" size={40} />
              <p className="text-sm font-sans text-[#6B5E57]">
                {appliedSearch || status ? 'No product types found' : 'No product types yet'}
              </p>
              {!appliedSearch && !status && (
                <button
                  onClick={openCreateModal}
                  className="mt-3 text-sm font-sans font-medium text-[#5B1515] hover:text-[#5B1515]/80 transition-colors"
                >
                  Create your first product type
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-[#E8DFD6] bg-[#F8F3EA]/50">
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Name</th>
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Slug</th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">
                      Display Order
                    </th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Created</th>
                    <th className="text-right px-5 py-3 font-medium text-[#6B5E57]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productTypes.map((type) => (
                    <tr
                      key={type.id}
                      className="border-b border-[#E8DFD6] last:border-0 hover:bg-[#FCFAF6] transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-[#241B18]">{type.name}</td>
                      <td className="px-5 py-3 text-[#6B5E57]">{type.slug}</td>
                      <td className="px-5 py-3 text-center text-[#6B5E57]">
                        {type.displayOrder}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(type)}
                          title={
                            type.isActive
                              ? 'Deactivate — hide from the Custom Order page'
                              : 'Activate — show on the Custom Order page'
                          }
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans font-medium rounded-full border transition-colors ${
                            type.isActive
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              type.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {type.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-[#6B5E57]">
                        {new Date(type.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/custom-orders/product-types/${type.id}/measurements`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-sans font-medium text-[#5B1515] border border-[#E8DFD6] rounded-lg hover:bg-[#F8F3EA] transition-colors"
                            title="Manage the measurement fields customers fill in for this product type"
                          >
                            <Ruler size={13} />
                            Manage Measurements
                          </Link>
                          <button
                            onClick={() => openEditModal(type)}
                            className="p-1.5 text-[#6B5E57] hover:text-[#5B1515] hover:bg-[#F8F3EA] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(type)}
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

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl border border-[#E8DFD6] w-full max-w-sm mx-4 shadow-xl p-5">
            <p className="text-sm font-sans text-[#241B18] mb-1">
              Are you sure you want to delete this product type?
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
                {editingId ? 'Edit Product Type' : 'New Product Type'}
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
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
                  placeholder="e.g. Roman Blinds"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, slug: e.target.value }));
                    setAutoSlug(false);
                  }}
                  className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
                  placeholder="roman-blinds"
                  maxLength={100}
                />
                <p className="text-xs font-sans text-[#6B5E57] mt-1">
                  Generated from the name. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515] resize-none"
                  placeholder="Optional description"
                  maxLength={500}
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
                disabled={saving || !form.name.trim() || !(form.slug || slugify(form.name)).trim()}
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
