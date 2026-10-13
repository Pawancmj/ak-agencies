'use client';

import { useEffect, useState, useCallback } from 'react';
import { Quote, Plus, Pencil, Trash2, X, Check, Loader2, Search, Star } from 'lucide-react';
import { SingleImageUploader } from '@/components/admin/single-image-uploader';

interface Testimonial {
  id: string;
  customerName: string;
  reviewText: string;
  customerImageUrl: string | null;
  productName: string | null;
  rating: number;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TestimonialForm {
  customerName: string;
  reviewText: string;
  productName: string;
  rating: number;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  customerImageUrl: string;
}

const emptyForm: TestimonialForm = {
  customerName: '',
  reviewText: '',
  productName: '',
  rating: 5,
  displayOrder: 0,
  isActive: true,
  isFeatured: false,
  customerImageUrl: '',
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? 'text-[#C69A45] fill-[#C69A45]' : 'text-[#E8DFD6]'}
        />
      ))}
    </span>
  );
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TestimonialForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Testimonial | null>(null);

  const fetchTestimonials = useCallback(() => {
    const params = new URLSearchParams();
    if (appliedSearch) params.set('search', appliedSearch);
    if (status) params.set('status', status);
    params.set('limit', '50');
    return fetch(`/api/admin/testimonials?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setTestimonials(Array.isArray(json.data) ? json.data : []);
          setError(null);
        } else {
          setError(json.error ?? 'Failed to load testimonials');
        }
      })
      .catch(() => setError('Failed to load testimonials'))
      .finally(() => setLoading(false));
  }, [appliedSearch, status]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
    setFeedback(null);
  }

  function openEditModal(item: Testimonial) {
    setEditingId(item.id);
    setForm({
      customerName: item.customerName,
      reviewText: item.reviewText,
      productName: item.productName ?? '',
      rating: item.rating,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
      isFeatured: item.isFeatured,
      customerImageUrl: item.customerImageUrl ?? '',
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
      const body = {
        customerName: form.customerName,
        reviewText: form.reviewText,
        productName: form.productName.trim() || null,
        rating: form.rating,
        displayOrder: form.displayOrder,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        customerImageUrl: form.customerImageUrl || null,
      };

      const url = editingId
        ? `/api/admin/testimonials/${editingId}`
        : '/api/admin/testimonials';
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
          message: editingId ? 'Testimonial updated' : 'Testimonial created',
        });
        await fetchTestimonials();
        setTimeout(closeModal, 1000);
      } else {
        setFeedback({ type: 'error', message: json.error ?? 'Failed to save' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save testimonial' });
    } finally {
      setSaving(false);
    }
  }

  async function handlePatch(
    item: Testimonial,
    payload: Partial<Pick<Testimonial, 'isActive' | 'isFeatured'>>,
  ) {
    try {
      const res = await fetch(`/api/admin/testimonials/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) await fetchTestimonials();
    } catch {
      // silent
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${deleteConfirm.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirm(null);
        await fetchTestimonials();
      } else {
        setFeedback({ type: 'error', message: json.error ?? 'Failed to delete' });
        setDeleteConfirm(null);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete testimonial' });
      setDeleteConfirm(null);
    }
  }

  const canSave = form.customerName.trim().length > 0 && form.reviewText.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-[#241B18]">Testimonials</h1>
          <p className="text-sm font-sans text-[#6B5E57] mt-1">
            Manage the reviews shown in the homepage &ldquo;What Our Customers Say&rdquo; section
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-sans font-medium text-white bg-[#5B1515] rounded-lg hover:bg-[#5B1515]/90 transition-colors"
        >
          <Plus size={16} />
          Add Testimonial
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
              placeholder="Search by customer, review, or product..."
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
          {testimonials.length === 0 ? (
            <div className="p-12 text-center">
              <Quote className="mx-auto mb-3 text-[#6B5E57]/40" size={40} />
              <p className="text-sm font-sans text-[#6B5E57]">
                {appliedSearch || status ? 'No testimonials found' : 'No testimonials yet'}
              </p>
              {!appliedSearch && !status && (
                <button
                  onClick={openCreateModal}
                  className="mt-3 text-sm font-sans font-medium text-[#5B1515] hover:text-[#5B1515]/80 transition-colors"
                >
                  Add your first testimonial
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-[#E8DFD6] bg-[#F8F3EA]/50">
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Customer</th>
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Review</th>
                    <th className="text-left px-5 py-3 font-medium text-[#6B5E57]">Product</th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">Rating</th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">Featured</th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">Status</th>
                    <th className="text-center px-5 py-3 font-medium text-[#6B5E57]">Order</th>
                    <th className="text-right px-5 py-3 font-medium text-[#6B5E57]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#E8DFD6] last:border-0 hover:bg-[#FCFAF6] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          {item.customerImageUrl ? (
                            <img
                              src={item.customerImageUrl}
                              alt={item.customerName}
                              className="w-8 h-8 rounded-full object-cover border border-[#E8DFD6] bg-[#F8F3EA]"
                            />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-[#5B1515] text-white text-xs font-medium flex items-center justify-center shrink-0">
                              {item.customerName.trim().charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="font-medium text-[#241B18]">
                            {item.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#6B5E57] max-w-[280px]">
                        <span className="line-clamp-2">{item.reviewText}</span>
                      </td>
                      <td className="px-5 py-3 text-[#6B5E57]">{item.productName || '—'}</td>
                      <td className="px-5 py-3 text-center">
                        <RatingStars rating={item.rating} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handlePatch(item, { isFeatured: !item.isFeatured })}
                          title={
                            item.isFeatured
                              ? 'Unfeature — show in normal order'
                              : 'Feature — pin to the top of the homepage section'
                          }
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans font-medium rounded-full border transition-colors ${
                            item.isFeatured
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <Star size={11} className={item.isFeatured ? 'fill-[#C69A45]' : ''} />
                          {item.isFeatured ? 'Featured' : 'Normal'}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handlePatch(item, { isActive: !item.isActive })}
                          title={
                            item.isActive
                              ? 'Deactivate — hide from the homepage'
                              : 'Activate — show on the homepage'
                          }
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans font-medium rounded-full border transition-colors ${
                            item.isActive
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {item.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-center text-[#6B5E57]">
                        {item.displayOrder}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-[#6B5E57] hover:text-[#5B1515] hover:bg-[#F8F3EA] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(item)}
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
              Are you sure you want to delete this testimonial?
            </p>
            <p className="text-sm font-sans font-medium text-[#5B1515] mb-5">
              {deleteConfirm.customerName} — &ldquo;{deleteConfirm.reviewText.slice(0, 60)}
              {deleteConfirm.reviewText.length > 60 ? '…' : ''}&rdquo;
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
          <div className="bg-white rounded-xl border border-[#E8DFD6] w-full max-w-xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8DFD6]">
              <h2 className="font-display text-lg text-[#241B18]">
                {editingId ? 'Edit Testimonial' : 'New Testimonial'}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
                    placeholder="e.g. Priya Sharma"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                    Product
                  </label>
                  <input
                    type="text"
                    value={form.productName}
                    onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
                    placeholder="e.g. Premium Floral Curtain"
                    maxLength={200}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                  Review *
                </label>
                <textarea
                  value={form.reviewText}
                  onChange={(e) => setForm((p) => ({ ...p, reviewText: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515] resize-none"
                  placeholder="What the customer said..."
                  maxLength={1000}
                />
                <p className="text-xs font-sans text-[#6B5E57] mt-1">
                  {form.reviewText.length}/1000
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                    Rating
                  </label>
                  <select
                    value={form.rating}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, rating: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} Star{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
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
                    className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
                    min={0}
                    max={9999}
                  />
                </div>
                <div className="flex flex-col justify-end gap-2 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#E8DFD6] text-[#5B1515] focus:ring-[#5B1515]/20"
                    />
                    <span className="text-sm font-sans text-[#241B18]">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#E8DFD6] text-[#5B1515] focus:ring-[#5B1515]/20"
                    />
                    <span className="text-sm font-sans text-[#241B18]">Featured</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">
                  Customer Photo (optional)
                </label>
                <SingleImageUploader
                  value={form.customerImageUrl}
                  onChange={(url) => setForm((p) => ({ ...p, customerImageUrl: url }))}
                />
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
                disabled={saving || !canSave}
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
