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
        <Link href="/beta" className="btn-gold">Request beta access →</Link>
        <Link href="/scan" className="btn-line">Run a scan</Link>
      </div>
    </section>
  );
}
