'use client';

import { motion } from 'framer-motion';
import { Shield, Layers, Scissors, BadgeIndianRupee, Truck, Headphones, Ruler, Star } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SectionHeading } from '@/components/ui/section-heading';

const reasons = [
  { icon: Shield, title: 'Premium Quality', description: 'Only the finest materials and craftsmanship' },
  { icon: Layers, title: 'Wide Fabric Collection', description: '1000+ rolls of premium fabrics' },
  { icon: Scissors, title: 'Custom Stitching', description: 'Tailored to your exact specifications' },
  { icon: BadgeIndianRupee, title: 'Wholesale Pricing', description: 'Best value without compromising quality' },
  { icon: Truck, title: 'Pan India Delivery', description: 'We deliver across all of India' },
  { icon: Headphones, title: 'Trusted Support', description: 'Dedicated team for every customer' },
  { icon: Ruler, title: 'Custom Sizes & Designs', description: 'Any size, any pattern, any fabric' },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-cream border-b border-border">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-xs text-text-light">
              <a href="/" className="hover:text-primary transition-colors">Home</a>
              <span>/</span>
              <span className="text-text">About Us</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <section className="py-12 sm:py-16 md:py-24 px-5 sm:px-6 lg:px-8 bg-cream">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs tracking-[4px] text-gold uppercase font-medium"
            >
              Our Story
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl font-bold text-primary mt-3 mb-4"
            >
              About Shreeratan Furnishing
            </motion.h1>
            <div className="line-divider w-20 mx-auto mt-4 mb-6" />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg text-text-light leading-relaxed"
            >
              Beautiful homes begin with beautiful details. Based in Barabanki, Uttar Pradesh,
              Shreeratan Furnishing is your trusted destination for premium home furnishing products.
            </motion.p>
          </div>
        </section>

        {/* Brand Story */}
        <section className="py-10 sm:py-12 md:py-20 px-5 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="font-serif text-3xl font-bold text-primary mb-4">
                  Our Journey
                </h2>
                <div className="line-divider w-16 mb-6" />
                <div className="space-y-4 text-sm text-text-light leading-relaxed">
                  <p>
                    Shreeratan Furnishing was founded with a simple vision: to make premium home
                    furnishing accessible to every Indian home. From our base in Barabanki,
                    Uttar Pradesh, we have grown to serve customers across the country.
                  </p>
                  <p>
                    We specialize in curtains, sofa covers, bedsheets, cushion covers,
                    carpets, towels, and home décor. Our collection features carefully
                    curated fabrics and designs that bring elegance and comfort to any space.
                  </p>
                  <p>
                    What truly sets us apart is our custom stitching service. We understand
                    that every home is unique, and we offer tailored solutions to match your
                    exact requirements — from fabric selection to final stitching.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-cream rounded-xl p-8"
              >
                <h3 className="font-serif text-xl font-bold text-primary mb-6">Our Values</h3>
                <div className="space-y-4">
                  {[
                    { icon: Star, title: 'Quality First', text: 'We never compromise on the quality of our products' },
                    { icon: Scissors, title: 'Craftsmanship', text: 'Skilled artisans bring every design to life' },
                    { icon: Headphones, title: 'Customer Focus', text: 'Your satisfaction is our top priority' },
                    { icon: BadgeIndianRupee, title: 'Fair Pricing', text: 'Premium products at wholesale prices' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <item.icon size={18} className="text-gold mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-text">{item.title}</h4>
                        <p className="text-xs text-text-light">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section id="why-us" className="py-10 sm:py-12 md:py-20 px-5 sm:px-6 lg:px-8 bg-cream">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              eyebrow="Why Choose Us"
              title="The Shreeratan Furnishing Difference"
              subtitle="We bring quality, variety, and customization together"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {reasons.map((reason, i) => (
                <motion.div
                  key={reason.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-white rounded-xl p-5 md:p-6 text-center shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mx-auto mb-3">
                    <reason.icon size={22} className="text-gold" />
                  </div>
                  <h3 className="font-serif text-sm md:text-base font-bold text-text mb-1">
                    {reason.title}
                  </h3>
                  <p className="text-xs text-text-light">{reason.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 sm:py-12 md:py-20 px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-3xl font-bold text-primary mb-4">
              Ready to Transform Your Home?
            </h2>
            <p className="text-sm text-text-light mb-6">
              Explore our collection or get in touch for custom orders.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/shop"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 bg-primary text-white text-[11px] sm:text-xs font-bold tracking-[2px] uppercase rounded hover:bg-primary-dark transition-colors"
              >
                Shop Now
              </a>
              <a
                href="/custom-order"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 border-2 border-gold text-gold text-[11px] sm:text-xs font-bold tracking-[2px] uppercase rounded hover:bg-gold hover:text-white transition-colors"
              >
                Custom Order
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
