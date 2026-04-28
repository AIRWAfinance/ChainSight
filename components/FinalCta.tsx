import Link from 'next/link';

export function FinalCta() {
  return (
    <section className="section-cta">
      <div className="kicker center">§V · Begin</div>
      <h2>Make every wallet <em>defensible.</em></h2>
      <p>
        ChainSight is in private access. Compliance teams, fund administrators,
        and regulated exchanges can request early API access today.
      </p>
      <div className="cta-actions">
        <Link href="/scan" className="btn-gold">Run a scan now →</Link>
        <a
          className="btn-line"
          href="https://github.com/AIRWAfinance/ChainSight"
          target="_blank"
          rel="noreferrer"
        >
          View source on GitHub
        </a>
      </div>
    </section>
  );
}
