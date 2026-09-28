'use client';

import { cn } from '@/lib/utils';

interface PlaceholderImageProps {
  label: string;
  className?: string;
  variant?: 'product' | 'category' | 'hero';
  width?: number;
  height?: number;
}

export function PlaceholderImage({ label, className, variant = 'product', width = 400, height = 500 }: PlaceholderImageProps) {
  const bgColors = {
    product: 'from-primary/20 to-gold/10',
    category: 'from-primary/30 to-primary-dark/20',
    hero: 'from-cream to-light-gold/30',
  };

  const textColors = {
    product: 'text-primary/40',
    category: 'text-white/60',
    hero: 'text-primary/30',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br',
        bgColors[variant],
        className
      )}
    >
      <div className="text-center px-4">
        <div className={cn('font-serif font-bold', textColors[variant])} style={{ fontSize: `${Math.min(width, height) * 0.06}px` }}>
          {label}
        </div>
        <div className={cn('mt-2 opacity-30', textColors[variant])} style={{ fontSize: `${Math.min(width, height) * 0.03}px` }}>
          Shreeratan Furnishing
        </div>
      </div>
    </div>
  );
}
