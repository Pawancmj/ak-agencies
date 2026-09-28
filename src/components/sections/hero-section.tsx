'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SlideData {
  id: string;
  title: string;
  description: string | null;
  eyebrow: string | null;
  badge: string | null;
  backgroundImage: string;
  primaryButtonText: string | null;
  primaryButtonUrl: string | null;
  secondaryButtonText: string | null;
  secondaryButtonUrl: string | null;
}

const fallbackSlides: SlideData[] = [
  {
    id: 'fb-1',
    title: 'Premium Home\nFurnishing',
    description: 'Curtains · Sofa Covers · Bedsheets · Cushions',
    eyebrow: 'New Season Arrivals',
    badge: '10,000+ Happy Customers',
    backgroundImage: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&h=1080&fit=crop',
    primaryButtonText: 'Shop Collection',
    primaryButtonUrl: '/shop',
    secondaryButtonText: 'Custom Order',
    secondaryButtonUrl: '/custom-order',
  },
  {
    id: 'fb-2',
    title: 'Custom Stitching\nService',
    description: 'Tailored to your exact measurements and style preferences',
    eyebrow: 'Bespoke Craftsmanship',
    badge: '1000+ Fabric Rolls',
    backgroundImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&h=1080&fit=crop',
    primaryButtonText: 'Get Custom Order',
    primaryButtonUrl: '/custom-order',
    secondaryButtonText: 'View Portfolio',
    secondaryButtonUrl: '/shop',
  },
  {
    id: 'fb-3',
    title: 'Luxury Fabrics\nFor Every Home',
    description: 'Discover the latest trends in premium home décor',
    eyebrow: 'Curated Collections',
    badge: 'Pan India Delivery',
    backgroundImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop',
    primaryButtonText: 'Explore Now',
    primaryButtonUrl: '/shop',
    secondaryButtonText: 'Our Story',
    secondaryButtonUrl: '/about',
  },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>(fallbackSlides);
  const SLIDE_DURATION = 5500;

  useEffect(() => {
    fetch('/api/homepage')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data.heroSlides?.length > 0) {
          setSlides(json.data.heroSlides);
        }
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + (100 / (SLIDE_DURATION / 50));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="hero-section relative w-full overflow-hidden bg-black">
      {/* Background slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slide.backgroundImage}
            alt={slide.title.replace('\n', ' ')}
            className="hero-image absolute inset-0 w-full h-full object-cover"
          />
          {/* Mobile: lighter overlay for better readability */}
          <div className="hero-overlay absolute inset-0" />
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="hero-content relative z-10 h-full max-w-7xl mx-auto flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${current}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-2xl"
          >
            {/* Eyebrow / Tag */}
            {slide.eyebrow && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="hero-tag"
              >
                <span className="hero-tag-line" />
                <span className="hero-tag-text">{slide.eyebrow}</span>
              </motion.div>
            )}

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hero-heading whitespace-pre-line"
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            {slide.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="hero-subtitle"
              >
                {slide.description}
              </motion.p>
            )}

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="hero-ctas"
            >
              {slide.primaryButtonText && (
                <Link href={slide.primaryButtonUrl || '/shop'} className="hero-cta-primary group">
                  {slide.primaryButtonText}
                  <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              )}
              {slide.secondaryButtonText && (
                <Link href={slide.secondaryButtonUrl || '/about'} className="hero-cta-secondary">
                  {slide.secondaryButtonText}
                </Link>
              )}
            </motion.div>

            {/* Badge */}
            {slide.badge && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="hero-stat"
              >
                <span className="hero-stat-value">{slide.badge}</span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="hero-nav-btn hero-nav-prev"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="hero-nav-btn hero-nav-next"
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Progress indicators */}
      <div className="hero-progress">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setProgress(0); }}
            className="hero-dot-wrapper"
            aria-label={`Go to slide ${i + 1}`}
          >
            <span className={`hero-dot ${i === current ? 'hero-dot-active' : 'hero-dot-inactive'}`}>
              {i === current && (
                <span
                  className="hero-dot-progress"
                  style={{ width: `${progress}%` }}
                />
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Slide counter */}
      <div className="hero-slide-counter">
        <span className="text-white font-bold">{String(current + 1).padStart(2, '0')}</span>
        <span className="text-white/40 mx-2">/</span>
        <span className="text-white/40">{String(slides.length).padStart(2, '0')}</span>
      </div>

      {/* Brand badge - bottom left */}
      <div className="hero-brand-badge">
        Shreeratan Furnishing · Barabanki
      </div>
    </section>
  );
}
