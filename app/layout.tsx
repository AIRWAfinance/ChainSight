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
      suppressHydrationWarning
    >
      <head>
        {/* Strip Bitdefender / Grammarly DOM injections before React hydrates. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var b=document.body;if(!b)return;var walk=function(n){if(n.nodeType===1){if(n.removeAttribute){n.removeAttribute('bis_skin_checked');n.removeAttribute('bis_register');n.removeAttribute('data-new-gr-c-s-check-loaded');n.removeAttribute('data-gr-ext-installed');for(var i=0;i<n.attributes.length;i++){var a=n.attributes[i];if(a&&a.name&&a.name.indexOf('__processed_')===0){n.removeAttribute(a.name);i--;}}}}for(var c=n.firstChild;c;c=c.nextSibling)walk(c);};walk(b);}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
