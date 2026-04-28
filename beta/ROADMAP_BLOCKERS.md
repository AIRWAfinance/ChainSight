# Option A — Blocker-closure roadmap (v0.7)

**Trigger to start:** ≥2 validation calls from `VALIDATION_TARGETS.md`
explicitly say "yes if these blockers close." Until then, do NOT start.

**Target version:** ChainSight v0.7.0
**Target duration:** 4–6 engineering weeks (solo)
**Target outcome:** Beta-ready to charge €5k/yr from 3 design-partner CASPs.

---

## Sprint 1 — Defensibility (week 1–2)

### Ticket A.1 — Audit-event log
**Why:** Blocker 5.1. Regulators require immutable audit log of every scan,
login, watchlist change, list-sync.
**Files:** `lib/storage/types.ts`, `lib/storage/postgres.ts`, `lib/storage/sqlite.ts`,
new `lib/audit/log.ts`, new `app/api/audit/export/route.ts`
**Acceptance:**
- [ ] Append-only `audit_events` table (id, ts, actor_user_id, actor_ip, action, target_type, target_id, payload_hash, payload_json).
- [ ] Every scan, login, register, watchlist add/edit/delete, sanctions sync writes one event.
- [ ] `/api/audit/export?from=&to=` returns NDJSON to authenticated users (own events) or admin (all).
- [ ] Tests cover: no event ever updated/deleted; race-safe concurrent inserts.

### Ticket A.2 — Rule-version pinning per scan
**Why:** Blocker 5.2. A re-run with different weights gives a different score.
Defensibility = zero without pinning.
**Files:** `lib/engine/runScan.ts`, `lib/engine/scorer.ts`, `lib/engine/types.ts`
**Acceptance:**
- [ ] Compute SHA-256 of `{SEVERITY_WEIGHT, TYPOLOGY_MULTIPLIER, detector source-file hashes}` at module load. Call this `rulesVersion`.
- [ ] `RiskReport.meta` includes `rulesVersion: string` and `rulesVersionFingerprint: string` (date+hash).
- [ ] Every saved scan persists the rules version.
- [ ] Methodology page shows current rules version + changelog.

### Ticket A.3 — Auth hardening
**Why:** Blocker 5.7. No rate-limit, no MFA. Credential-stuffing is trivial.
**Files:** `app/api/auth/login/route.ts`, new `lib/auth/rate-limit.ts`, new `lib/auth/totp.ts`
**Acceptance:**
- [ ] Login rate-limit: 5 attempts / 15min / (IP + email). 429 with `Retry-After`.
- [ ] Optional TOTP MFA: enroll endpoint, verify endpoint, recovery codes.
- [ ] Failed-login + lockout events logged via A.1.

---

## Sprint 2 — Sanctions truth (week 3–4)

### Ticket A.4 — Real EU CFSP sync
**Why:** Blocker 1.3. Source path exists but no sync script.
**Files:** new `scripts/sync-eu.ts`
**Source:** EU FSF (Financial Sanctions Files) XML — `https://webgate.ec.europa.eu/fsd/fsf`
**Acceptance:**
- [ ] Downloads + parses XML, extracts crypto wallet addresses.
- [ ] Writes `data/sanctions/eu-consolidated.json` in same shape as OFAC.
- [ ] Stores `lastSyncedAt` in metadata file alongside the JSON.
- [ ] Tested against known sanctioned wallets (e.g., Hamas-linked addresses).

### Ticket A.5 — Real UK OFSI sync
**Source:** `https://assets.publishing.service.gov.uk/.../ConList.xml`
**Files:** new `scripts/sync-uk.ts`
**Acceptance:** parallel to A.4 for UK OFSI consolidated list.

### Ticket A.6 — Real UN SC sync
**Source:** `https://scsanctions.un.org/resources/xml/en/consolidated.xml`
**Files:** new `scripts/sync-un.ts`
**Acceptance:** parallel; emits `data/sanctions/un-sc.json`.

### Ticket A.7 — Multi-list merge + freshness exposure
**Why:** Blocker 1.1, 1.2. Today: first-match-wins + invisible staleness.
**Files:** `lib/data/sanctions.ts`, `lib/engine/types.ts`, `app/api/scan/route.ts`,
`components/Mast.tsx` or new `components/SanctionsBadge.tsx`
**Acceptance:**
- [ ] `SanctionedAddress.lists: SanctionsList[]` — all matching lists, not just first.
- [ ] API response includes `sanctionsFreshness: { OFAC_SDN: {lastSyncedAt, ageHours}, ... }`.
- [ ] UI banner if any list >24h stale.
- [ ] PDF report includes freshness footer.

### Ticket A.8 — Vercel Cron for daily sync
**Files:** `vercel.json`, new `app/api/cron/sync-sanctions/route.ts`
**Acceptance:**
- [ ] Daily 02:00 UTC cron runs all 4 sync scripts.
- [ ] Failures emit alert + log via A.1.
- [ ] Cron endpoint protected with `CRON_SECRET`.

---

## Sprint 3 — Detector calibration + repositioning (week 5–6)

### Ticket A.9 — Layering detector multi-window + ERC-20
**Why:** Blocker 2.1. 1h-only + ETH-only misses real-world cases.
**Files:** `lib/typologies/layering.ts`, `lib/engine/types.ts`
**Acceptance:**
- [ ] Three windows: 15min (severity high), 1h (medium), 24h (low).
- [ ] ERC-20 transfers normalised by token decimals (use existing `evm-token-decimals` skill pattern).
- [ ] Greedy-match with consumed-set semantics; no double-counting.
- [ ] Severity escalates to `critical` when matches ≥25 OR notional ≥100 ETH-equivalent.
- [ ] Unit tests: 6 known patterns (clean / 1h-ETH / 15m-ETH / 24h-USDT / mixed / edge cases).

### Ticket A.10 — Severity-weight calibration document
**Why:** Blocker 2.4. Weights undefendable without methodology.
**Files:** new `app/methodology/calibration/page.tsx`, new `docs/CALIBRATION.md`
**Acceptance:**
- [ ] Document the dataset(s) used to set 5/15/30/60 + 1.5/1.3/1.2/...
- [ ] At minimum cite Chainalysis Crypto Crime Report, Elliptic public dataset.
- [ ] Show distribution of scores against a labelled test set.
- [ ] Public page linked from methodology + footer.

### Ticket A.11 — SAR claim resolution
**Why:** Blocker 3.1, 3.2. "SAR-Ready" vs reality.
**Decision branch:**
- **A.11a (cheap):** Drop "SAR-ready" wording from all materials; rename PDF as "Risk evidence pack." (Done in part during Option B.)
- **A.11b (expensive, only if validation says SAR is the killer feature):** Build true SAR module + goAML XML serializer. ~2 extra weeks.

**Default = A.11a unless validation calls in `VALIDATION_TARGETS.md` explicitly demand SAR filing.**

### Ticket A.12 — Trust page (data residency + sub-processors)
**Why:** Blocker 5.4. First procurement question.
**Files:** new `app/trust/page.tsx`
**Acceptance:**
- [ ] Data residency statement (Vercel region, Postgres region).
- [ ] Sub-processor list (Vercel, Postgres provider, email provider, Etherscan).
- [ ] Encryption at rest / in transit statement.
- [ ] Retention policy (5 years).
- [ ] Deletion-on-request flow described.
- [ ] DPIA template downloadable as Markdown.

---

## Out of scope for v0.7 (parked)

- Multi-hop tracing (BFS depth-2) — keep on roadmap, not a blocker for first paying customer.
- Cross-chain correlation — same.
- Cluster heuristics — same.
- True SAR module (goAML XML) — only if validation demands it.
- SOC2 Type-1 — start the process during sprint 3 (3–4 month clock); not blocking first sale, blocking second.

---

## Definition of done — v0.7 release

- [ ] All Sprint 1, 2, 3 tickets shipped + tested
- [ ] `AUDIT_AML_5_SPECIALISTS.md` updated to mark closed items
- [ ] `/methodology/coverage` updated to reflect new "covered" rows
- [ ] One design-partner CASP signed for paid pilot (€5k+/yr)
- [ ] First scan run by a paying customer logged via audit-event log

**Then and only then start v0.8 (multi-hop, cross-chain, cluster heuristics).**
