# ChainSight v0.6.0 — 5-Branch AML Specialist Audit

**Date:** 2026-04-28
**Scope:** AML/Compliance readiness for paying EU CASPs (MiCA + EU AMLR + FATF R.15/R.16)
**Reviewers (specialist branches):**
1. Sanctions Screening
2. Transaction Monitoring (TM)
3. SAR / Regulatory Reporting
4. CDD / KYC Layering
5. Audit Trail & Regulator-Readiness

Severity legend: **🔴 Blocker** (cannot sell to a regulated CASP) · **🟠 High** (must fix in beta) · **🟡 Medium** (next sprint) · **🟢 Note**

---

## 1. SANCTIONS SCREENING (Sanctions SME)

ChainSight loads OFAC SDN + EU CFSP + UK OFSI + UN SC into a single in-memory `Map` (`lib/data/sanctions.ts:25-55`). Lookup is exact-match on lowercased address.

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 1.1 | **No sanctions list freshness SLA exposed.** Cache lives forever in module scope (`cached` at `lib/data/sanctions.ts:23`). Stale OFAC = false negative on a sanctioned address = enforcement action. | 🔴 Blocker | Persist `lastSyncedAt` per list, expose in API response and PDF, alert if >24h stale. |
| 1.2 | **First-match-wins (`!merged.has(key)`) hides multi-jurisdiction overlap** (`sanctions.ts:47`). If OFAC and EU both list an address, the report shows only OFAC. EU regulators (ESMA, BaFin) require the EU listing reason. | 🟠 High | Merge into `lists: SanctionsList[]` array per address, render all. |
| 1.3 | **No EU Consolidated Financial Sanctions List structure.** SOURCE_PATHS at `sanctions.ts:16-21` reference JSON files that the codebase doesn't actually sync. EU/UK/UN sync scripts are missing — only OFAC is real (per `scripts/`). | 🔴 Blocker | Implement EU CFSP XML parser, UK OFSI XML, UN consolidated XML. Schedule via Vercel cron daily. |
| 1.4 | **No fuzzy / variant matching.** Address-only matching means an attacker who funds the sanctioned wallet via an intermediary 1-hop away is invisible at the screening layer. Sanctioned-counterparty detection is in `sanctions-exposure.ts` but only catches direct hits. | 🟠 High | Add 1-hop "sanctions-adjacent" rule with severity=high (already a gap flagged in prior forensics audit). |
| 1.5 | **No PEP / Adverse-Media screening.** Required for EU AMLD 5/6 enhanced due diligence. Out of scope for crypto-only screening but CASPs must be told explicitly. | 🟡 Medium | Document in README "Out of scope — pair with [vendor]". |
| 1.6 | **Cache is per-instance, breaks under Vercel serverless.** Each Lambda cold-start re-reads the JSON. At scale it works, but no central freshness state means two instances can disagree. | 🟡 Medium | Move to Vercel KV / Redis with TTL. |

---

## 2. TRANSACTION MONITORING (TM Tuning SME)

Seven detectors in `lib/typologies/`. I read `layering.ts` end-to-end and reviewed `scorer.ts`.

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 2.1 | **Layering window is hardcoded at 1 hour, 5% tolerance, ETH-only** (`layering.ts:3-5,22`). Real layering on Ethereum routinely uses 15-minute windows AND 4–24h windows AND ERC-20 (USDT). False negative rate against real cases is high. | 🔴 Blocker | Multi-window detector (15m, 1h, 24h), include ERC-20 normalised by token decimals, expose tunable thresholds per tenant. |
| 2.2 | **`matches.find` returns the FIRST eligible outflow** (`layering.ts:42`). One outflow can match many inflows OR be matched once and never again — the implementation can double-count or miss. Ambiguous semantics. | 🟠 High | Greedy-match with consumed-set; add unit tests that lock semantics. |
| 2.3 | **Severity stops at `high` even with 100+ matches** (`layering.ts:56`). Critical layering pattern (>50 hops, professional mixer behaviour) cannot escalate beyond `high`. Score never breaches the `block_or_offboard` threshold from layering alone. | 🟠 High | Add `critical` tier when matches ≥ 25 OR total value ≥ 100 ETH. |
| 2.4 | **Severity weights are educated guesses, not calibrated.** `SEVERITY_WEIGHT` (5/15/30/60) and `TYPOLOGY_MULTIPLIER` (`scorer.ts:9-24`) cannot be defended in a regulator inspection because there is no documented calibration dataset. | 🔴 Blocker | Document calibration methodology in `/methodology` page; cite at least one public dataset (e.g., Elliptic dataset, Chainalysis "Crypto Crime Report" stats) used to set weights. |
| 2.5 | **Score capped at 100 hides extreme risk** (`scorer.ts:34`). An address with 5 critical sanctions hits + layering + mixer scores the same as one with sanctions only. Compliance teams need granularity above 100. | 🟡 Medium | Keep capped 0–100 for UX, but emit `rawScore` + tier (1–5) in API response. |
| 2.6 | **No volume-based detectors** (structuring, smurfing, threshold avoidance). FATF Red Flag 4.2(b). | 🟠 High | Add structuring detector (N transfers just below CTR threshold within window). |
| 2.7 | **No velocity / behaviour-change detector.** A dormant wallet suddenly active = classic mule pattern. `dormant-active.ts` exists but only on activity gap; no velocity z-score. | 🟡 Medium | Add rolling 30d velocity z-score. |
| 2.8 | **No counterparty-cluster awareness.** Treats every address as standalone. Common-input-ownership heuristic absent — major capability gap vs Chainalysis. | 🔴 Blocker (for parity claim) | Add basic cluster heuristic in v0.7 or explicitly de-scope and reposition as "address-level screening" not "wallet-level investigation". |

---

## 3. SAR / REGULATORY REPORTING (Reporting SME)

PDF reviewed at `lib/pdf/report-pdf.tsx`. ~290 lines, react-pdf based.

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 3.1 | **PDF is a risk-report, NOT a SAR.** Beta materials call it "SAR-Ready" but the document is missing every mandatory SAR field: filing institution, filer name + role, suspicious activity dates, narrative section ("Who/What/When/Where/Why/How"), prior SAR references, contact officer. A regulator will reject this if filed. | 🔴 Blocker | Either (a) rename "SAR-Ready" → "Risk Report" in all materials, or (b) add a true SAR template module (FinCEN SAR, EU SAR-equivalent) with all mandated fields, exportable as XML for goAML systems. |
| 3.2 | **No goAML XML export.** Most EU FIUs (Malta MFSA, Spain SEPBLAC, Germany FIU) require goAML XML schema for STR/SAR submission. Without it, the analyst manually re-keys. | 🔴 Blocker for "SAR-Ready" claim | Add goAML XML serializer behind a feature flag. |
| 3.3 | **No 4-eye / dual-control sign-off.** Regulated SARs require analyst + MLRO sign-off with timestamps. The PDF has no signature block, no reviewer field. | 🟠 High | Add signoff section: `analyst (uid+name+ts) → reviewer (uid+name+ts) → MLRO approval (uid+name+ts)`. |
| 3.4 | **Evidence rows truncated to 8** (`report-pdf.tsx:238`). For a layering case with 50 hops, only 8 are shown — defensibility crippled if regulator asks for the rest. | 🟠 High | Render all evidence; paginate beyond 8 with "+N more" continuation pages. |
| 3.5 | **Score "32" is shown without methodology link.** Regulator will ask "why 32, why not 38?" The PDF needs an inline breakdown of `computeScoreBreakdown` already implemented in `scorer.ts:44-55`. | 🟠 High | Add a "Score breakdown" table to the PDF using existing breakdown helper. |
| 3.6 | **No prior-report comparison.** If the same address was scanned 30 days ago and is now scanned again, no diff. Compliance teams need to see what changed (new flags, score delta). | 🟡 Medium | Add `vsLastScan` block when prior scan exists in storage. |
| 3.7 | **PDF disclaimer at footer says "Educational, not regulated AML advice"** (`report-pdf.tsx:282`). This is good legal hygiene but conflicts with selling to CASPs as a screening control. Pick a lane. | 🟠 High | If selling to CASPs: rewrite disclaimer ("Decision support — analyst review required"). If keeping as research tool: stop the B2B pricing motion. |

---

## 4. CDD / KYC LAYERING (Onboarding & Ongoing-Monitoring SME)

ChainSight is wallet-side only. The CASP still needs natural-person KYC, source-of-funds, ongoing monitoring.

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 4.1 | **No "what you still need" page in product.** Buyers will assume ChainSight = full AML suite, then panic when their MLRO points out gaps. | 🟠 High | Add `app/methodology/coverage` page: explicit table of what ChainSight covers (wallet screening, TM, sanctions) vs what CASP must source elsewhere (KYC, PEP, AdMed, Travel Rule). |
| 4.2 | **No Travel Rule (FATF R.16) hooks.** EU TFR mandates originator/beneficiary data on transfers ≥ €1000 from Dec-2024. ChainSight ignores this. | 🟠 High | Out-of-the-box Travel Rule is huge — at minimum, document interoperability with TRP/Notabene/Sumsub Travel Rule networks. |
| 4.3 | **No "ongoing monitoring" model.** Watchlist exists (`/api/watchlist`) but rescans require manual trigger or cron — not described as a continuous-monitoring product. | 🟠 High | Document watchlist rescan cadence, expose alert SLA ("we rescan every 6h, alert within 15m"). |
| 4.4 | **No customer-risk-rating output.** AMLD requires CASPs to assign risk rating (Low/Med/High) to each *customer*, not each *address*. ChainSight outputs address-rating, leaving the customer-level aggregation to the buyer. | 🟡 Medium | Add `/api/customers/{id}/aggregate` endpoint that rolls up multiple addresses → customer rating. |
| 4.5 | **Watchlist rescan endpoint exists but no alert delivery audit.** `app/api/watchlist/rescan` should record who triggered, what changed, and dispatch trail (email delivered? bounced?). | 🟠 High | Add `alert_dispatch_log` table; surface in dashboard. |

---

## 5. AUDIT TRAIL & REGULATOR-READINESS (Inspection-Defence SME)

This is the branch that determines whether MFSA / BaFin / SEPBLAC will accept ChainSight as a control during onsite inspection.

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 5.1 | **No immutable audit log.** Storage layer (`lib/storage/`) saves scans, but there's no append-only log of: who triggered it, with what API key, against what rule version, and what was returned. Regulators require it. | 🔴 Blocker | Add `audit_events` table; log every scan, login, watchlist edit, list-sync. Serve via `/api/audit/export`. |
| 5.2 | **No rule-version pinning per scan.** `scorer.ts` weights can change tomorrow and a re-run gives a different score. Defensibility = zero. | 🔴 Blocker | Add `rules_version` (e.g., `2026-04-28-r1`) to every saved scan. Make `RiskReport.meta` carry a content hash of the rule pack. |
| 5.3 | **5-year retention not enforced.** Storage is dual (sqlite + postgres) but no retention policy code. EU AMLR requires 5-year retention of records. | 🟠 High | Add retention policy doc + `archived_scans` partition; protect against premature deletion. |
| 5.4 | **No SOC2 / ISO27001 status, no data residency statement.** Procurement at any EU CASP will block on this in week 1. | 🔴 Blocker (for first paying customer) | Publish a one-page "Trust" section: data residency (EU? Vercel region?), encryption at rest/in transit, sub-processors, retention, deletion-on-request. |
| 5.5 | **No DPIA / GDPR Article 30 record.** Pseudonymous wallet data is *still* personal data when combined with KYC at the customer's side. Without DPIA template, CASPs cannot legally onboard ChainSight. | 🟠 High | Provide a DPIA template (Markdown) that buyer can adapt. |
| 5.6 | **PDF generated server-side, but no signing / hashing.** Two analysts could see different PDFs for the same scan. No tamper-evidence. | 🟠 High | Hash the PDF (SHA-256) at render time; store hash with scan; print hash on the PDF footer. |
| 5.7 | **Auth: bcrypt cost=10, no MFA, no rate-limit on `/api/auth/login`** (`lib/auth/users.ts:5`, `app/api/auth/login`). Cost 10 is fine; missing MFA + missing rate-limit is the gap. Compliance teams test for credential-stuffing on first day. | 🔴 Blocker | Add login rate-limit (5 attempts / 15m / IP+email). Add TOTP MFA (otpauth lib) before charging customers. |
| 5.8 | **Session JWT: 7-day TTL, no rotation, no revocation list** (`lib/auth/session.ts:5`). If a token is leaked, it's valid for 7 days with no kill-switch. | 🟠 High | Reduce to 24h, add refresh-token + a revoked-jti store. |
| 5.9 | **No structured logging / no PII redaction policy.** Already noted in prior session. Auditors will ask "show me logs of every sanctions hit in March". You can't. | 🟠 High | Add pino/winston with structured fields; redact `email`, `passwordHash`, raw addresses optional. |
| 5.10 | **No public Status / Uptime page.** Procurement asks for 99.9% SLA evidence. | 🟡 Medium | Wire status.chainsight.io (BetterStack/Statuspage). |

---

## CONSOLIDATED VERDICT (cross-branch)

**🔴 Blockers preventing first paying CASP customer (must close before sales motion):**
1. Real EU/UK/UN sanctions sync (1.3)
2. Sanctions freshness SLA exposed (1.1)
3. Layering detector multi-window + ERC-20 (2.1)
4. Documented severity-weight calibration (2.4)
5. Either drop "SAR-Ready" claim OR build true SAR + goAML XML (3.1, 3.2)
6. Immutable audit log + rule-version pinning per scan (5.1, 5.2)
7. Trust page (data residency, sub-processors, retention) (5.4)
8. Auth hardening: rate-limit + MFA (5.7)

**Effort estimate to close all blockers:** 4–6 engineering weeks.

**Realistic positioning today:** "Address-level AML screening + decision-support tool for crypto compliance teams." NOT "regulated AML control" and NOT "SAR filing system" — those claims must be earned with the fixes above.

**Regulator-readiness verdict:** If a CASP showed ChainSight v0.6.0 to MFSA tomorrow as their primary screening control, **it would NOT pass**. The four most likely findings: (a) no rule-version pinning, (b) no immutable audit log, (c) sanctions list freshness uncontrolled, (d) no DPIA. ChainSight CAN pass as a *secondary / complementary* control alongside an existing vendor — that is the honest beta positioning.

**Path to "regulated control" status:** v0.7 closing all 🔴 + a SOC2 Type-1 in motion (3–4 months) + one EU CASP design-partner that pilots and provides a reference letter. Realistic ARR target by month 9: €60–120k from 3–6 design partners.

---

*Generated 2026-04-28 by 5-branch AML specialist audit.*
