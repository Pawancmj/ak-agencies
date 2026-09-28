'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { ArrowLeft, CreditCard, Truck, MapPin, User, Phone, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { formatPrice } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface CheckoutAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface CheckoutItem {
  productId: string;
  name: string;
  slug: string;
  quantity: number;
  price: string;
  lineTotal: string;
  image: string;
  inStock: boolean;
}

interface CheckoutPricing {
  subtotal: string;
  shipping: string;
  total: string;
}

interface CheckoutIssue {
  code: string;
  productId?: string;
  message: string;
}

interface CheckoutData {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  selectedAddress: CheckoutAddress | null;
  addresses: CheckoutAddress[];
  items: CheckoutItem[];
  pricing: CheckoutPricing;
  isValid: boolean;
  issues: CheckoutIssue[];
}

const PHONE_REGEX = /^[6-9]\d{9}$/;

function validateIndianPhone(phone: string): string | null {
  const trimmed = phone.replace(/\s|-/g, '');
  if (!trimmed) return 'Phone number is required.';
  if (!/^\d+$/.test(trimmed)) return 'Phone number must contain only digits.';
  if (trimmed.length !== 10) return 'Phone number must be exactly 10 digits.';
  if (!PHONE_REGEX.test(trimmed)) return 'Enter a valid Indian mobile number starting with 6-9.';
  return null;
}

export default function CheckoutPage() {
  const [step, setStep] = useState<'contact' | 'shipping' | 'payment'>('contact');
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const phoneInitializedRef = useRef(false);

  const fetchCheckout = useCallback(async (addressId?: string) => {
    try {
      const params = addressId ? `?addressId=${addressId}` : '';
      const res = await fetch(`/api/checkout${params}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        setError(data.error || 'Failed to load checkout');
        return;
      }

      setCheckoutData(data.data);
      if (data.data.selectedAddress) {
        setSelectedAddressId(data.data.selectedAddress.id);
      }
      if (!phoneInitializedRef.current) {
        setPhoneValue(data.data.customer.phone || '');
        phoneInitializedRef.current = true;
      }
    } catch {
      setError('Failed to load checkout');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckout();
  }, [fetchCheckout]);

  const handleAddressSelect = async (addressId: string) => {
    setSelectedAddressId(addressId);
    setLoading(true);
    await fetchCheckout(addressId);
  };

  const handlePlaceOrder = async () => {
    if (!checkoutData?.isValid || submitting) return;
    setSubmitting(true);
    setOrderError(null);

    try {
      // Step 1: Create application order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: selectedAddressId, phone: phoneValue }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setOrderError(orderData.error || 'Failed to place order');
        return;
      }

      const orderNumber = orderData.order.orderNumber;

      // Step 2: Create Razorpay payment order
      const paymentRes = await fetch('/api/payments/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber }),
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        // If Razorpay order creation fails, order is still pending — redirect to confirmation for retry
        window.location.href = `/orders/${orderNumber}`;
        return;
      }

      // Step 3: Open Razorpay Checkout
      const options: RazorpayOptions = {
        key: paymentData.razorpay.keyId,
        amount: paymentData.razorpay.amount,
        currency: paymentData.razorpay.currency,
        name: 'Shreeratan Furnishing',
        description: `Order ${orderNumber}`,
        order_id: paymentData.razorpay.orderId,
        handler: async (response: RazorpayResponse) => {
          // Step 4: Verify payment on backend
          try {
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderNumber,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              // Payment verification failed — order remains PENDING, redirect for retry
              setOrderError(verifyData.error || 'Payment verification failed. Your order is pending.');
              return;
            }
            // Payment verified — redirect to confirmation
            window.location.href = `/orders/${orderNumber}`;
          } catch {
            setOrderError('Payment verification failed. Your order is pending.');
          }
        },
        prefill: {
          name: checkoutData.customer.name,
          email: checkoutData.customer.email,
          contact: checkoutData.customer.phone || undefined,
        },
        theme: {
          color: '#5B1515',
        },
        modal: {
          ondismiss: () => {
            // Customer closed Razorpay — order remains PENDING
            setOrderError('Payment was not completed. Your order is saved and you can retry.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setOrderError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading && !checkoutData) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-text-light">Loading checkout...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-primary" />
            <p className="font-serif text-lg text-text mb-4">{error}</p>
            <Link href="/shop" className="text-sm font-medium text-gold hover:text-primary transition-colors">
              Continue Shopping →
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Empty cart
  if (checkoutData && checkoutData.items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="font-serif text-lg text-text mb-4">Your cart is empty</p>
            <Link href="/shop" className="text-sm font-medium text-gold hover:text-primary transition-colors">
              Start Shopping →
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!checkoutData) return null;

  const customer = checkoutData.customer;
  const selectedAddress = checkoutData.selectedAddress;
  const items = checkoutData.items;
  const pricing = checkoutData.pricing;
  const issues = checkoutData.issues;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Header />
      <main className="min-h-screen">
        <div className="bg-cream border-b border-border">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-xs text-text-light">
              <a href="/" className="hover:text-primary transition-colors">Home</a>
              <span>/</span>
              <span className="text-text">Checkout</span>
            </div>
          </div>
        </div>

        {/* Validation Issues Banner */}
        {issues.length > 0 && (
          <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 mb-1">Checkout requires attention:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {issues.map((issue, i) => (
                      <li key={i}>• {issue.message}</li>
                    ))}
                  </ul>
                  <Link href="/cart" className="inline-block mt-2 text-sm font-medium text-red-800 underline hover:text-red-900">
                    Go to Cart to fix issues
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Error Banner */}
        {orderError && (
          <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{orderError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout form */}
            <div className="lg:col-span-2">
              {/* Step tabs */}
              <div className="flex items-center gap-4 mb-8">
                {[
                  { id: 'contact' as const, label: 'Contact', icon: User },
                  { id: 'shipping' as const, label: 'Shipping', icon: Truck },
                  { id: 'payment' as const, label: 'Payment', icon: CreditCard },
                ].map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setStep(s.id)}
                    className={`flex items-center gap-2 text-xs font-bold tracking-wider uppercase transition-colors ${
                      step === s.id ? 'text-primary' : 'text-text-light'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                      step === s.id ? 'bg-primary text-white' : 'bg-cream text-text-light'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Contact */}
              {step === 'contact' && (
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                  <h2 className="font-serif text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <User size={20} className="text-gold" />
                    Contact Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold tracking-wider uppercase text-text mb-1.5 block">Full Name</label>
                      <input
                        type="text"
                        value={customer.name}
                        readOnly
                        className="w-full px-4 py-3 bg-cream border border-border rounded text-sm text-text focus:outline-none"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold tracking-wider uppercase text-text mb-1.5 block">Phone</label>
                        <input
                          type="tel"
                          value={phoneValue}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
                            setPhoneValue(val);
                            if (phoneError) setPhoneError(null);
                          }}
                          onBlur={() => {
                            if (phoneValue) {
                              const err = validateIndianPhone(phoneValue);
                              if (err) setPhoneError(err);
                            }
                          }}
                          placeholder="10-digit mobile number"
                          className={`w-full px-4 py-3 border rounded text-sm text-text focus:outline-none transition-colors ${
                            phoneError
                              ? 'bg-red-50 border-red-400 focus:border-red-500'
                              : 'bg-cream border-border focus:border-gold'
                          }`}
                        />
                        {phoneError && (
                          <p className="text-xs text-red-600 mt-1">{phoneError}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold tracking-wider uppercase text-text mb-1.5 block">Email</label>
                        <input
                          type="email"
                          value={customer.email}
                          readOnly
                          className="w-full px-4 py-3 bg-cream border border-border rounded text-sm text-text focus:outline-none"
                        />
                      </div>
                    </div>
                    <button onClick={() => {
                      const err = validateIndianPhone(phoneValue);
                      if (err) {
                        setPhoneError(err);
                        return;
                      }
                      setPhoneError(null);
                      setStep('shipping');
                    }} className="w-full py-3 bg-primary text-white text-[11px] sm:text-xs font-bold tracking-[2px] uppercase rounded hover:bg-primary-dark transition-colors mt-4">
                      Continue to Shipping
                    </button>
                  </div>
                </div>
              )}

              {/* Shipping */}
              {step === 'shipping' && (
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                  <h2 className="font-serif text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <MapPin size={20} className="text-gold" />
                    Shipping Address
                  </h2>

                  {/* Saved addresses */}
                  {checkoutData.addresses.length > 0 ? (
                    <div className="space-y-3 mb-6">
                      {checkoutData.addresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedAddressId === addr.id
                              ? 'border-gold bg-cream'
                              : 'border-border hover:border-gold'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            className="w-4 h-4 accent-gold mt-0.5"
                            checked={selectedAddressId === addr.id}
                            onChange={() => handleAddressSelect(addr.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-text">{addr.fullName}</p>
                              {addr.isDefault && (
                                <span className="text-[10px] font-bold tracking-wider uppercase bg-gold/10 text-gold px-2 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-light mt-1">{addr.phone}</p>
                            <p className="text-xs text-text-light mt-0.5">
                              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            </p>
                            <p className="text-xs text-text-light">{addr.city}, {addr.state} {addr.postalCode}</p>
                            <p className="text-xs text-text-light">{addr.country}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin size={48} className="mx-auto mb-4 text-text-light" />
                      <p className="text-sm text-text mb-4">No saved addresses found.</p>
                      <Link href="/account/addresses" className="text-sm font-medium text-gold hover:text-primary transition-colors">
                        Add an address →
                      </Link>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep('contact')} className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-text-light border border-border rounded hover:border-primary hover:text-primary transition-colors">
                      <ArrowLeft size={14} />
                      Back
                    </button>
                    <button
                      onClick={() => setStep('payment')}
                      disabled={!selectedAddressId}
                      className="flex-1 py-3 bg-primary text-white text-[11px] sm:text-xs font-bold tracking-[2px] uppercase rounded hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Payment */}
              {step === 'payment' && (
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                  <h2 className="font-serif text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <CreditCard size={20} className="text-gold" />
                    Payment
                  </h2>
                  <div className="bg-cream rounded-lg p-4 mb-6">
                    <p className="text-sm text-text">
                      You will be redirected to Razorpay secure checkout to complete your payment of{' '}
                      <span className="font-bold">{formatPrice(Number(pricing.total))}</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-light mb-6">
                    <Lock size={12} />
                    <span>Your payment is processed securely by Razorpay</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep('shipping')} className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-text-light border border-border rounded hover:border-primary hover:text-primary transition-colors">
                      <ArrowLeft size={14} />
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={!checkoutData.isValid || submitting}
                      className="flex-1 py-3 bg-gold text-white text-[11px] sm:text-xs font-bold tracking-[2px] uppercase rounded hover:bg-light-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay ${formatPrice(Number(pricing.total))}`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h2 className="font-serif text-lg font-bold text-primary mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-cream overflow-hidden shrink-0 relative">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-cream to-light-gold/20" />
                        )}
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text truncate">{item.name}</p>
                        {!item.inStock && (
                          <p className="text-[10px] text-red-600 font-medium">Out of stock</p>
                        )}
                      </div>
                      <p className="text-xs font-bold text-text shrink-0">{formatPrice(Number(item.lineTotal))}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Subtotal</span>
                    <span className="text-text">{formatPrice(Number(pricing.subtotal))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Shipping</span>
                    <span className="text-gold font-medium">
                      {Number(pricing.shipping) === 0 ? 'Free' : formatPrice(Number(pricing.shipping))}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-sm font-bold text-text">Total</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(Number(pricing.total))}</span>
                  </div>
                </div>

                {/* Address summary */}
                {selectedAddress && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-[10px] font-bold tracking-wider uppercase text-text-light mb-2">Shipping to</p>
                    <div className="text-xs text-text space-y-0.5">
                      <p className="font-medium">{selectedAddress.fullName}</p>
                      <p className="text-text-light">{selectedAddress.addressLine1}</p>
                      <p className="text-text-light">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
                    </div>
                    <Link href="/account/addresses" className="inline-block mt-2 text-[10px] font-medium text-gold hover:text-primary transition-colors">
                      Change address
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
