'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, UserRound, Heart, ShoppingBag, Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart, useWishlist, useUI } from '@/store';

const navLinks = [
  { label: 'HOME', href: '/' },
  { label: 'SHOP', href: '/shop', hasDropdown: true },
  { label: 'CUSTOM ORDERS', href: '/custom-order' },
  { label: 'ABOUT US', href: '/about' },
  { label: 'CONTACT US', href: '/contact' },
];

const shopDropdownItems = [
  { label: 'Shop All', href: '/shop' },
  { label: 'New Arrivals', href: '/shop', badge: 'NEW' },
  { label: 'Best Sellers', href: '/shop' },
  { label: 'Featured Collection', href: '/shop' },
  { label: 'Offers', href: '/shop', badge: 'SALE' },
];


export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { state: cartState } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { toggleMobileMenu, toggleSearch, toggleCart } = useUI();

  const closeAll = useCallback(() => {
    setActiveDropdown(null);
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeAll]);

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  const handleDropdownEnter = useCallback((label: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 180);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-[#FCFAF6]/95 backdrop-blur-md shadow-[0_2px_20px_rgba(37,27,24,0.06)] border-b border-[#E8DFD6]/60'
          : 'bg-[#FCFAF6] shadow-[0_1px_0_rgba(232,223,214,0.6)]'
      )}
    >
      {/* ═══ MOBILE HEADER (below lg) ═══ */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-[62px] px-3">
          {/* Left — Hamburger */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 -ml-0.5 text-[#241B18]/70 hover:text-[#5B1515] transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>

          {/* Center — Brand */}
          <Link href="/" className="flex items-center gap-2 flex-1 justify-center min-w-0 px-2" aria-label="Shreeratan Furnishing Home">
            <div className="relative h-[40px] w-auto aspect-[4/3] shrink-0">
              <Image
                src="/images/aklogo.png"
                alt="Shreeratan Furnishing"
                fill
                className="object-contain"
                sizes="110px"
                priority
              />
            </div>
            <span className="font-serif text-[14px] sm:text-[15px] font-bold text-[#5B1515] tracking-tight whitespace-nowrap">Shreeratan Furnishing</span>
          </Link>

          {/* Right — Actions */}
          <div className="flex items-center gap-0 shrink-0">
            <button
              onClick={toggleSearch}
              className="p-[7px] text-[#241B18]/60 hover:text-[#5B1515] transition-colors"
              aria-label="Search products"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link
              href="/wishlist"
              className="p-[7px] text-[#241B18]/60 hover:text-[#5B1515] transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart size={20} strokeWidth={1.5} />
              {wishlistItems.length > 0 && (
                <span className="absolute top-0.5 right-0 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#5B1515] text-white text-[7px] font-bold flex items-center justify-center leading-none border-[1.5px] border-[#FCFAF6]">
                  {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                </span>
              )}
            </Link>
            <button
              onClick={toggleCart}
              className="p-[7px] text-[#241B18]/60 hover:text-[#5B1515] transition-colors relative"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartState.itemCount > 0 && (
                <span className="absolute top-0.5 right-0 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#5B1515] text-white text-[7px] font-bold flex items-center justify-center leading-none border-[1.5px] border-[#FCFAF6]">
                  {cartState.itemCount > 99 ? '99+' : cartState.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ TABLET HEADER (lg — xl) ═══ */}
      <div className="hidden lg:block xl:hidden max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className={cn(
          'flex items-center justify-between transition-all duration-300',
          isScrolled ? 'h-[68px]' : 'h-[80px]'
        )}>
          {/* Left — Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Shreeratan Furnishing Home">
            <div className="relative h-[46px] w-auto aspect-[4/3]">
              <Image
                src="/images/aklogo.png"
                alt="Shreeratan Furnishing"
                fill
                className="object-contain"
                sizes="160px"
                priority
              />
            </div>
            <span className="font-serif text-[19px] font-bold text-[#5B1515] tracking-tight whitespace-nowrap">Shreeratan Furnishing</span>
          </Link>

          {/* Center — Compact Navigation */}
          <nav className="flex items-center gap-1 flex-1 justify-center px-2" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => (
              <div
                key={link.href + link.label}
                className="relative"
                onMouseEnter={() => {
                  if (link.hasDropdown) handleDropdownEnter(link.label);
                }}
                onMouseLeave={() => {
                  if (link.hasDropdown) handleDropdownLeave();
                }}
              >
                <Link
                  href={link.href}
                  onClick={closeAll}
                  className={cn(
                    'relative flex items-center gap-0.5 px-2.5 py-2 text-[12.5px] font-medium tracking-[0.06em] uppercase transition-colors duration-250 whitespace-nowrap',
                    link.href === '/' && !activeDropdown
                      ? 'text-[#5B1515]'
                      : 'text-[#241B18]/75 hover:text-[#5B1515]'
                  )}
                >
                  {link.label}
                  {link.hasDropdown && (
                    <ChevronDown
                      size={10}
                      strokeWidth={1.8}
                      className={cn(
                        'transition-transform duration-250 text-[#6B5E57]/60',
                        (link.hasDropdown && activeDropdown === link.label) && 'rotate-180 text-[#5B1515]'
                      )}
                    />
                  )}
                </Link>

                {/* SHOP Dropdown (tablet) */}
                {link.hasDropdown && activeDropdown === link.label && (
                  <div
                    onMouseEnter={() => handleDropdownEnter(link.label)}
                    onMouseLeave={handleDropdownLeave}
                    className="absolute top-full left-1/2 -translate-x-1/2 w-[260px] pt-3 z-50"
                  >
                    <div className="bg-white rounded-xl shadow-[0_12px_40px_rgba(37,27,24,0.1)] border border-[#E8DFD6]/60 overflow-hidden">
                      <div className="p-1.5">
                        {shopDropdownItems.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={closeAll}
                            className="flex items-center justify-between px-3.5 py-2.5 text-[13px] text-[#241B18]/75 hover:text-[#5B1515] hover:bg-[#F6F0E6]/50 rounded-lg transition-colors duration-200 group/item"
                          >
                            <span className="font-medium">{item.label}</span>
                            {item.badge && (
                              <span className={cn(
                                'text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded',
                                item.badge === 'NEW' ? 'bg-[#C69A45]/10 text-[#C69A45]' : 'bg-red-50 text-red-500'
                              )}>
                                {item.badge}
                              </span>
                            )}
                            {!item.badge && (
                              <ChevronRight size={11} strokeWidth={1.5} className="text-[#6B5E57]/30 group-hover/item:text-[#C69A45] transition-colors" />
                            )}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-[#E8DFD6]/40 p-2">
                        <Link href="/shop" onClick={closeAll} className="flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-semibold tracking-wider text-[#C69A45] hover:text-[#5B1515] transition-colors">
                          VIEW ALL PRODUCTS
                          <ChevronRight size={11} strokeWidth={2} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Vertical separator */}
          <div className="w-[1px] h-[28px] bg-[#E8DFD6]/50 mx-2" />

          {/* Right — Compact Actions */}
          <div className="flex items-center gap-1.5 shrink-0" role="navigation" aria-label="User actions">
            <button
              onClick={toggleSearch}
              className="p-[8px] text-[#241B18]/55 hover:text-[#5B1515] transition-colors duration-200 rounded-lg hover:bg-[#F6F0E6]/60"
              aria-label="Search products"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link
              href="/account"
              className="p-[8px] text-[#241B18]/55 hover:text-[#5B1515] transition-colors duration-200 rounded-lg hover:bg-[#F6F0E6]/60"
              aria-label="My Account"
            >
              <UserRound size={20} strokeWidth={1.5} />
            </Link>
            <Link
              href="/wishlist"
              className="p-[8px] text-[#241B18]/55 hover:text-[#5B1515] transition-colors duration-200 rounded-lg hover:bg-[#F6F0E6]/60 relative"
              aria-label="Wishlist"
            >
              <Heart size={20} strokeWidth={1.5} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-[1px] -right-[1px] min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#5B1515] text-white text-[8px] font-bold flex items-center justify-center leading-none border-[1.5px] border-[#FCFAF6]">
                  {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                </span>
              )}
            </Link>
            <button
              onClick={toggleCart}
              className="p-[8px] text-[#241B18]/55 hover:text-[#5B1515] transition-colors duration-200 rounded-lg hover:bg-[#F6F0E6]/60 relative"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartState.itemCount > 0 && (
                <span className="absolute -top-[1px] -right-[1px] min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#5B1515] text-white text-[8px] font-bold flex items-center justify-center leading-none border-[1.5px] border-[#FCFAF6]">
                  {cartState.itemCount > 99 ? '99+' : cartState.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ DESKTOP HEADER (xl+) ═══ */}
      <div className="hidden xl:block max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          'flex items-center justify-between transition-all duration-300',
          isScrolled ? 'h-[78px]' : 'h-[92px]'
        )}>
          {/* Left — Brand */}
          <Link href="/" className="flex items-center gap-3 shrink-0 lg:w-[300px]" aria-label="Shreeratan Furnishing Home">
            <div className="relative h-[54px] w-auto aspect-[4/3]">
              <Image
                src="/images/aklogo.png"
                alt="Shreeratan Furnishing Barabanki — Premium Home Furnishing"
                fill
                className="object-contain"
                sizes="180px"
                priority
              />
            </div>
            <span className="font-serif text-[20px] font-bold text-[#5B1515] tracking-tight whitespace-nowrap">Shreeratan Furnishing</span>
          </Link>

          {/* Vertical separator */}
          <div className="w-[1px] h-[32px] bg-[#E8DFD6]/60 mx-4" />

          {/* Center — Navigation */}
          <nav className="flex items-center justify-center gap-4 flex-1 px-2" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => (
              <div
                key={link.href + link.label}
                className="relative"
                onMouseEnter={() => {
                  if (link.hasDropdown) handleDropdownEnter(link.label);
                }}
                onMouseLeave={() => {
                  if (link.hasDropdown) handleDropdownLeave();
                }}
              >
                <Link
                  href={link.href}
                  onClick={closeAll}
                  className={cn(
                    'relative flex items-center gap-1 px-4 xl:px-5 py-2 text-[14px] font-medium tracking-[0.08em] uppercase transition-colors duration-250 whitespace-nowrap',
                    link.href === '/' && !activeDropdown
                      ? 'text-[#5B1515]'
                      : 'text-[#241B18]/75 hover:text-[#5B1515]'
                  )}
                >
                  {link.label}
                  {link.hasDropdown && (
                    <ChevronDown
                      size={11}
                      strokeWidth={1.8}
                      className={cn(
                        'transition-transform duration-250 text-[#6B5E57]/60',
                        (link.hasDropdown && activeDropdown === link.label) && 'rotate-180 text-[#5B1515]'
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      'absolute bottom-[4px] left-3.5 right-3.5 h-[2px] bg-[#C69A45] transition-transform duration-250 origin-center rounded-full',
                      (link.href === '/' && !activeDropdown)
                        ? 'scale-x-100'
                        : 'scale-x-0 group-hover:scale-x-100'
                    )}
                  />
                </Link>

                {/* SHOP Dropdown */}
                {link.hasDropdown && activeDropdown === link.label && (
                  <div
                    onMouseEnter={() => handleDropdownEnter(link.label)}
                    onMouseLeave={handleDropdownLeave}
                    className="absolute top-full left-1/2 -translate-x-1/2 w-[260px] pt-3 z-50"
                  >
                    <div className="bg-white rounded-xl shadow-[0_12px_40px_rgba(37,27,24,0.1)] border border-[#E8DFD6]/60 overflow-hidden">
                      <div className="p-1.5">
                        {shopDropdownItems.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={closeAll}
                            className="flex items-center justify-between px-3.5 py-2.5 text-[13px] text-[#241B18]/75 hover:text-[#5B1515] hover:bg-[#F6F0E6]/50 rounded-lg transition-colors duration-200 group/item"
                          >
                            <span className="font-medium">{item.label}</span>
                            {item.badge && (
                              <span className={cn(
                                'text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded',
                                item.badge === 'NEW' ? 'bg-[#C69A45]/10 text-[#C69A45]' : 'bg-red-50 text-red-500'
                              )}>
                                {item.badge}
                              </span>
                            )}
                            {!item.badge && (
                              <ChevronRight size={11} strokeWidth={1.5} className="text-[#6B5E57]/30 group-hover/item:text-[#C69A45] transition-colors" />
                            )}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-[#E8DFD6]/40 p-2">
                        <Link href="/shop" onClick={closeAll} className="flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-semibold tracking-wider text-[#C69A45] hover:text-[#5B1515] transition-colors">
                          VIEW ALL PRODUCTS
                          <ChevronRight size={11} strokeWidth={2} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Vertical separator */}
          <div className="w-[1px] h-[36px] bg-[#E8DFD6]/50 mx-3" />

          {/* Right — Actions */}
          <div className="flex items-center gap-2.5" role="navigation" aria-label="User actions">
            <button
              onClick={toggleSearch}
              className="p-[10px] text-[#241B18]/55 hover:text-[#5B1515] transition-colors duration-200 rounded-lg hover:bg-[#F6F0E6]/60"
              aria-label="Search products"
            >
              <Search size={22} strokeWidth={1.5} />
            </button>

            <Link
              href="/account"
              className="p-[10px] text-[#241B18]/55 hover:text-[#5B1515] transition-colors duration-200 rounded-lg hover:bg-[#F6F0E6]/60"
              aria-label="My Account"
            >
              <UserRound size={22} strokeWidth={1.5} />
            </Link>

            <Link
              href="/wishlist"
              className="p-[10px] text-[#241B18]/55 hover:text-[#5B1515] transition-colors duration-200 rounded-lg hover:bg-[#F6F0E6]/60 relative"
              aria-label="Wishlist"
            >
              <Heart size={22} strokeWidth={1.5} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-[1px] -right-[1px] min-w-[18px] h-[18px] px-1 rounded-full bg-[#5B1515] text-white text-[9px] font-bold flex items-center justify-center leading-none border-2 border-[#FCFAF6]">
                  {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                </span>
              )}
            </Link>

            <button
              onClick={toggleCart}
              className="p-[10px] text-[#241B18]/55 hover:text-[#5B1515] transition-colors duration-200 rounded-lg hover:bg-[#F6F0E6]/60 relative"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {cartState.itemCount > 0 && (
                <span className="absolute -top-[1px] -right-[1px] min-w-[18px] h-[18px] px-1 rounded-full bg-[#5B1515] text-white text-[9px] font-bold flex items-center justify-center leading-none border-2 border-[#FCFAF6]">
                  {cartState.itemCount > 99 ? '99+' : cartState.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

    </header>
  );
}
