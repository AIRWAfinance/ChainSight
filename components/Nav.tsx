import Link from 'next/link';
import { Brand } from './Brand';
import { NavAuth } from './NavAuth';

export function Nav() {
  return (
    <nav className="nav-top">
      <Brand />
      <ul className="nav-links">
        <li><Link href="/#methodology">Methodology</Link></li>
        <li><Link href="/#typologies">Typologies</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/beta">Beta</Link></li>
        <li>
          <a href="https://github.com/AIRWAfinance/ChainSight" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </li>
      </ul>
      <NavAuth />
    </nav>
  );
}
