'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useUI, useCart } from '@/store';
import { formatPrice } from '@/lib/utils';

export function CartDrawer() {
  const { state: uiState, toggleCart } = useUI();
  const { state, removeItem, updateQuantity } = useCart();

  useEffect(() => {
    if (uiState.isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [uiState.isCartOpen]);

  return (
    <AnimatePresence>
      {uiState.isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[80]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[92vw] bg-[#FCFAF6] z-[90] flex flex-col shadow-[-8px_0_30px_rgba(91,21,21,0.08)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 h-16 border-b border-border/60 shrink-0">
              <h2 className="font-serif text-base sm:text-lg font-bold text-primary flex items-center gap-2.5">
                <ShoppingBag size={18} strokeWidth={1.5} />
                Your Cart
                <span className="text-[11px] font-sans font-normal text-text-light">({state.itemCount} {state.itemCount === 1 ? 'item' : 'items'})</span>
              </h2>
              <button
                onClick={toggleCart}
                className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-text-light hover:text-primary hover:bg-border/30 transition-colors"
                aria-label="Close cart"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {state.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-cream flex items-center justify-center mb-4">
                    <ShoppingBag size={28} strokeWidth={1.2} className="text-border" />
                  </div>
                  <p className="font-serif text-base text-text mb-1">Your cart is empty</p>
                  <p className="text-[14px] text-text-light mb-6">Discover our premium home furnishings</p>
                  <button
                    onClick={toggleCart}
                    className="px-6 py-2.5 bg-primary text-white text-[11px] font-semibold tracking-[0.12em] uppercase rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="p-4 sm:p-5 space-y-3">
                  {state.items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                      className="flex gap-3.5 p-3 bg-white rounded-xl border border-border/30"
                    >
                      {/* Product image placeholder */}
                      <div className="w-[72px] h-[72px] rounded-lg bg-gradient-to-br from-cream to-light-gold/15 overflow-hidden shrink-0 flex items-center justify-center">
                        <span className="text-[7px] font-serif text-primary/30 text-center leading-tight px-1">
                          {item.product.name.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-[13px] font-medium text-text truncate leading-tight">
                              {item.product.name}
                            </h3>
                            <p className="text-[10px] text-text-light mt-0.5 tracking-wide">
                              {item.selectedColor && <span>{item.selectedColor}</span>}
                              {item.selectedColor && item.selectedSize && <span> · </span>}
                              {item.selectedSize && <span>{item.selectedSize}</span>}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="shrink-0 p-1 text-text-light/40 hover:text-red-500 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2.5">
                          {/* Quantity controls */}
                          <div className="flex items-center border border-border/60 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-text-light hover:text-primary hover:bg-cream transition-colors"
                            >
                              <Minus size={11} strokeWidth={1.5} />
                            </button>
                            <span className="w-7 text-center text-[12px] font-semibold text-text">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-text-light hover:text-primary hover:bg-cream transition-colors"
                            >
                              <Plus size={11} strokeWidth={1.5} />
                            </button>
                          </div>

                          <p className="text-[13px] font-bold text-primary">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {state.items.length > 0 && (
              <div className="shrink-0 border-t border-border/60 p-5 sm:p-6 space-y-3 bg-white/50">
                {/* Subtotal */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-text-light">Subtotal</span>
                    <span className="font-semibold text-text">{formatPrice(state.total)}</span>
                  </div>
                  <p className="text-[10px] text-text-light/70">
                    Shipping & taxes calculated at checkout
                  </p>
                </div>

                {/* Free shipping notice */}
                {state.total < 999 && (
                  <div className="py-2 px-3 bg-gold/5 rounded-lg border border-gold/10">
                    <p className="text-[12px] text-gold font-medium">
                      Add {formatPrice(999 - state.total)} more for free shipping!
                    </p>
                    <div className="mt-1.5 h-1 bg-border/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((state.total / 999) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <Link
                    href="/checkout"
                    onClick={toggleCart}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white text-[11px] font-semibold tracking-[0.12em] uppercase rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Checkout
                    <ArrowRight size={13} strokeWidth={1.5} />
                  </Link>
                  <Link
                    href="/cart"
                    onClick={toggleCart}
                    className="flex items-center justify-center w-full py-2.5 text-[11px] font-medium tracking-[0.08em] text-text-light hover:text-primary transition-colors border border-border/40 rounded-lg hover:border-primary/20"
                  >
                    VIEW CART
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
