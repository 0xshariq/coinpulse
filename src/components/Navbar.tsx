import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { SearchModal } from './SearchModal';
import { getTrendingCoins } from '@/lib/coingecko.actions';
import { NavbarClient } from './NavbarClient';

const Navbar = async () => {
  const trendingCoins = await getTrendingCoins();

  return (
    <header>
      <div className="container inner">
        <Link href="/">
          <Image
            src="/assets/logo.svg"
            alt="CoinPulse Logo"
            width={132}
            height={40}
            style={{ width: 'auto', height: 'auto' }}
          />
        </Link>

        <nav>
          <NavbarClient trendingCoins={trendingCoins} />
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
