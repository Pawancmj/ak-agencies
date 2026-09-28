'use client';

import { Store, User, Mail, Info } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[#241B18]">Settings</h1>
        <p className="text-sm font-sans text-[#6B5E57] mt-1">Store information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Info */}
        <div className="bg-white rounded-xl border border-[#E8DFD6] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-[#5B1515]/10 text-[#5B1515]">
              <Store size={18} />
            </div>
            <h2 className="font-display text-lg text-[#241B18]">Store Details</h2>
          </div>

          <div className="space-y-4 text-sm font-sans">
            <div>
              <p className="text-[#6B5E57] mb-0.5">Store Name</p>
              <p className="text-[#241B18] font-medium">Shreeratan Furnishing Barabanki</p>
            </div>
            <div>
              <p className="text-[#6B5E57] mb-0.5">Currency</p>
              <p className="text-[#241B18] font-medium">INR (₹)</p>
            </div>
            <div>
              <p className="text-[#6B5E57] mb-0.5">Platform</p>
              <p className="text-[#241B18] font-medium">Next.js + Prisma</p>
            </div>
          </div>
        </div>

        {/* Admin Info */}
        <div className="bg-white rounded-xl border border-[#E8DFD6] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-[#C69A45]/10 text-[#8B6D2A]">
              <User size={18} />
            </div>
            <h2 className="font-display text-lg text-[#241B18]">Admin Account</h2>
          </div>

          <div className="space-y-4 text-sm font-sans">
            <div className="flex items-center gap-3">
              <User size={14} className="text-[#6B5E57] shrink-0" />
              <div>
                <p className="text-[#6B5E57] mb-0.5">Name</p>
                <p className="text-[#241B18] font-medium">Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={14} className="text-[#6B5E57] shrink-0" />
              <div>
                <p className="text-[#6B5E57] mb-0.5">Email</p>
                <p className="text-[#241B18] font-medium">admin@akagencies.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="bg-[#F8F3EA] border border-[#E8DFD6] rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-[#6B5E57] shrink-0 mt-0.5" />
          <div className="text-sm font-sans">
            <p className="text-[#241B18] font-medium mb-1">Need to change environment variables?</p>
            <p className="text-[#6B5E57]">
              Contact the developer to update environment variables such as database connection strings, API keys, or other configuration values. These cannot be changed from this interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
