'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MessageCircle, Camera, Globe, ChevronDown, Home, ShoppingBag, Scissors, Info, Mail, Truck, Shield, Heart } from 'lucide-react';
import { useUI } from '@/store';
import { categories } from '@/data/products';

const mainNav = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Shop', href: '/shop', icon: ShoppingBag },
  { label: 'Custom Orders', href: '/custom-order', icon: Scissors },
  { label: 'About Us', href: '/about', icon: Info },
  { label: 'Contact Us', href: '/contact', icon: Mail },
];

export function MobileMenu() {
  const { state, toggleMobileMenu } = useUI();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    if (state.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setCategoriesOpen(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [state.isMobileMenuOpen]);

  return (
    <AnimatePresence>
      {state.isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={toggleMobileMenu}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 350 }}
            className="fixed top-0 left-0 bottom-0 w-[320px] max-w-[88vw] bg-[#FCFAF6] z-[70] lg:hidden flex flex-col border-r border-[#E8DFD6]/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-[68px] border-b border-[#E8DFD6]/50 shrink-0 bg-[#FCFAF6]">
              <Link href="/" onClick={toggleMobileMenu} className="flex items-center gap-2.5">
                <div className="relative h-[40px] w-auto aspect-[4/3]">
                  <Image
                    src="/images/aklogo.png"
                    alt="Shreeratan Furnishing Barabanki"
                    fill
                    className="object-contain"
                    sizes="110px"
                  />
                </div>
                <span className="font-serif text-[16px] font-bold text-[#5B1515] tracking-tight">Shreeratan Furnishing</span>
              </Link>
              <button
                onClick={toggleMobileMenu}
                className="w-10 h-10 rounded-full bg-[#F6F0E6] flex items-center justify-center text-[#241B18]/70 hover:text-[#5B1515] hover:bg-[#E8DFD6]/50 transition-all duration-200"
                aria-label="Close menu"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-1">
                {mainNav.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <Link
                      href={link.href}
                      onClick={toggleMobileMenu}
                      className="flex items-center gap-3.5 px-3.5 py-3.5 text-[14px] font-medium text-[#241B18]/75 hover:text-[#5B1515] hover:bg-[#F6F0E6]/60 rounded-xl transition-all duration-200"
                    >
                      <link.icon size={18} strokeWidth={1.5} className="text-[#C69A45]/80 shrink-0 w-6 h-6 flex items-center justify-center" />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Categories expandable */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: mainNav.length * 0.05, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <button
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    className="flex items-center justify-between w-full px-3.5 py-3.5 text-[14px] font-medium text-[#241B18]/75 hover:text-[#5B1515] hover:bg-[#F6F0E6]/60 rounded-xl transition-all duration-200"
                  >
                    <span className="flex items-center gap-3.5">
                      <ShoppingBag size={18} strokeWidth={1.5} className="text-[#C69A45]/80 shrink-0 w-6 h-6 flex items-center justify-center" />
                      Categories
                    </span>
                    <ChevronDown
                      size={15}
                      strokeWidth={1.5}
                      className={`transition-transform duration-300 text-[#6B5E57]/50 ${categoriesOpen ? 'rotate-180 text-[#5B1515]' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {categoriesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pl-10 pr-3 pb-2 space-y-0.5 mt-1">
                          {categories.map((cat) => (
                            <Link
                              key={cat.slug}
                              href={`/shop/${cat.slug}`}
                              onClick={toggleMobileMenu}
                              className="flex items-center gap-2.5 py-2.5 px-3 text-[13px] text-[#241B18]/55 hover:text-[#5B1515] hover:bg-[#F6F0E6]/40 rounded-lg transition-colors duration-200"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E8DFD6]" />
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Trust badges */}
              <div className="px-5 py-4 border-t border-[#E8DFD6]/40">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: Truck, text: 'Pan India Delivery' },
                    { icon: Shield, text: 'Premium Quality' },
                    { icon: Scissors, text: 'Custom Stitching' },
                    { icon: Heart, text: 'Trusted Brand' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2.5 py-2">
                      <div className="w-8 h-8 rounded-lg bg-[#5B1515]/[0.05] flex items-center justify-center shrink-0">
                        <item.icon size={13} strokeWidth={1.5} className="text-[#C69A45]" />
                      </div>
                      <span className="text-[11px] text-[#6B5E57]">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom contact */}
            <div className="shrink-0 border-t border-[#E8DFD6]/50 p-5 space-y-4 bg-[#F6F0E6]/40">
              <a
                href="tel:+919473831097"
                className="flex items-center gap-3.5 text-[14px] text-[#241B18]/75 hover:text-[#5B1515] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#5B1515]/[0.06] flex items-center justify-center shrink-0">
                  <Phone size={16} strokeWidth={1.5} className="text-[#C69A45]" />
                </div>
                <div>
                  <p className="text-[10px] text-[#6B5E57] uppercase tracking-wider mb-0.5">Call / WhatsApp</p>
                  <p className="font-medium text-[#241B18]">+91 9473831097</p>
                </div>
              </a>
              <div className="flex items-center justify-center gap-4 pt-3 border-t border-[#E8DFD6]/40">
                <a href="#" className="w-10 h-10 rounded-full bg-white/60 border border-[#E8DFD6]/50 flex items-center justify-center text-[#6B5E57]/60 hover:text-[#5B1515] hover:bg-[#F6F0E6] hover:border-[#C69A45]/30 transition-all duration-300" aria-label="Instagram">
                  <Camera size={16} strokeWidth={1.5} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/60 border border-[#E8DFD6]/50 flex items-center justify-center text-[#6B5E57]/60 hover:text-[#5B1515] hover:bg-[#F6F0E6] hover:border-[#C69A45]/30 transition-all duration-300" aria-label="Facebook">
                  <Globe size={16} strokeWidth={1.5} />
                </a>
                <a
                  href="https://wa.me/919473831097"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/60 border border-[#E8DFD6]/50 flex items-center justify-center text-[#6B5E57]/60 hover:text-[#5B1515] hover:bg-[#F6F0E6] hover:border-[#C69A45]/30 transition-all duration-300"
                  aria-label="WhatsApp"
                >
                  <MessageCircle size={16} strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}