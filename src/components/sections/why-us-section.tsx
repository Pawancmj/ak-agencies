'use client';

import { motion } from 'framer-motion';
import { Shield, Layers, Scissors, BadgeIndianRupee, Truck, Headphones, Ruler, Sparkles } from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';

const reasons = [
  { icon: Shield, title: 'Premium Quality', description: 'Finest materials & craftsmanship with rigorous quality checks' },
  { icon: Layers, title: '1000+ Fabrics', description: 'Unmatched variety of premium fabric rolls to choose from' },
  { icon: Scissors, title: 'Custom Stitching', description: 'Expert tailoring to your exact measurements & style' },
  { icon: BadgeIndianRupee, title: 'Wholesale Pricing', description: 'Factory-direct rates — best value guaranteed' },
  { icon: Truck, title: 'Pan India Delivery', description: 'Reliable doorstep delivery across all of India' },
  { icon: Headphones, title: 'Expert Support', description: 'Dedicated team available for all your queries' },
  { icon: Ruler, title: 'Any Size, Any Design', description: 'Fully bespoke solutions tailored just for you' },
  { icon: Sparkles, title: '15+ Years Trusted', description: 'Serving thousands of happy homes since 2009' },
];

export function WhyUsSection() {
  return (
    <section className="section-spacing px-5 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="Why Choose Us"
          title="The Shreeratan Furnishing Difference"
          subtitle="Where quality, variety, and customization come together"
        />

        <div className="why-us-grid">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.055 }}
              className="why-us-card group"
            >
              <div className="why-us-icon-wrap">
                <reason.icon size={20} className="text-gold" />
              </div>
              <h3 className="why-us-title">{reason.title}</h3>
              <p className="why-us-desc">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
