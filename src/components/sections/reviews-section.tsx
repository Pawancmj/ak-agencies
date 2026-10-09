'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import { StarRating } from '@/components/ui/star-rating';
import { reviews } from '@/data/products';

const reviewAvatars = [
  'https://i.pravatar.cc/150?img=32',
  'https://i.pravatar.cc/150?img=47',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=25',
  'https://i.pravatar.cc/150?img=44',
  'https://i.pravatar.cc/150?img=8',
  'https://i.pravatar.cc/150?img=36',
  'https://i.pravatar.cc/150?img=15',
];

export function ReviewsSection() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % reviews.length);
  const prev = () => setCurrent((prev) => (prev - 1 + reviews.length) % reviews.length);

  const review = reviews[current];

  // Show 3 reviews at a time in a grid on desktop
  const visibleReviews = [
    reviews[(current) % reviews.length],
    reviews[(current + 1) % reviews.length],
    reviews[(current + 2) % reviews.length],
  ];

  return (
    <section className="section-spacing px-5 sm:px-6 lg:px-8 bg-cream/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-14">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Customers Say"
            align="left"
            className="mb-0"
          />
          {/* Overall rating */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="reviews-overall shrink-0"
          >
            <span className="reviews-overall-score">4.8</span>
            <StarRating rating={5} size={16} />
            <span className="reviews-overall-label">From 2000+ reviews</span>
          </motion.div>
        </div>

        {/* Desktop: 3-card grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 md:gap-5">
          {visibleReviews.map((r, i) => (
            <motion.div
              key={`${r.id}-${i}-${current}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="review-card"
            >
              <Quote size={24} className="text-gold/30 mb-4" />
              <p className="review-card-text">&ldquo;{r.comment}&rdquo;</p>
              <div className="review-card-footer">
                <img
                  src={reviewAvatars[parseInt(r.id) - 1] ?? reviewAvatars[0]}
                  alt={r.customerName}
                  className="review-avatar"
                />
                <div>
                  <p className="review-card-name">{r.customerName}</p>
                  <p className="review-card-product">{r.product}</p>
                </div>
                <StarRating rating={r.rating} size={11} className="ml-auto self-start" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: single card */}
        <div className="md:hidden relative bg-white rounded-2xl p-8 card-shadow">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <Quote size={28} className="text-gold/30 mx-auto mb-4" />
              <p className="text-[15px] text-text leading-relaxed mb-6 italic">&ldquo;{review.comment}&rdquo;</p>
              <StarRating rating={review.rating} className="justify-center mb-3" />
              <p className="font-serif text-[15px] font-bold text-text">{review.customerName}</p>
              <p className="text-[12px] text-text-light mt-1">{review.product} · {review.verified ? '✓ Verified' : ''}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="review-nav-btn"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`review-dot transition-all duration-300 ${i === current ? 'review-dot-active' : 'review-dot-inactive'}`}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="review-nav-btn"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
