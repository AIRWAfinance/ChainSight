# ChainSight

**AML risk scoring engine for Ethereum wallet addresses.**

ChainSight is an open-source RegTech research tool that takes an Ethereum address as input and produces an auditable AML risk report. It evaluates the address against a configurable set of typologies derived from FATF, FinCEN, and OFAC public guidance.

Built by an AML/CDD professional (Bet365) for the AML, RegTech, and crypto-compliance community. v0.1.

---

## What it does

1. Pulls full transaction history (normal, internal, ERC-20) for an Ethereum address from Etherscan.
2. Evaluates 5 AML typologies:
   - **Sanctions exposure** — direct transactions with OFAC SDN-listed addresses
   - **Mixer exposure** — Tornado Cash and other privacy mixers
   - **Scam / ransomware exposure** — known illicit-actor addresses
   - **Layering** — rapid pass-through pattern (FATF Red Flag 4.2(a))
   - **Peel chain** — decreasing sequential outflows (FATF Red Flag 4.2(c))
3. Aggregates findings into a 0–100 risk score with explainable severity weighting.
4. Produces a human-readable Markdown or machine-readable JSON report with full evidence trail and source citations.

Every flag in the report cites the **regulatory framework** behind it (FATF VA Red Flag Indicators, FinCEN advisories, OFAC SDN actions) — making the output suitable for an AML analyst to use as a starting point for case review.

---

## Quick start

### Prerequisites

- Node.js 20+
- An Etherscan API key (free)
- Git

### 1. Get an Etherscan API key

1. Go to [https://etherscan.io/register](https://etherscan.io/register) and create a free account.
2. Once logged in, go to [https://etherscan.io/myapikey](https://etherscan.io/myapikey).
3. Click **"Add"** to create a new API key. The free tier allows 5 calls/second — sufficient for ChainSight.
4. Copy the API key.

### 2. Install ChainSight

```bash
git clone https://github.com/AIRWAfinance/ChainSight.git
cd ChainSight
npm install
```

### 3. Configure environment variables

Create a file named `.env` in the project root with the following content:

```
ETHERSCAN_API_KEY=your_actual_key_here
CACHE_DB_PATH=./cache/chainsight.db
CACHE_TTL_SECONDS=86400
ETHERSCAN_RATE_LIMIT=4
```

Replace `your_actual_key_here` with the key from step 1.

### 4. Run a scan

```bash
# Markdown report to stdout
npm run scan -- 0x098B716B8Aaf21512996dC57EB0615e2383E2f96

# Save Markdown report to file
npm run scan -- 0x098B716B8Aaf21512996dC57EB0615e2383E2f96 --output report.md

# JSON output
npm run scan -- 0x098B716B8Aaf21512996dC57EB0615e2383E2f96 --format json --output report.json
```

### 5. (Optional) Refresh OFAC sanctions list

```bash
npm run sync:ofac
```

This pulls the latest SDN list from `treasury.gov/ofac/downloads/sdn.xml` and extracts crypto addresses.

---

## Project structure

```
chainsight/
├── src/
│   ├── cli.ts                    # CLI entry point
│   ├── engine/
│   │   ├── types.ts              # Shared types
│   │   ├── scorer.ts             # Risk score aggregation
│   │   └── analyze.ts            # Orchestration
│   ├── data/
│   │   ├── etherscan.ts          # API client + caching
│   │   ├── sanctions.ts          # OFAC SDN loader
│   │   └── known-bad.ts          # Mixer/scam loader
│   ├── typologies/
│   │   ├── sanctions-exposure.ts
│   │   ├── mixer-exposure.ts
│   │   ├── scam-exposure.ts
│   │   ├── layering.ts
│   │   └── peel-chain.ts
│   ├── narrative/
│   │   └── template-report.ts
│   └── cache/
│       └── sqlite.ts
├── data/
│   ├── sanctions/ofac-sdn.json
│   └── known-bad/mixers.json, scams.json
├── scripts/
│   └── sync-ofac.ts
└── tests/
```

---

## Regulatory framework

Every typology cites its public regulatory or industry source:

- **FATF — Updated Guidance for a Risk-Based Approach to Virtual Assets and VASPs** (October 2021)
- **FATF — Virtual Assets Red Flag Indicators of Money Laundering and Terrorist Financing** (September 2020)
- **FinCEN Advisory FIN-2019-A003** — Illicit activity involving convertible virtual currency
- **FinCEN Advisory FIN-2020-A006** — Ransomware and the use of the financial system
- **U.S. Treasury OFAC SDN List** — live feed at `treasury.gov/ofac/downloads/sdn.xml`

ChainSight does **not** rely on any non-public, paid, or proprietary intelligence. Every flag can be traced back to a publicly cited regulatory source. This makes the tool suitable for academic, research, and educational use without licensing concerns.

---

## Disclaimer

ChainSight is **not** a regulated AML tool. It is provided for educational, research, and defensive-compliance prototyping purposes. Output should not be used as a substitute for vendor-grade screening (Chainalysis, Elliptic, TRM Labs) or for regulatory filings. Regulated entities must conduct their own due diligence using approved providers and procedures.

---

## Roadmap

- **v0.2** — Web UI (drag-drop address, visual risk dashboard, transaction graph)
- **v0.3** — Multi-chain support (Bitcoin, Tron, Polygon)
- **v0.4** — Additional typologies: dust attacks, structuring, no-KYC exchange exposure
- **v0.5** — LLM-generated EDD narrative reports (template-based reports remain default for auditability)
- **v1.0** — Pluggable rule engine, custom typology definitions, batch scanning

---

## License

MIT
