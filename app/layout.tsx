import type { Metadata } from 'next';
import { Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ChainSight — AML risk reports for any Ethereum wallet',
  description:
    'Wallet-level AML risk intelligence. Screens addresses against OFAC SDN, mixer exposure, scam clusters, and FATF money-laundering typologies. Citation-backed, deterministic, defensible.',
  authors: [{ name: 'AIRWA Finance' }],
  keywords: [
    'AML',
    'compliance',
    'cryptocurrency',
    'ethereum',
    'risk scoring',
    'FATF',
    'OFAC',
    'blockchain analytics',
    'regtech',
  ],
  openGraph: {
    title: 'ChainSight — AML risk reports for any Ethereum wallet',
    description:
      'Wallet-level AML risk intelligence. Citation-backed, deterministic, defensible.',
    type: 'website',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Loaded as a same-origin static asset (not inline) so browser
          extensions that hijack <script dangerouslySetInnerHTML> (Bitdefender)
          can't overwrite it. Strips bis_*, grammarly, etc. attrs before and
          during React hydration via MutationObserver.
        */}
        <script src="/extension-cleanup.js" async />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
