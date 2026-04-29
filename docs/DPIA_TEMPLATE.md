# DPIA Template — Adopting ChainSight as a Decision-Support Tool

> **How to use this template**
>
> 1. Fork or copy this file into your own DMS / GRC system.
> 2. Replace `[YOUR ORG]` with your CASP or regulated entity name.
> 3. Have your DPO complete the answer column for each question.
> 4. The "ChainSight answer" column gives the vendor-side facts as of your
>    contract date — verify each against the live `/trust` page on the day
>    you sign.
> 5. Approve, sign, and store with your AML programme documentation.

**Document owner:** [DPO name]
**Version:** 1.0
**Adopted on:** [date]
**Next review:** [date + 12 months]

---

## 1. Processing description

| # | Question | [YOUR ORG] answer | ChainSight answer |
|---|----------|-------------------|-------------------|
| 1.1 | What is the purpose of the processing? | | Wallet-level AML risk screening + transaction monitoring of public Ethereum-family blockchain addresses, used as a decision-support tool for the customer's compliance team. |
| 1.2 | What is the legal basis for processing? | | Article 6(1)(c) GDPR — compliance with legal obligation (EU AMLR, FATF R.10, R.15, R.16). For the controller's own customer data: same. |
| 1.3 | What categories of data subjects are involved? | | Customers of [YOUR ORG] when their wallet addresses are screened. ChainSight does not see natural-person identifiers — only on-chain addresses. |
| 1.4 | What categories of personal data are processed? | | (a) Customer admin account: email + bcrypt hash. (b) Pseudonymous on-chain addresses + their public transaction history. (c) Audit log entries (admin actor, action, timestamp, IP). |
| 1.5 | Are special-category data (Article 9) processed? | | No. |

## 2. Data flow

| # | Question | [YOUR ORG] answer | ChainSight answer |
|---|----------|-------------------|-------------------|
| 2.1 | Where is the processing performed? | | Vercel EU regions (fra1 / cdg1) when configured at deploy. Customer-selected EU Postgres provider. |
| 2.2 | Are there international data transfers? | | No personal data leaves the EU when EU-pinned regions are used. Public blockchain data is fetched from Etherscan (US-based but contains no PII). |
| 2.3 | What is the data retention period? | | Saved scans + watchlist + audit log: 5 years from last customer activity (EU AMLR R.40). Audit log retained at minimum even if the customer account is deleted, per regulator requirement. |
| 2.4 | How is data deleted at end of retention? | | Hard delete via deletion-on-request endpoint. Audit log entries pseudonymised (actor user-id replaced with hash) but retained for the regulatory minimum. |

## 3. Sub-processors

See live list at `/trust`. Material changes notified 30 days in advance.

| # | Sub-processor | Purpose | DPA |
|---|---------------|---------|-----|
| 3.1 | Vercel, Inc. | Hosting + serverless compute | https://vercel.com/legal/dpa |
| 3.2 | Postgres provider | Primary storage | Per provider DPA |
| 3.3 | Etherscan | Public blockchain explorer API | None required (public data) |
| 3.4 | SMTP / Resend | Watchlist alerts | Per provider DPA |
| 3.5 | GitHub, Inc. | Source code only — no customer data | https://github.com/customer-terms/github-data-protection-agreement |

## 4. Technical and organisational measures (Article 32)

| # | Control | ChainSight statement | [YOUR ORG] verification |
|---|---------|----------------------|-------------------------|
| 4.1 | Encryption in transit | TLS 1.3, HSTS, no plaintext fallback. | |
| 4.2 | Encryption at rest | Postgres provider AES-256. | |
| 4.3 | Authentication | bcrypt cost 10, httpOnly + Secure session cookies, login rate-limit 5/15min. TOTP MFA on roadmap. | |
| 4.4 | Access control | Per-tenant data scoping at the API layer. Multi-tenant DB shared schema with `user_id` on every record. | |
| 4.5 | Audit logging | Append-only `audit_events` table with SHA-256 payload hash. No update/delete in API. | |
| 4.6 | Backup + DR | Postgres provider PITR (per provider SLA). RTO/RPO inherits from provider. | |
| 4.7 | Vulnerability mgmt | `npm audit` + Dependabot on the public repo. Security disclosure: cryptoworldinversiones@gmail.com | |
| 4.8 | Incident response | 72-hour notification (Article 33). | |

## 5. Risks identified and mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Vendor outage during AML inspection | Low | High | Saved scans persist locally; PDF exports downloadable any time; rule-version pinned per scan so a re-export reproduces the original. |
| Sanctions list staleness false-negative | Low | Critical | Daily Vercel cron sync; UI banner if any list >24h stale; per-scan `sanctionsFreshness` snapshot in `RiskReport.meta`. |
| Audit-log tampering | Low | High | Append-only storage interface; SHA-256 payload hash per event; tests lock the no-update/no-delete property. |
| Credential stuffing on customer accounts | Medium | Medium | bcrypt + login rate-limit. TOTP MFA on roadmap; required before deploying to production with privileged users. |
| Sub-processor breach | Low | Medium | DPA with each sub-processor; 72-hour customer notification SLA. |

## 6. Decision

- [ ] Approved — adopt ChainSight as a decision-support tool alongside [name primary sanctions vendor / case-management system].
- [ ] Approved with conditions — see attached.
- [ ] Not approved — reasons:

**Approver:** [name, role, date, signature]

---

*ChainSight is positioned as decision-support, not a primary regulated control.
For the explicit scope statement see `/methodology/coverage`. For the live
trust page see `/trust`.*
