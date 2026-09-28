'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import { CheckCircle, Clock, Package, MapPin, ArrowLeft, CreditCard } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { formatPrice } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayConfirmOptions) => RazorpayInstance;
  }
}

interface RazorpayConfirmOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayConfirmResponse) => void;
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

interface RazorpayConfirmResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: string;
  shippingAmount: string;
  total: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingFullName: string;
  shippingPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  createdAt: string;
  items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        setError(data.error || 'Order not found');
        return;
      }
      setOrder(data.data);
    } catch {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handlePayNow = async () => {
    if (!order || paying) return;
    setPaying(true);
    try {
      // Create Razorpay payment order
      const paymentRes = await fetch('/api/payments/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: order.orderNumber }),
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        alert(paymentData.error || 'Failed to initiate payment');
        return;
      }

      // Open Razorpay Checkout
      const options: RazorpayConfirmOptions = {
        key: paymentData.razorpay.keyId,
        amount: paymentData.razorpay.amount,
        currency: paymentData.razorpay.currency,
        name: 'Shreeratan Furnishing',
        description: `Order ${order.orderNumber}`,
        order_id: paymentData.razorpay.orderId,
        handler: async (response: RazorpayConfirmResponse) => {
          try {
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderNumber: order.orderNumber,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              alert(verifyData.error || 'Payment verification failed');
              return;
            }
            // Refresh order data
            fetchOrder();
          } catch {
            alert('Payment verification failed. Please refresh the page.');
          }
        },
        prefill: {
          name: order.customerName,
          email: order.customerEmail,
          contact: order.customerPhone || undefined,
        },
        theme: {
          color: '#5B1515',
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      alert('Failed to initiate payment');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-text-light">Loading order details...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="font-serif text-lg text-text mb-4">{error || 'Order not found'}</p>
            <Link href="/shop" className="text-sm font-medium text-gold hover:text-primary transition-colors">
              Continue Shopping →
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const isPaid = order.paymentStatus === 'PAID';
  const isPendingPayment = order.paymentStatus === 'PENDING' && order.status === 'PENDING';

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
              <span className="text-text">Order Confirmation</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Status Header */}
          <div className="text-center mb-8">
            {isPaid ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h1 className="font-serif text-2xl font-bold text-primary mb-2">Payment Successful!</h1>
                <p className="text-sm text-text-light">
                  Thank you, {order.customerName}. Your order has been confirmed.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="text-yellow-600" />
                </div>
                <h1 className="font-serif text-2xl font-bold text-primary mb-2">Order Placed!</h1>
                <p className="text-sm text-text-light">
                  Thank you, {order.customerName}. Please complete your payment to confirm the order.
                </p>
              </>
            )}
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-text-light mb-1">Order Number</p>
                <p className="text-lg font-bold text-primary">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-wider uppercase text-text-light mb-1">Order Date</p>
                <p className="text-sm text-text">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-gold" />
                <span className="text-xs text-text">
                  Status: <span className="font-medium">{statusLabels[order.status] || order.status}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isPaid ? (
                  <CheckCircle size={14} className="text-green-600" />
                ) : (
                  <Clock size={14} className="text-yellow-600" />
                )}
                <span className="text-xs text-text">
                  Payment: <span className="font-medium">{paymentStatusLabels[order.paymentStatus] || order.paymentStatus}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Pay Now Button (for pending payments) */}
          {isPendingPayment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard size={20} className="text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">Payment pending — complete it now</p>
              </div>
              <button
                onClick={handlePayNow}
                disabled={paying}
                className="w-full py-3 bg-gold text-white text-[11px] sm:text-xs font-bold tracking-[2px] uppercase rounded hover:bg-light-gold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatPrice(Number(order.total))}`
                )}
              </button>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="font-serif text-lg font-bold text-primary mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{item.productName}</p>
                    <p className="text-xs text-text-light">Qty: {item.quantity} × {formatPrice(Number(item.unitPrice))}</p>
                  </div>
                  <p className="text-sm font-bold text-text shrink-0 ml-4">{formatPrice(Number(item.lineTotal))}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-light">Subtotal</span>
                <span className="text-text">{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-light">Shipping</span>
                <span className="text-gold font-medium">
                  {Number(order.shippingAmount) === 0 ? 'Free' : formatPrice(Number(order.shippingAmount))}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-sm font-bold text-text">Total</span>
                <span className="text-lg font-bold text-primary">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h2 className="font-serif text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-gold" />
              Shipping Address
            </h2>
            <div className="text-sm text-text space-y-1">
              <p className="font-medium">{order.shippingFullName}</p>
              <p className="text-text-light">{order.shippingPhone}</p>
              <p className="text-text-light">
                {order.shippingAddressLine1}
                {order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ''}
              </p>
              <p className="text-text-light">{order.shippingCity}, {order.shippingState} {order.shippingPostalCode}</p>
              <p className="text-text-light">{order.shippingCountry}</p>
            </div>
          </div>

          {/* Back to Shop */}
          <div className="text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-[11px] sm:text-xs font-bold tracking-[2px] uppercase rounded hover:bg-primary-dark transition-colors"
            >
              <ArrowLeft size={14} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
