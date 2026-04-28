import type { Flag, Severity } from '@/lib/engine/types';

interface FindingsProps {
  flags: Flag[];
}

const TYPOLOGY_LABELS: Record<string, { title: string; tag: string }> = {
  sanctions_exposure: { title: 'Sanctions exposure', tag: 'sanctions · OFAC SDN' },
  mixer_exposure: { title: 'Mixer exposure', tag: 'privacy · mixers' },
  scam_exposure: { title: 'Scam exposure', tag: 'scam · curated cluster' },
  layering: { title: 'Layering', tag: 'layering · pass-through' },
  peel_chain: { title: 'Peel chain', tag: 'peel · sequential' },
};

function severityCount(flags: Flag[], sev: Severity): number {
  return flags.filter((f) => f.severity === sev).length;
}

function shortHash(s: string | undefined): string {
  if (!s) return '—';
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function shortAddr(s: string | undefined): string {
  if (!s) return '—';
  return shortHash(s);
}

function formatEth(weiOrEth: string | number | undefined): string {
  if (weiOrEth === undefined || weiOrEth === null) return '—';
  const n = typeof weiOrEth === 'string' ? Number(weiOrEth) : weiOrEth;
  if (!Number.isFinite(n)) return String(weiOrEth);
  if (Math.abs(n) >= 1e18) return `${(n / 1e18).toFixed(4)} ETH`;
  return `${n.toFixed(4)} ETH`;
}

export function Findings({ flags }: FindingsProps) {
  const low = severityCount(flags, 'low');
  const med = severityCount(flags, 'medium');
  const high = severityCount(flags, 'high');
  const crit = severityCount(flags, 'critical');

  return (
    <div className="findings">
      <div className="ftop">
        <span className="lbl">Findings · regulatory citations</span>
        <span className="count">
          <b>{low}</b> low · <b>{med}</b> med · <b>{high}</b> high · <b>{crit}</b> crit
        </span>
      </div>

      {flags.length === 0 && (
        <div className="no-more-findings">
          — All five typologies returned clean. No flags raised.
        </div>
      )}

      {flags.map((flag, i) => {
        const meta = TYPOLOGY_LABELS[flag.typology] ?? {
          title: flag.typology,
          tag: flag.typology,
        };
        return (
          <div className="finding" key={`${flag.typology}-${i}`}>
            <div className="sev-wrap">
              <div className={`sev ${flag.severity}`}>
                <span className="dot" />
                {flag.severity}
              </div>
              <div className="typ-tag">{meta.tag}</div>
            </div>
            <div>
              <h3>{flag.title}</h3>
              <p className="body-text">{flag.description}</p>
              {flag.evidence.length > 0 && (
                <table className="evi">
                  <thead>
                    <tr>
                      <th>Tx</th>
                      <th>Counterparty</th>
                      <th>Amount</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flag.evidence.slice(0, 8).map((e, j) => (
                      <tr key={j}>
                        <td>{shortHash(e.txHash)}</td>
                        <td>
                          {e.counterpartyLabel ? (
                            <>
                              <span className={`entity-tag entity-${e.counterpartyCategory ?? 'unknown'}`}>
                                {e.counterpartyLabel}
                              </span>
                              <span className="entity-addr">{shortAddr(e.counterpartyAddress)}</span>
                            </>
                          ) : (
                            shortAddr(e.counterpartyAddress)
                          )}
                        </td>
                        <td className="amt">{formatEth(e.amountWei)}</td>
                        <td>{e.timestamp ? new Date(e.timestamp).toISOString().slice(0, 10) : (e.note ?? '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {flag.citations.length > 0 && (
                <div className="citation">
                  <span className="src-tag">{flag.citations[0].source}</span>
                  <span>
                    {flag.citations[0].reference}
                    {flag.citations[0].url && (
                      <>
                        {' · '}
                        <a href={flag.citations[0].url} target="_blank" rel="noreferrer">
                          Read source →
                        </a>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
