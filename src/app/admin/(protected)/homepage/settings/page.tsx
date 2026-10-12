'use client';

import { useEffect, useState, useCallback } from 'react';
import { Settings, X, Check, Loader2 } from 'lucide-react';

interface HomepageSettings {
  instagramHandle: string;
  instagramProfileUrl: string;
  instagramFollowText: string;
}

const defaultSettings: HomepageSettings = {
  instagramHandle: '@ak.agencies.bbk',
  instagramProfileUrl: 'https://instagram.com/ak.agencies.bbk',
  instagramFollowText: 'Follow on Instagram',
};

export default function HomepageSettingsPage() {
  const [form, setForm] = useState<HomepageSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/homepage/settings');
      const json = await res.json();
      if (json.success && json.data) {
        setForm({
          instagramHandle: json.data.instagramHandle ?? defaultSettings.instagramHandle,
          instagramProfileUrl: json.data.instagramProfileUrl ?? defaultSettings.instagramProfileUrl,
          instagramFollowText: json.data.instagramFollowText ?? defaultSettings.instagramFollowText,
        });
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/homepage/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({ type: 'success', message: 'Settings saved' });
      } else {
        setFeedback({ type: 'error', message: json.error ?? 'Failed to save settings' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[#241B18]">Homepage Settings</h1>
        <p className="text-sm font-sans text-[#6B5E57] mt-1">Configure homepage display settings</p>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-sans ${feedback.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
          {feedback.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-[#E8DFD6] p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 bg-[#F8F3EA] rounded" />
            <div className="h-10 w-full bg-[#F8F3EA] rounded-lg" />
            <div className="h-4 w-32 bg-[#F8F3EA] rounded" />
            <div className="h-10 w-full bg-[#F8F3EA] rounded-lg" />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8DFD6] p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E8DFD6]">
            <Settings size={20} className="text-[#6B5E57]" />
            <h2 className="font-display text-lg text-[#241B18]">Instagram Settings</h2>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">Instagram Handle</label>
            <input
              type="text"
              value={form.instagramHandle}
              onChange={(e) => setForm((p) => ({ ...p, instagramHandle: e.target.value }))}
              className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
              placeholder="@akagenciesbarabanki"
            />
            <p className="text-xs text-[#6B5E57] mt-1">Display handle shown on homepage</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">Instagram Profile URL</label>
            <input
              type="text"
              value={form.instagramProfileUrl}
              onChange={(e) => setForm((p) => ({ ...p, instagramProfileUrl: e.target.value }))}
              className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
              placeholder="https://instagram.com/akagencies"
            />
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-[#241B18] mb-1">Follow Button Text</label>
            <input
              type="text"
              value={form.instagramFollowText}
              onChange={(e) => setForm((p) => ({ ...p, instagramFollowText: e.target.value }))}
              className="w-full px-3 py-2 text-sm font-sans border border-[#E8DFD6] rounded-lg bg-[#FCFAF6] text-[#241B18] focus:outline-none focus:ring-2 focus:ring-[#5B1515]/20 focus:border-[#5B1515]"
              placeholder="Follow on Instagram"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E8DFD6]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-sans font-medium text-white bg-[#5B1515] rounded-lg hover:bg-[#5B1515]/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
