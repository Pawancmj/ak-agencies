'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone: phone || undefined }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setError(data.error || 'Registration failed');
        }
        return;
      }

      router.push('/account');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="bg-cream border-b border-border">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-xs text-text-light">
              <a href="/" className="hover:text-primary transition-colors">Home</a>
              <span>/</span>
              <span className="text-text">Register</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-5 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-2">
                Create Account
              </h1>
              <p className="text-sm text-text-light">
                Join Shreeratan Furnishing for a premium shopping experience
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-xs font-bold tracking-wider uppercase text-text mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors"
                  placeholder="Your full name"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.name[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold tracking-wider uppercase text-text mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors"
                  placeholder="you@example.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.email[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold tracking-wider uppercase text-text mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 bg-white border border-border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.password[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-bold tracking-wider uppercase text-text mb-2">
                  Phone Number <span className="text-text-light font-normal">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:border-gold transition-colors"
                  placeholder="+91 98765 43210"
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.phone[0]}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white text-xs font-bold tracking-[2px] uppercase rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-text-light mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-gold hover:text-primary font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
