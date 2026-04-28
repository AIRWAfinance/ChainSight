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
        {/*
          Strip Bitdefender / Grammarly / similar extension attributes that
          mutate every <div> before React can hydrate. Runs synchronously in
          <head>, then keeps observing because extensions re-inject as React
          renders new nodes.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var BAD_ATTRS=['bis_skin_checked','bis_register','bis_use','data-bis-config','data-new-gr-c-s-check-loaded','data-gr-ext-installed'];var BAD_PREFIX='__processed_';function clean(node){if(!node||node.nodeType!==1)return;for(var i=0;i<BAD_ATTRS.length;i++){if(node.hasAttribute&&node.hasAttribute(BAD_ATTRS[i]))node.removeAttribute(BAD_ATTRS[i]);}if(node.attributes){for(var j=node.attributes.length-1;j>=0;j--){var a=node.attributes[j];if(a&&a.name&&a.name.indexOf(BAD_PREFIX)===0)node.removeAttribute(a.name);}}var c=node.firstChild;while(c){clean(c);c=c.nextSibling;}}function tick(){clean(document.documentElement);}tick();if(typeof MutationObserver!=='undefined'){var obs=new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var m=muts[i];if(m.type==='attributes'&&m.target&&m.target.removeAttribute){var n=m.attributeName||'';if(BAD_ATTRS.indexOf(n)>=0||n.indexOf(BAD_PREFIX)===0){try{m.target.removeAttribute(n);}catch(e){}}}else if(m.type==='childList'){for(var k=0;k<m.addedNodes.length;k++)clean(m.addedNodes[k]);}}});function start(){if(document.body){obs.observe(document.documentElement,{attributes:true,childList:true,subtree:true});}else setTimeout(start,16);}start();}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
