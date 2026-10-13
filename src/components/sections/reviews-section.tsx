'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import { StarRating } from '@/components/ui/star-rating';
import {
  clampIndex,
  computeTestimonialStats,
  getVisibleWindow,
  nextTestimonialIndex,
  prevTestimonialIndex,
  type TestimonialPublic,
} from '@/lib/testimonials';

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

function Avatar({ testimonial }: { testimonial: TestimonialPublic }) {
  if (testimonial.customerImageUrl) {
    return (
      <img
        src={testimonial.customerImageUrl}
        alt={testimonial.customerName}
        className="review-avatar"
      />
    );
  }
  return (
    <span className="review-avatar flex items-center justify-center bg-[#5B1515] text-white text-[13px] font-medium font-sans">
      {avatarInitials(testimonial.customerName)}
    </span>
  );
}

export function ReviewsSection() {
  const [testimonials, setTestimonials] = useState<TestimonialPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) setTestimonials(Array.isArray(json.data) ? json.data : []);
        else setLoadFailed(true);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = testimonials.length;
  const stats = computeTestimonialStats(testimonials);
  const index = clampIndex(current, total);
  const review = testimonials[index];

  const next = () => setCurrent((prev) => nextTestimonialIndex(prev, total));
  const prev = () => setCurrent((prev) => prevTestimonialIndex(prev, total));

  const visibleReviews = getVisibleWindow(testimonials, index, 3);

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
          {/* Overall rating — computed from active testimonials */}
          {!loading && stats.reviewCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="reviews-overall shrink-0"
            >
              <span className="reviews-overall-score">
                {stats.averageRating.toFixed(1)}
              </span>
              <StarRating rating={stats.averageRating} size={16} />
              <span className="reviews-overall-label">
                From {stats.reviewCount} review{stats.reviewCount === 1 ? '' : 's'}
              </span>
            </motion.div>
          )}
        </div>

        {loading && <div className="hidden md:block min-h-[180px]" />}

        {!loading && loadFailed && (
          <div className="bg-white rounded-2xl p-8 card-shadow text-center max-w-xl mx-auto">
            <Quote size={28} className="text-gold/30 mx-auto mb-4" />
            <p className="text-[15px] text-text italic">
              Reviews are unavailable right now. Please check back soon.
            </p>
          </div>
        )}

        {!loading && !loadFailed && total === 0 && (
          <div className="bg-white rounded-2xl p-8 md:py-12 card-shadow text-center max-w-xl mx-auto">
            <Quote size={28} className="text-gold/30 mx-auto mb-4" />
            <p className="text-[15px] text-text italic mb-1">No reviews yet</p>
            <p className="text-[13px] text-text-light">
              Check back soon to see what our customers are saying.
            </p>
          </div>
        )}

        {!loading && !loadFailed && total > 0 && (
          <>
            {/* Desktop: 3-card grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-4 md:gap-5">
              {visibleReviews.map((r, i) => (
                <motion.div
                  key={`${r.id}-${i}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="review-card"
                >
                  <Quote size={24} className="text-gold/30 mb-4" />
                  <p className="review-card-text">&ldquo;{r.reviewText}&rdquo;</p>
                  <div className="review-card-footer">
                    <Avatar testimonial={r} />
                    <div>
                      <p className="review-card-name">{r.customerName}</p>
                      <p className="review-card-product">{r.productName}</p>
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
                  key={`${review.id}-${index}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <Quote size={28} className="text-gold/30 mx-auto mb-4" />
                  <p className="text-[15px] text-text leading-relaxed mb-6 italic">
                    &ldquo;{review.reviewText}&rdquo;
                  </p>
                  <StarRating rating={review.rating} className="justify-center mb-3" />
                  <p className="font-serif text-[15px] font-bold text-text">
                    {review.customerName}
                  </p>
                  {review.productName && (
                    <p className="text-[12px] text-text-light mt-1">{review.productName}</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            {total > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button onClick={prev} className="review-nav-btn" aria-label="Previous">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                  {testimonials.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => setCurrent(i)}
                      className={`review-dot transition-all duration-300 ${
                        i === index ? 'review-dot-active' : 'review-dot-inactive'
                      }`}
                      aria-label={`Go to review ${i + 1}`}
                    />
                  ))}
                </div>
                <button onClick={next} className="review-nav-btn" aria-label="Next">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
