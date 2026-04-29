import Link from 'next/link';

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot-top">
        <div className="foot-col foot-brand">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-logo">ChainSight</span>
          </div>
          <p>
            An open-source AML risk-scoring engine for wallet-level forensics.
            Built by AIRWA Finance — Valencia.
          </p>
        </div>
        <div className="foot-col">
          <h4>Product</h4>
          <ul>
            <li><Link href="/scan">Scan a wallet</Link></li>
            <li><Link href="/#methodology">Methodology</Link></li>
            <li><Link href="/#typologies">Typologies</Link></li>
            <li><Link href="/methodology/coverage">Coverage &amp; scope</Link></li>
            <li><Link href="/trust">Trust &amp; data handling</Link></li>
            <li><Link href="/#sample-report">Sample report</Link></li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>Resources</h4>
          <ul>
            <li>
              <a href="https://github.com/AIRWAfinance/ChainSight" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://www.fatf-gafi.org/publications/fatfrecommendations/documents/Virtual-Assets-Red-Flag-Indicators.html" target="_blank" rel="noreferrer">
                FATF citations
              </a>
            </li>
            <li>
              <a href="https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists" target="_blank" rel="noreferrer">
                OFAC sources
              </a>
            </li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>Company</h4>
          <ul>
            <li><a href="mailto:cryptoworldinversiones@gmail.com">Contact</a></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="foot-legal">
        <span>CHAINSIGHT v0.2.0 · AIRWA FINANCE · MIT LICENSE</span>
        <span>EDUCATIONAL · NOT REGULATED ADVICE · NO DETERMINATION OF LEGAL STATUS</span>
      </div>
    </footer>
  );
}
