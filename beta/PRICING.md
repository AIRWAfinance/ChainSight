# ChainSight pricing — design-partner phase

> **Public commitment:** the prices below are real and locked. The first
> €3k/year you pay for ChainSight as a design partner is locked at that
> price for life — no future tier increase will apply to your account.

## Why these numbers

ChainSight is positioned as a **decision-support layer** that sits alongside
your existing AML stack — not a replacement for Chainalysis, Elliptic, or
TRM. We charge a **fraction** of those vendors because we explicitly do
*less* in v0.7:

- **Chainalysis Address Screening** is ~$25–35k/yr — multi-chain, cluster
  heuristics, 10+ years of label data.
- **Elliptic Lens** is ~$30–50k/yr — wallet screening + cluster
  intelligence.
- **TRM Labs** is $40–80k/yr — strong on Travel Rule + real-time.
- **OpenSanctions** is free as a data source — but it's an aggregator, not
  a screening + behavioural-detection product.

ChainSight today gives you:
- Address-level AML screening against OFAC + EU + UK + UN sanctions
- Seven FATF-typology behavioural detectors
- Citation per finding (FATF / FinCEN / OFAC / EBA reference)
- Deterministic, rule-version-pinned scoring (regulator-defensible)
- Immutable audit trail (append-only, SHA-256 payload-hashed)
- TOTP MFA, security headers, GDPR-grade data handling
- 6-chain coverage (ETH, Polygon, BSC, Arbitrum, Base, Optimism)

What we **do not** give you in v0.7 (yet — see roadmap):
- Multi-hop tracing beyond 1 hop
- Cluster heuristics (common-input-ownership)
- Cross-chain controller correlation
- Travel Rule (FATF R.16) integration
- 50,000+ entity labels

The price ladder reflects this honestly.

---

## Tier ladder

| Tier | Price (annual) | Best for | What's included |
|------|----------------|----------|-----------------|
| **Free design partner** (months 1–3) | €0 | First 3 partners, signed pilot agreement | Everything in v0.7. Public testimonial expected at end of pilot. |
| **Design partner** (year 1+) | **€3,000** locked-for-life | Small EU CASPs, OAM/SEPBLAC-registered platforms | 1 user, up to 20k scans/month, all v0.7 features. **Free upgrade to v0.8 features as they ship.** |
| **Standard CASP** (post first 5 customers) | **€6,000** | Mid-market CASPs, ETP issuers, B2B custodians | 1–3 users, up to 50k scans/month, priority email support. |
| **Mid-market** (post-SOC 2 Type 1) | **€15,000** | Tier-1 EU CASPs, BaFin/MFSA-licensed exchanges | 5 users, 100k scans/month, custom rule weights, multi-hop tracing v1, SLA 99.5%. |
| **Enterprise** (post-multi-hop + 50k labels) | **From €50,000** | Custodial banks, fund administrators, fintechs with crypto exposure | Unlimited users, unlimited scans, 99.9% SLA, dedicated support, on-prem option, Travel Rule integration. |

All prices in EUR. VAT additional where applicable.

## What you don't pay for

- **Per-scan fees.** B2B compliance buyers prefer flat seat pricing — that's what we charge.
- **Implementation fees.** Onboarding is included.
- **Custom typology fees.** Our typology engine is open-source. Add your own
  detectors via PR; we'll merge and credit.
- **PDF export fees.** The citation-backed PDF is the deliverable, not an
  upsell.

## What you do pay extra for

| Add-on | Price |
|--------|-------|
| Hosted EU-only deployment (vs Vercel global) | +€2,000/yr |
| Custom domain on the dashboard (whitelabel-light) | +€1,500/yr |
| White-label PDF report (your logo, no ChainSight branding) | +€2,500/yr |
| Dedicated Slack support channel | +€3,000/yr |
| Quarterly compliance review call (1h with the team) | +€2,000/yr |

## Discounts

- **Annual prepayment**: −10%
- **3-year commit**: −20% with locked-for-life baseline price
- **Reference customer**: free upgrade to next tier when ready, in exchange
  for written + recorded testimonial

## What we ask of design partners

In exchange for the €3,000 locked-for-life price (vs €15,000 list once SOC 2
ships), we ask:

1. **A 30-minute onboarding call** so we understand your AML programme.
2. **A 30-minute feedback call every 60 days** for the first year.
3. **A public testimonial** (written + 2-min video) once the product has
   demonstrably helped your team. Negotiable timing.
4. **Honest bug reports** when something breaks. Better signal beats vanity
   metrics.

That's it. No exclusivity, no NDA on the tool itself (which is
MIT-licensed), no penalty if you cancel. Compliance is a small world; we
build trust by not playing games.

---

## Payment

- **Annual invoice** with 14-day terms (preferred).
- **Stripe Checkout** at `/pricing` for self-serve €3k tier.
- **Bank transfer SEPA** (preferred for EU CASPs — no card surcharges).
- **No crypto payments** — yes, the irony is not lost on us, but a regulated
  CASP's accountant paying us in USDT defeats half the point.

## Roadmap-keyed price changes

| When | What ships | New baseline list price |
|------|------------|-------------------------|
| **Today** | v0.7.1 — current state | €3,000 design partner |
| Q3 2026 | Multi-hop tracing v1 (BFS depth-2), 50k entity labels | €8,000 standard |
| Q4 2026 | SOC 2 Type 1 attestation | €15,000 mid-market |
| H1 2027 | Cluster heuristics, cross-chain correlation | €25,000 mid-market |
| H2 2027 | SOC 2 Type 2, Travel Rule v1 | €50,000+ enterprise |

**Your locked-for-life price never changes**, regardless of which milestone
ships. New tiers apply only to new customers, never to existing accounts.

---

## Outreach paragraph (paste into emails)

> ChainSight is currently in design-partner phase at **€3,000/year, locked
> for life**. That's roughly 12% of Chainalysis Address Screening's entry
> price. You get every v0.7 feature today (citation-backed AML scoring,
> regulator-grade audit trail, TOTP MFA, six-chain coverage) and free
> upgrades to v0.8 features (multi-hop tracing, cluster heuristics, 50k+
> entity labels) as they ship. We accept three more design partners. After
> that, list price for the same tier becomes €8,000 in Q3 2026.

---

## Internal note (delete before publishing)

This page exists at `beta/PRICING.md` AND at `app/pricing/page.tsx` (live
at `/pricing`). Keep both in sync. Update `beta/ROADMAP_BLOCKERS.md` when a
roadmap item ships so the price ladder stays accurate.
