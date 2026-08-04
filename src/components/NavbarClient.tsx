'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchModal } from './SearchModal';

export const NavbarClient = ({ trendingCoins }: { trendingCoins: TrendingCoin[] }) => {
  const pathname = usePathname();

  return (
    <>
      <Link href='/' aria-current={pathname === '/' ? 'page' : undefined} className={cn('nav-link', {
        'is-active': pathname === '/',
        'is-home': true
      })}>
        Home
      </Link>

      <SearchModal initialTrendingCoins={trendingCoins} />

      <Link href='/coins' aria-current={pathname === '/coins' ? 'page' : undefined} className={cn('nav-link', {
        'is-active': pathname === '/coins'
      })}>
        All Coins
      </Link>
    </>
  );
};
