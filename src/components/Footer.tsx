import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="border-t border-dark-400 mt-12">
      <div className="container inner py-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="space-y-4">
          <Link href="/">
            <Image src="/assets/logo.svg" alt="CoinPulse Logo" width={132} height={40} />
          </Link>
          <p className="text-sm text-purple-100/75 max-w-sm">A lightweight crypto dashboard with live prices, charts and market data — built for traders and curious folks.</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-purple-100">Quick links</h4>
          <ul className="space-y-2 text-purple-100/80">
            <li><Link href="/" className="hover:text-white">Home</Link></li>
            <li><Link href="/coins" className="hover:text-white">All coins</Link></li>
            <li><Link href="/coins" className="hover:text-white">Top movers</Link></li>
            <li><Link href="/" className="hover:text-white">Docs</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-purple-100">Resources</h4>
          <ul className="space-y-2 text-purple-100/80">
            <li><a className="hover:text-white" href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer">CoinGecko</a></li>
            <li><a className="hover:text-white" href="https://github.com/0xshariq/coinpulse" target="_blank" rel="noopener noreferrer">Source on GitHub</a></li>
            <li className="flex items-center gap-3 pt-2">
              <a href="https://github.com/0xshariq/coinpulse" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-purple-100/80 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.96 3.23 9.16 7.71 10.64.56.1.77-.24.77-.53 0-.26-.01-1.12-.02-2.03-3.13.68-3.79-1.5-3.79-1.5-.51-1.31-1.24-1.66-1.24-1.66-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.24.93.1-.73.39-1.21.71-1.49-2.5-.28-5.13-1.25-5.13-5.55 0-1.23.44-2.24 1.15-3.03-.12-.28-.5-1.41.11-2.94 0 0 .94-.3 3.08 1.16a10.7 10.7 0 0 1 2.8-.38c.95.01 1.9.13 2.8.38 2.14-1.46 3.08-1.16 3.08-1.16.61 1.53.23 2.66.11 2.94.71.79 1.15 1.8 1.15 3.03 0 4.31-2.64 5.26-5.16 5.54.4.35.75 1.05.75 2.12 0 1.53-.01 2.77-.01 3.15 0 .29.2.64.78.53C19.02 20.9 22.25 16.7 22.25 11.75 22.25 5.48 17.27.5 11  .5z" fill="currentColor"/>
                </svg>
              </a>

              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-purple-100/80 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M22 5.92c-.63.28-1.3.48-2 .57.72-.43 1.27-1.1 1.53-1.9-.68.4-1.44.7-2.25.86A3.48 3.48 0 0 0 12.5 8c0 .27.03.53.09.78C8.36 8.69 5.21 6.6 3 3.78c-.3.53-.47 1.14-.47 1.79 0 1.24.63 2.33 1.58 2.97-.58-.02-1.12-.18-1.59-.44v.04c0 1.73 1.23 3.17 2.86 3.5-.3.08-.62.12-.95.12-.24 0-.47-.02-.69-.06.48 1.5 1.86 2.59 3.5 2.62A6.98 6.98 0 0 1 2 19.54a9.86 9.86 0 0 0 5.33 1.56c6.4 0 9.9-5.3 9.9-9.9v-.45c.68-.5 1.2-1.12 1.64-1.82-.62.28-1.28.47-1.96.56z" fill="currentColor"/>
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-dark-400">
        <div className="container inner py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-purple-100/70">
          <div>© {new Date().getFullYear()} CoinPulse. All rights reserved.</div>
          <div>Data powered by <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white">CoinGecko API</a></div>
        </div>
      </div>
    </footer>
  )
}

export default Footer