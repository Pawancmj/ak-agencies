'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Mail, MapPin, Camera, Globe, MessageCircle,
  Send, ChevronDown, Truck, Shield, Scissors, CreditCard,
  ArrowRight,
} from 'lucide-react';

const shopLinks = [
  { label: 'Curtains & Fabrics', href: '/shop/curtains' },
  { label: 'Sofa Covers', href: '/shop/sofa-covers' },
  { label: 'Bedsheets', href: '/shop/bedsheets' },
  { label: 'Cushion Covers', href: '/shop/cushion-covers' },
  { label: 'Curtain Accessories', href: '/shop/curtain-accessories' },
  { label: 'Carpets & Rugs', href: '/shop/carpets' },
  { label: 'Towels', href: '/shop/towels' },
  { label: 'Home Décor', href: '/shop/home-decor' },
];

const customerCareLinks = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Returns & Refunds', href: '/returns' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
];

const aboutLinks = [
  { label: 'Our Story', href: '/about' },
  { label: 'Why Choose Us', href: '/about#why-us' },
  { label: 'Custom Stitching', href: '/custom-order' },
  { label: 'Contact Us', href: '/contact' },
];

const footerAccordionSections = [
  { title: 'Shop', links: shopLinks },
  { title: 'Customer Care', links: customerCareLinks },
  { title: 'About Shreeratan Furnishing', links: aboutLinks },
];

const trustItems = [
  { icon: Shield, label: 'PREMIUM QUALITY' },
  { icon: CreditCard, label: 'SECURE PAYMENTS' },
  { icon: Truck, label: 'PAN INDIA DELIVERY' },
  { icon: Scissors, label: 'CUSTOM STITCHING' },
];

export function Footer() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer>
      {/* Newsletter Section */}
      <section className="bg-[#F8F3EA]/70 border-y border-[#E8DFD6]/60 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#C69A45]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#5B1515]/5 rounded-full blur-3xl" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <span className="eyebrow-label tracking-[0.24em] text-[#C69A45]">
              Newsletter
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#5B1515] mt-4 mb-3 tracking-tight">
              MAKE YOUR HOME BEAUTIFUL
            </h2>
            <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-[#C69A45] to-transparent mx-auto my-5" />
            <p className="text-[13px] sm:text-[14px] text-[#6B5E57] mb-8 max-w-md mx-auto leading-relaxed font-medium">
              Discover premium fabrics, exclusive collections, and professional styling inspiration.
            </p>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3.5 max-w-lg mx-auto bg-white p-2 rounded-2xl border border-[#E8DFD6]/80 shadow-[0_8px_30px_rgba(91,21,21,0.03)] focus-within:border-[#C69A45]/50 transition-all duration-300">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-4 py-3 bg-transparent text-[13px] text-text placeholder:text-[#6B5E57]/50 focus:outline-none transition-all"
              />
              <button
                type="submit"
                className="btn-gold shrink-0 py-3.5 px-7 rounded-xl"
              >
                <Send size={13} strokeWidth={2} />
                Subscribe
              </button>
            </form>

            <AnimatePresence>
              {subscribed && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="text-gold text-[13px] mt-5 font-semibold"
                >
                  Thank you for subscribing to our newsletter!
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <div className="bg-[#5B1515] text-white border-t border-white/[0.03] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C69A45]/[0.02] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
          {/* Desktop: 5-column grid */}
          <div className="hidden lg:grid grid-cols-5 gap-8 xl:gap-14">
            {/* Col 1 — Brand */}
            <div className="col-span-1">
              <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                <div className="relative h-[36px] w-auto aspect-[4/3]">
                  <Image
                    src="/images/aklogo.png"
                    alt="Shreeratan Furnishing Barabanki"
                    fill
                    className="object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
                    sizes="100px"
                  />
                </div>
              </Link>
              <p className="text-[12.5px] text-white/40 leading-relaxed mb-6">
                Premium home furnishing solutions crafted to bring comfort, elegance, and personality to every home.
              </p>
              <div className="flex items-center gap-3.5 mt-1">
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/15 hover:border-gold/40 hover:text-gold transition-all duration-300" aria-label="Instagram">
                  <Camera size={14} strokeWidth={1.5} className="text-white/50" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/10 hover:border-gold/30 transition-all duration-300" aria-label="Facebook">
                  <Globe size={14} strokeWidth={1.5} className="text-white/60" />
                </a>
                <a
                  href="https://wa.me/919473831097"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/10 hover:border-gold/30 transition-all duration-300"
                  aria-label="WhatsApp"
                >
                  <MessageCircle size={14} strokeWidth={1.5} className="text-white/60" />
                </a>
              </div>
            </div>

            {/* Col 2 — Shop */}
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase mb-5 pb-2.5 border-b border-white/10">
                Shop
              </h3>
              <ul className="space-y-2.5">
                {shopLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[12px] text-white/50 hover:text-gold transition-colors duration-200 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-gold transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Customer Care */}
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase mb-5 pb-2.5 border-b border-white/10">
                Customer Care
              </h3>
              <ul className="space-y-2.5">
                {customerCareLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[12px] text-white/50 hover:text-gold transition-colors duration-200 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-gold transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — About */}
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase mb-5 pb-2.5 border-b border-white/10">
                About Shreeratan Furnishing
              </h3>
              <ul className="space-y-2.5">
                {aboutLinks.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[12px] text-white/50 hover:text-gold transition-colors duration-200 inline-flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-gold transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 5 — Contact */}
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase mb-5 pb-2.5 border-b border-white/10">
                Get In Touch
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <MapPin size={14} strokeWidth={1.5} className="text-gold mt-0.5 shrink-0" />
                  <p className="text-[12px] text-white/50 leading-relaxed">
                    Barabanki, Uttar Pradesh, India
                  </p>
                </div>
                <a
                  href="tel:+919473831097"
                  className="flex items-center gap-2.5 text-[12px] text-white/50 hover:text-gold transition-colors group"
                >
                  <Phone size={14} strokeWidth={1.5} className="text-gold shrink-0" />
                  <div>
                    <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Call / WhatsApp</p>
                    <p className="group-hover:text-gold transition-colors">+91 9473831097</p>
                  </div>
                </a>
                <a
                  href="mailto:info@akagencies.com"
                  className="flex items-center gap-2.5 text-[12px] text-white/50 hover:text-gold transition-colors group"
                >
                  <Mail size={14} strokeWidth={1.5} className="text-gold shrink-0" />
                  <div>
                    <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Email</p>
                    <p className="group-hover:text-gold transition-colors">info@akagencies.com</p>
                  </div>
                </a>
              </div>
              <a
                href="https://wa.me/919473831097"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 text-[10px] font-semibold tracking-wider text-gold border border-gold/20 rounded-full hover:bg-gold hover:text-primary transition-all duration-300"
              >
                WhatsApp Us
                <ArrowRight size={10} strokeWidth={2} />
              </a>
            </div>
          </div>

          {/* Mobile: Accordion sections */}
          <div className="lg:hidden">
            {/* Brand section */}
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
                <div className="relative h-[32px] w-auto aspect-[4/3]">
                  <Image
                    src="/images/aklogo.png"
                    alt="Shreeratan Furnishing Barabanki"
                    fill
                    className="object-contain brightness-0 invert opacity-80"
                    sizes="90px"
                  />
                </div>
              </Link>
              <p className="text-[12px] text-white/50 leading-relaxed mb-4 max-w-sm">
                Premium home furnishing solutions crafted to bring comfort, elegance and personality to every home.
              </p>
              <div className="flex items-center gap-3 mt-1">
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/10 transition-all" aria-label="Instagram">
                  <Camera size={14} strokeWidth={1.5} className="text-white/60" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/10 transition-all" aria-label="Facebook">
                  <Globe size={14} strokeWidth={1.5} className="text-white/60" />
                </a>
                <a
                  href="https://wa.me/919473831097"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/10 transition-all"
                  aria-label="WhatsApp"
                >
                  <MessageCircle size={14} strokeWidth={1.5} className="text-white/60" />
                </a>
              </div>
            </div>

            {/* Accordion sections */}
            {footerAccordionSections.map((section) => (
              <div key={section.title} className="border-t border-white/10">
                <button
                  onClick={() => setOpenAccordion(openAccordion === section.title ? null : section.title)}
                  className="flex items-center justify-between w-full py-4 text-left"
                >
                  <span className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">
                    {section.title}
                  </span>
                  <ChevronDown
                    size={14}
                    strokeWidth={1.5}
                    className={`text-white/40 transition-transform duration-200 ${openAccordion === section.title ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openAccordion === section.title && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ul className="pb-4 space-y-2.5">
                        {section.links.map((link) => (
                          <li key={link.href + link.label}>
                            <Link
                              href={link.href}
                              className="text-[12px] text-white/50 hover:text-gold transition-colors pl-3 inline-flex items-center gap-2"
                            >
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Contact section */}
            <div className="border-t border-white/10 py-4">
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase mb-3">
                Get In Touch
              </h3>
              <div className="space-y-3">
                <a
                  href="tel:+919473831097"
                  className="flex items-center gap-2 text-[12px] text-white/50 hover:text-gold transition-colors"
                >
                  <Phone size={12} strokeWidth={1.5} className="text-gold" />
                  +91 9473831097
                </a>
                <a
                  href="mailto:info@akagencies.com"
                  className="flex items-center gap-2 text-[12px] text-white/50 hover:text-gold transition-colors"
                >
                  <Mail size={12} strokeWidth={1.5} className="text-gold" />
                  info@akagencies.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Trust Strip */}
      <div className="bg-[#4A1212] border-t border-white/[0.06]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-white/[0.04]">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center justify-center gap-2 py-4 lg:py-4">
                <item.icon size={14} strokeWidth={1.5} className="text-gold shrink-0" />
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.12em] text-white/50 uppercase">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* Copyright Bar */}
      <div className="bg-[#3D0E0E] border-t border-white/[0.06]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-white/30">
              © 2026 Shreeratan Furnishing. All Rights Reserved.
            </p>
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="text-[10px] text-white/30 hover:text-gold transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-[10px] text-white/30 hover:text-gold transition-colors">
                Terms
              </Link>
              <Link href="/returns" className="text-[10px] text-white/30 hover:text-gold transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
