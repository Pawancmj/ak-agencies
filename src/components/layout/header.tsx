'use client';

import { AnnouncementBar } from './announcement-bar';
import { Navbar } from './navbar';
import { CategoryNavBar } from './category-nav-bar';
import { MobileMenu } from './mobile-menu';
import { SearchOverlay } from './search-overlay';
import { CartDrawer } from '../cart/cart-drawer';

export function Header() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <CategoryNavBar />
      <MobileMenu />
      <SearchOverlay />
      <CartDrawer />
    </>
  );
}
