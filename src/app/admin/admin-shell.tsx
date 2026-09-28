'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  Home,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Mail,
} from 'lucide-react';

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  children?: { label: string; href: string }[];
}

const sidebarLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Contact', href: '/admin/contact', icon: Mail },
  {
    label: 'Homepage',
    href: '/admin/homepage',
    icon: Home,
    children: [
      { label: 'Hero Slides', href: '/admin/homepage/hero' },
      { label: 'Instagram Reels', href: '/admin/homepage/reels' },
      { label: 'Instagram Posts', href: '/admin/homepage/instagram' },
      { label: 'Settings', href: '/admin/homepage/settings' },
    ],
  },
  { label: 'Settings', href: '/admin/settings', icon: Settings, disabled: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [homepageOpen, setHomepageOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/contact?limit=1')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUnreadCount(json.data.unreadCount ?? 0);
      })
      .catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      setLoggingOut(false);
    }
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen flex bg-[#FCFAF6]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#3B0D0D] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <Link href="/admin" className="font-display text-[#C69A45] text-lg tracking-wide">
            Shreeratan Admin
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#F8F3EA]/60 hover:text-[#F8F3EA]"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);

            if (link.disabled) {
              return (
                <span
                  key={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans text-[#F8F3EA]/30 cursor-not-allowed"
                  title="Coming soon"
                >
                  <Icon size={18} />
                  {link.label}
                  <span className="ml-auto text-[10px] font-sans text-[#F8F3EA]/30">Soon</span>
                </span>
              );
            }

            if (link.children) {
              const isHomepageActive = pathname.startsWith('/admin/homepage');
              const isOpen = homepageOpen || isHomepageActive;
              return (
                <div key={link.href}>
                  <button
                    onClick={() => setHomepageOpen((o) => !o)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-sans transition-colors ${
                      isHomepageActive
                        ? 'bg-[#C69A45]/20 text-[#C69A45]'
                        : 'text-[#F8F3EA]/60 hover:text-[#F8F3EA] hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} className={isHomepageActive ? 'text-[#C69A45]' : ''} />
                    {link.label}
                    <ChevronDown
                      size={14}
                      className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {link.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-sans transition-colors ${
                              childActive
                                ? 'bg-[#C69A45]/20 text-[#C69A45]'
                                : 'text-[#F8F3EA]/50 hover:text-[#F8F3EA] hover:bg-white/5'
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-colors ${
                  active
                    ? 'bg-[#C69A45]/20 text-[#C69A45]'
                    : 'text-[#F8F3EA]/60 hover:text-[#F8F3EA] hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={active ? 'text-[#C69A45]' : ''} />
                {link.label}
                {link.label === 'Contact' && unreadCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#C69A45] rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-sans text-[#F8F3EA]/60 hover:text-[#F8F3EA] hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <LogOut size={18} />
            {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#E8DFD6] flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[#6B5E57] hover:text-[#241B18]"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-sans text-[#6B5E57]">Admin</span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm font-sans text-[#6B5E57] hover:text-[#5B1515] border border-[#E8DFD6] rounded-lg hover:bg-[#F8F3EA] transition-colors disabled:opacity-50"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
