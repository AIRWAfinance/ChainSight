import Link from 'next/link';
import { Brand } from './Brand';

export function Nav() {
  return (
    <nav className="nav-top">
      <Brand />
      <ul className="nav-links">
        <li><Link href="/#methodology">Methodology</Link></li>
        <li><Link href="/#typologies">Typologies</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li>
          <a href="https://github.com/AIRWAfinance/ChainSight" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </li>
      </ul>
      <div className="nav-right">
        <Link href="/scan" className="btn-line">Run a scan</Link>
        <a href="mailto:cryptoworldinversiones@gmail.com" className="btn-gold">
          Request access
        </a>
      </div>
    </nav>
  );
}
