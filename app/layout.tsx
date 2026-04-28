import type { Metadata } from 'next';
import { Fraunces, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz'],
});

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
