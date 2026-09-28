'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const stats = [
  { value: '10,000+', label: 'Happy Customers' },
  { value: '15+', label: 'Years in Business' },
  { value: '1000+', label: 'Fabric Varieties' },
  { value: '500+', label: 'Custom Orders/Month' },
];

export function BrandStorySection() {
  return (
    <section className="brand-story-section section-spacing px-5 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <span className="eyebrow-label mb-3 block">Our Story</span>
            <h2 className="brand-story-heading">
              Beautiful Homes Begin<br />with Beautiful Details
            </h2>
            <div className="space-y-4 text-[14px] md:text-[15px] text-text-light leading-relaxed mb-8">
              <p>
                Shreeratan Furnishing, rooted in Barabanki, Uttar Pradesh, has been a trusted destination
                for premium home furnishing for over 15 years. From luxurious curtains and sofa covers
                to elegant bedsheets and designer cushion covers — we offer a complete range of
                home furnishing solutions at wholesale prices.
              </p>
              <p>
                What sets us apart is our commitment to quality, custom solutions, and
                genuine customer satisfaction. Our skilled craftsmen bring every vision to life,
                whether ready-made or bespoke — with Pan India delivery right to your door.
              </p>
            </div>

            {/* Stats row */}
            <div className="brand-stats-grid">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="brand-stat"
                >
                  <span className="brand-stat-value">{s.value}</span>
                  <span className="brand-stat-label">{s.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/about" className="btn-primary inline-flex items-center gap-2">
                Our Full Story <ArrowRight size={14} />
              </Link>
              <Link href="/contact" className="btn-outline">
                Contact Us
              </Link>
            </div>
          </motion.div>

          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="relative"
          >
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] group">
              <img
                src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=700&h=875&fit=crop"
                alt="Beautifully furnished living room by Shreeratan Furnishing"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="brand-story-float-card"
            >
              <div className="brand-story-float-icon">✦</div>
              <div>
                <p className="brand-story-float-value">Since 2009</p>
                <p className="brand-story-float-label">Barabanki, U.P.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
