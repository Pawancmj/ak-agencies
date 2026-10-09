'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadCategories, type StripCategory } from '@/lib/category-nav';

export function CategoryNavBar() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<StripCategory[] | null>(null);

  useEffect(() => {
    let active = true;
    loadCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!categories || categories.length === 0) return null;

  return (
    <nav
      aria-label="Shop by category"
      className="bg-white border-b border-[#E8DFD6]/70 shadow-[0_1px_2px_rgba(37,27,24,0.03)]"
    >
      <div className="mx-auto max-w-[1440px] overflow-x-auto scrollbar-hide">
        <ul className="flex w-max min-w-full items-stretch justify-center px-4 sm:px-6 lg:px-8">
          {categories.map((category) => {
            const href = `/shop/${category.slug}`;
            const isActive = pathname === href;

            return (
              <li key={category.id} className="shrink-0">
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Shop ${category.name}`}
                  className={cn(
                    'group relative flex w-[88px] flex-col items-center gap-1.5 rounded-lg px-1 pb-2.5 pt-3 outline-none',
                    'transition-colors duration-200'
                  )}
                >
                  <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#E8DFD6]/60 bg-[#F8F3EA] transition-colors duration-200 group-hover:border-[#C69A45]/50 group-hover:bg-[#F3EADB] group-focus-visible:border-[#C69A45]">
                    <LayoutGrid
                      size={18}
                      strokeWidth={1.5}
                      className="text-[#C69A45]"
                      aria-hidden="true"
                    />
                    {category.image && (
                      <img
                        src={category.image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      'h-8 w-full text-center text-[12px] font-medium leading-[1.3] line-clamp-2 transition-colors duration-200',
                      isActive
                        ? 'text-[#5B1515]'
                        : 'text-[#241B18]/70 group-hover:text-[#5B1515]'
                    )}
                  >
                    {category.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute bottom-0 left-1/2 h-[2px] w-10 -translate-x-1/2 rounded-full bg-[#C69A45] transition-transform duration-200 origin-center',
                      isActive
                        ? 'scale-x-100'
                        : 'scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100'
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
