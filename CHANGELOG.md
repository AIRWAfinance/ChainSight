# Changelog

All notable changes to ChainSight are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.1] — 2026-04-29

### Added

- **TOTP MFA** (`lib/auth/totp.ts`): pure-Node RFC 6238 implementation —
  HMAC-SHA1, 30-second step, 6-digit codes, ±1 step skew tolerance,
  constant-time compare. Tests include the RFC 6238 reference vector
  (`287082` at T=59).
- **MFA endpoints**: `/api/auth/mfa/{setup,verify,login,disable}`.
  Disable requires both current password AND current TOTP code.
- **Half-auth session model**: `signSession({ mfa: false })` issues a
  10-minute MFA-pending cookie. Protected pages gated on `mfa: true`
  via middleware + new `getAuthenticatedSession()` (replaces
  `getSession` in all 7 protected API routes).
- **MFA enrolment UI** (`/settings/mfa`): Setup → otpauth URI + secret
  + manual-entry table → Verify → Disable controls.
- **Login two-step flow**: password step returns `{ needs_mfa: true }`
  for enrolled users; client posts code to `/api/auth/mfa/login` to
  upgrade the cookie to a full session.
- **Storage**: `totp_secret` + `totp_verified_at` columns on `users`
  (SQLite + Postgres) with additive migration so existing databases
  don't break. `UserRow.totpEnabled` flag exposed in `/api/auth/me`.
- **Audit-log events**: `mfa_setup_started`, `mfa_enrolled`,
  `mfa_verify_fail`, MFA-stage login fail, `mfa_disable_password_fail`,
  `mfa_disable_code_fail`, `mfa_disabled`.
- **Nav**: signed-in users see a `2FA` / `2FA ✓` link to
  `/settings/mfa`.

### Notes

- v0.7.1 fully closes audit Blocker 5.7 (no more "partial" status).
- QR-code rendering deferred to v0.8 — manual entry is universally
  supported by authenticator apps and avoids adding a runtime dep
  mid-cycle.

---

## [0.7.0] — 2026-04-29

The "regulator-ready" release. Closes every 🔴 blocker identified by the
internal 5-branch AML specialist audit (sanctions screening, transaction
monitoring, SAR/reporting, CDD/KYC layering, audit-trail readiness).

### Added

- **`/methodology/coverage`** — honest scope statement (what ChainSight
  covers, what is partial, what your AML programme must source elsewhere).
- **`/methodology/calibration`** — full defensibility narrative for the
  composite-score formula, severity weights, typology multipliers, verdict
  tiers, and public references behind every design choice.
- **`/trust`** — 12 control statements (data residency, encryption, auth,
  audit trail, rule-version pinning, sanctions freshness, retention,
  deletion, sub-processor change policy, incident response, PII scope) +
  5-row sub-processor table + attestation roadmap card + DPIA download CTA.
- **`docs/DPIA_TEMPLATE.md`** — 6-section regulator-grade template, served
  as a downloadable `.md` from `/api/trust/dpia`.
- **`SanctionsFreshnessBanner`** — green when fresh, red + pulsing dot
  when any list >24h stale.
- **Immutable audit trail** — append-only `audit_events` table (SQLite +
  Postgres) with SHA-256 payload hash; storage interface intentionally
  exposes append + list only (no update / no delete). Every login,
  register, logout, scan, save, delete, PDF export, watchlist
  add/remove/rescan, sanctions sync, and audit export logged.
- **`/api/audit/export`** — NDJSON or JSON of own events with action,
  targetType, from, to, limit filters. Self-logs export.
- **Rule-version pinning** — every `RiskReport.meta` carries a SHA-256
  fingerprint of the rule pack (severity weights + multipliers + detector
  tunables). PDF footer prints `Rules 2026-04-29-r1 · fp:abc123…`.
- **Sanctions multi-list merge** — `SanctionedAddress.lists: SanctionsList[]`
  tracks every applicable jurisdiction (OFAC + EU + UK + UN), not just
  first match.
- **`scripts/sync-un.ts`** — UN Security Council consolidated XML sync.
- **`/api/cron/sync-sanctions`** — daily Vercel cron at 02:00 UTC, auth
  via `x-vercel-cron` header OR `CRON_SECRET` Bearer token.
- **`/api/sanctions/freshness`** — public endpoint feeding the banner +
  `RiskReport.meta.sanctionsFreshness` per scan.
- **Login rate-limit** — 5 attempts / 15 min / (IP + email). 429 +
  `Retry-After` on exceedance. Audit-logged.
- **Layering detector — multi-window + multi-asset:**
  - Three windows: 15min (high), 1h (medium), 24h (low) with
    tightest-window-wins matching.
  - Asset-aware grouping: ETH and each ERC-20 contract produce
    independent findings.
  - Stablecoin-aware critical threshold: ≥100k USDT/USDC notional vs
    ≥100 ETH-equivalent.
- **Site-wide security headers** via `middleware.ts`:
  `Strict-Transport-Security`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`.

### Fixed

- **ERC-20 decimals (latent bug)** — `tokenDecimal` was missing from
  `RawTx` and `NormalizedTransaction`. Non-18-decimal tokens (USDT/USDC
  are 6-decimal) were silently mis-scaled by 12 orders of magnitude.
  Now propagates from Etherscan response and is used in `normalize()`.
- **Layering double-count bug** — `matches.find` could match the same
  outflow against multiple inflows. Replaced with consumed-set semantics;
  each outflow matched at most once.
- **Layering severity ceiling** — was capped at `high` even with 100+
  matches. Now escalates to `critical` at ≥25 matches OR ≥100 ETH /
  ≥100k stablecoin USD.
- **Sanctions first-match-wins bug** — multi-jurisdiction overlap was
  hidden (only the first list was returned). Now lists all applicable
  jurisdictions per address.

### Changed

- **Sanctions sync output schema** — all 4 sync scripts (OFAC, EU, UK,
  UN) now emit ISO-8601 `lastSyncedAt`, `lastSyncOk`, `count`, `list`
  metadata so freshness can be computed deterministically.
- **`RiskReport.meta`** — gains `rulesVersion`, `rulesFingerprint`,
  `rulesDate`, `rulesRevision`, `sanctionsFreshness[]`.
- **PDF footer** — now prints rules version + fingerprint, drops
  "Educational, not regulated AML advice" wording in favour of
  "Decision-support, analyst review required" (consistent with the
  product positioning).
- **OUTREACH.md** — dropped "SAR-ready PDF export" claim. ChainSight
  produces a citation-backed risk-evidence PDF, not a SAR filing
  document.
- **Engine `VERSION`** — `0.3.0` → `0.7.0` (was lagging behind
  package.json).

### Tests

- 60 tests across 9 files. 11 net new in this cycle:
  `tests/audit.test.ts` (6), `tests/calibration.test.ts` (6),
  `tests/rate-limit.test.ts` (5), `tests/rules-version.test.ts` (4),
  `tests/sanctions-merge.test.ts` (6), `tests/trust.test.ts` (4),
  +5 layering cases in `tests/typologies.test.ts`.

### Closed audit blockers (from `beta/AUDIT_AML_5_SPECIALISTS.md`)

| # | Blocker | Status |
|---|---------|--------|
| 1.1 | Sanctions freshness SLA exposed | ✅ |
| 1.2 | Multi-jurisdiction merge | ✅ |
| 1.3 | EU/UK/UN sync + daily cron | ✅ |
| 2.1 | Layering multi-window + ERC-20 | ✅ |
| 2.2 | Layering double-count bug | ✅ |
| 2.3 | Layering severity ceiling | ✅ |
| 2.4 | Score calibration documented | ✅ |
| 5.1 | Immutable audit log | ✅ |
| 5.2 | Rule-version pinning per scan | ✅ |
| 5.4 | Trust statement + data residency | ✅ |
| 5.5 | DPIA template | ✅ |
| 5.7 | Login rate-limit | 🟠 partial (TOTP MFA pending) |

### Operational notes for deploy

- **Required env var on Vercel:** `CRON_SECRET` for manual cron
  triggers. Vercel-scheduled cron uses the `x-vercel-cron` header and
  works without it.
- **Required env var:** `CHAINSIGHT_SESSION_SECRET` (≥ 32 chars).
- **Required env var:** `ETHERSCAN_API_KEY`.
- **Optional env var:** `CHAINSIGHT_DB_URL` for Postgres (otherwise
  falls back to local SQLite — development only).

### Known nice-to-have items deferred to v0.8

- TOTP MFA (closes the partial 5.7).
- Audit log hash-chain (currently per-event hash, not chained).
- Calibration study against Elliptic / Chainalysis public datasets.
- Multi-hop tracing (BFS depth-2).
- Cross-chain correlation.
- Cluster heuristics (common-input-ownership).
- Rename `middleware.ts` → `proxy.ts` (Next 16 deprecation warning).

---

## [0.6.0] — 2026-04-28

- Counterparty graph visualisation (Task #16).
- Beta launch kit (Task #17).
- Wallet entity labels + persistent storage + dashboard + watchlist.
- 6-chain support (ETH, Polygon, BSC, Arbitrum, Base, Optimism).

## Earlier versions

See `git log` for the v0.1 → v0.5 history.
