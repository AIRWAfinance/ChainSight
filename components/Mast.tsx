export function Mast() {
  return (
    <section className="mast">
      <div>
        <div className="kicker">Volume I · AML risk intelligence onchain</div>
        <h1>
          Wallet-level<br />
          AML reports, <em>auditable</em><br />
          <span className="ampersand">&amp;</span> defensible.
        </h1>
        <p className="lede">
          <span className="dropcap">C</span>
          hainSight screens any Ethereum address against OFAC SDN, mixer exposure,
          scam clusters, and five FATF money-laundering typologies — and produces
          a deterministic, citation-backed report your compliance team can defend
          in audit. <b>No black-box ML, no vendor opacity.</b>
        </p>
        <div className="meta-row">
          <span><b>By</b> J. Fernández González</span>
          <span><b>Edition</b> 0.2.0</span>
          <span><b>Updated</b> 28 Apr 2026</span>
          <span><b>Coverage</b> Ethereum mainnet</span>
        </div>
      </div>
      <aside className="aside">
        <div className="kicker muted">Editor's note</div>
        <div className="pull-quote">
          Black-box risk scores fail audit. Every finding here cites the
          underlying FATF or OFAC source — and links the exact transactions
          that triggered it.
        </div>
        <div className="attribution">
          <b>Methodology</b> · ChainSight is fully deterministic, fully open.
          {' '}
          <a href="https://github.com/AIRWAfinance/ChainSight" target="_blank" rel="noreferrer">
            Read the engine on GitHub →
          </a>
        </div>
      </aside>
    </section>
  );
}
