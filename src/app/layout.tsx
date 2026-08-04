import type { Metadata, Viewport } from 'next';
import { VT323, Share_Tech_Mono } from 'next/font/google';
import './globals.css';

const displayFont = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const bodyFont = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'VINTAGE FINDER',
  description: 'Search vintage clothing live on eBay from one retro terminal.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vintage Finder',
  },
};

// Without this, mobile Safari renders the page zoomed-out desktop-style
// instead of at its actual mobile width.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <div className="crt-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
