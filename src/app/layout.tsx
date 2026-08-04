import type { Metadata } from 'next';
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
