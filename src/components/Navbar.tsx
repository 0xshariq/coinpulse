'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchModal } from './SearchModal';
import { getTrendingCoins } from '@/lib/coingecko.actions';

const Navbar = () => {

  const pathname = usePathname();

  const trendingList = getTrendingCoins() as unknown as TrendingCoin[];

  // const trendingCoins = trendingListPromise as TrendingCoin[];

  return (
    <header>
      <div className='container inner'>
        <Link href='/'>
          <Image src='/assets/logo.svg' alt='CoinPulse Logo' width={132} height={40} style={{ width: 'auto', height: 'auto' }} />
        </Link>

        <nav>
          <Link href='/' aria-current={pathname === '/' ? 'page' : undefined} className={cn('nav-link', {
            'is-active': pathname === '/',
            'is-home': true
          })}>
            Home
          </Link>

          'use server';
          <SearchModal initialTrendingCoins={trendingList} />


          <Link href='/coins' aria-current={pathname === '/coins' ? 'page' : undefined} className={cn('nav-link', {
            'is-active': pathname === '/coins'
          })}>
            All Coins
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Navbar;