import { ScanForm } from './ScanForm';

export function ScanSection() {
  return (
    <section id="scan" className="section-scan">
      <div className="scan-grid">
        <div>
          <div className="kicker">§I · Begin a scan</div>
          <h2>
            Paste an address.<br />
            Receive a report in <em>seconds</em>.
          </h2>
          <p className="intro">
            Five typology detectors, OFAC SDN screening, and deterministic
            scoring run server-side. Every flag carries an evidence trail of
            transactions and a citation back to its regulatory source.
          </p>
        </div>
        <div>
          <ScanForm />
        </div>
      </div>
    </section>
  );
}
