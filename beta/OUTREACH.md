# ChainSight beta outreach kit

Plain-text + Slack/LinkedIn DM templates to use when reaching out to compliance
contacts, fintech founders, fund administrators, exchanges, and regulators.

Replace `[NAME]`, `[COMPANY]`, `[TOPIC]` before sending. Keep it under 120
words. Compliance leads are senior people; respect their time.

---

## 1. Cold email — short (compliance lead, exchange/VASP)

> Subject: AML wallet screening — open-source, citation-backed, defensible
>
> Hi [NAME],
>
> I built ChainSight for the same problem we hit at Bet365: black-box risk
> scores fail audit. ChainSight screens any EVM wallet against OFAC, EU and UK
> sanctions, mixer + scam clusters, and 7 FATF money-laundering typologies —
> and every flag links to its regulatory source.
>
> Open source, deterministic, MIT licensed, runs in your stack.
>
> Free during beta. ~6 second scans on 6 chains today (ETH, Polygon, BSC,
> Arbitrum, Base, Optimism). Email alerts on score changes. SAR-ready PDF export.
>
> Worth 10 minutes? I'd value your read on whether the report shape
> actually clears your audit checklist.
>
> Demo + signup: https://chainsight.airwa.finance/beta
>
> — Jorge

---

## 2. Cold email — short (fintech / payments founder)

> Subject: Drop-in AML screening for crypto-touch flows
>
> Hi [NAME],
>
> Saw [COMPANY] is moving into [TOPIC] — congrats. If any of those flows
> touch crypto, you'll need wallet-level AML screening sooner than later.
>
> ChainSight does that today. EVM wallets across 6 chains, FATF-aligned
> typology detection, citation-first reports auditors actually accept. Open
> source, runs server-side, MIT licensed.
>
> Beta is free while we tune it. Would you or someone on your compliance
> side want a 10-minute walk-through?
>
> https://chainsight.airwa.finance/beta
>
> — Jorge

---

## 3. LinkedIn DM (90 words max)

> Hi [NAME] — I'm building ChainSight, an open-source AML wallet-screening
> engine that produces audit-defensible reports with FATF/OFAC citations
> per finding. Free during beta. Watching for early users with real
> compliance workflows on EVM chains. If you'd find that useful at
> [COMPANY], I'd love to send a 10-minute demo. No pressure.
>
> https://chainsight.airwa.finance/beta

---

## 4. Slack / Discord DM (engineering compliance crypto channels)

> Hey, building an open-source AML wallet-risk scanner for crypto compliance
> teams (`AIRWAfinance/ChainSight` on GitHub). FATF-typology detection +
> citation-first reports. Free beta if anyone on your team is dealing with
> crypto onboarding screening or deposit/withdraw monitoring — would love
> 10 minutes of feedback.

---

## Where to send

Order roughly by hit rate:

1. **Personal network** — anyone you know in compliance, MLRO, fintech, or
   exchange teams. Warm intros convert 10× cold.
2. **Bet365 compliance + crypto contacts** (only outside the IP scope of
   your contract — see `IP_NOTES.md`).
3. **Crypto AML practitioners on LinkedIn** — search "MLRO crypto",
   "Head of Compliance crypto", "AML analyst crypto".
4. **r/Compliance, r/cryptocurrency professional Slacks**, ACAMS chapters,
   ICA alumni group, ABA Banking Journal commenters.
5. **Smaller exchanges / OTC desks** — they're underserved by Elliptic
   pricing and likely to try a free beta.
6. **Auditors & accounting firms doing crypto attestation work** — they
   benefit from the citations directly.

---

## Talking points if asked "why you?"

- 9 years of AML/CDD operations, ICA Advanced AML certified, current
  team-leading role at Bet365 Malta — not a side project from someone
  who's never seen a real SAR.
- Built the engine personally. Every detector is reviewable code, not
  a model card.
- Open source on day one. Vendors fight against this; we lead with it.

## Talking points if asked "why open source?"

- Compliance audits demand reproducibility. Black-box ML scoring drifts
  between runs and fails defensibility.
- Self-hosted regulated entities can't ship customer addresses to a SaaS
  in another jurisdiction without a vendor-management nightmare.
- The moat isn't the detector code; it's the curated entity dataset, the
  ongoing-monitoring infra, the reporting pipeline, and the delivered SLAs.

---

## Follow-up cadence

If no reply in 5 business days:
- Send one short follow-up referencing a *new* feature or a *specific* hook
  for that company. Never "just bumping this."
- After two follow-ups: stop. Move on. Their priority queue isn't your call.

If they reply yes:
- Get them onto the platform within 24 hours.
- Send a 5-minute Loom walking through scanning, saving, watchlist, alerts.
- Schedule a 30-minute follow-up two weeks later — *with a printed list of
  questions you want them to answer.*
