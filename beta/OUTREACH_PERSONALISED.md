# Personalised cold outreach — Tier 1 picks (3 of 10)

> 🚨 **DO NOT SEND yet.** Deploy gating action below MUST be resolved first.
> Probed 2026-04-28: `chainsight.airwa.finance` does NOT resolve via DNS,
> and `chain-sight.vercel.app` is a different project. The product has no
> public URL. Sending outreach pointing at a dead domain destroys credibility
> in 1 click. Resolve `{{LIVE_URL}}` placeholders below before sending anything.

## Gating action — fix before any outreach (1 hour)

1. Confirm what Vercel project deploys this repo:
   - `npx vercel link` from the repo root, or check Vercel dashboard for `AIRWAfinance/ChainSight`
   - Note the actual production URL (e.g. `chainsight-airwafinance.vercel.app`)
2. EITHER:
   - **Path A (cheap, 5 min):** Use the Vercel-issued URL in outreach. Replace every `{{LIVE_URL}}` below with that URL.
   - **Path B (proper, 30 min):** Add `chainsight.airwa.finance` as a custom domain in Vercel → set DNS A/CNAME at the airwa.finance registrar → wait for cert. THEN use that URL.
3. Verify the live URL responds 200 on these three paths:
   - `/` (home)
   - `/methodology/coverage` (new scope page from this commit)
   - `/scan` (demo target)
4. Edit `beta/OUTREACH.md` line ~31 too (`https://chainsight.airwa.finance/beta` reference still hardcoded).
5. THEN proceed with outreach.

---

**Strategy:** Spanish founder, Bet365 Malta MLRO credentials, Spanish + EU regulatory fluency. Lead with regulator-specific pain. Reference one *real, recent* compliance signal each prospect has published.

**Pre-send checklist (per prospect):**
- [ ] Confirm the named MLRO/Head of Compliance is still in role (LinkedIn last 30d)
- [ ] Read their latest LinkedIn post or company press release — pick a hook
- [ ] Replace bracketed values
- [ ] Re-read aloud — kill any sentence that sounds like a marketing email
- [ ] Send between Tue–Thu, 09:00–11:00 local time

---

## Pick 1 — Bit2Me (ES, SEPBLAC) — strongest warm path

**Why first:** Spanish home market, language advantage, you can offer a same-timezone call. SEPBLAC is your regulator analogue. Conversion path is the shortest.

**Buyer:** Head of AML / MLRO (likely titled *Responsable de Prevención de Blanqueo de Capitales*)
**Channel preference:** LinkedIn DM → email follow-up

### Email (Spanish — preferred)

> **Asunto:** Screening AML on-chain con citas regulatorias por hallazgo
>
> Hola [NOMBRE],
>
> Soy Jorge Fernández, Team Leader AML/CDD en Bet365 Malta (ICA Advanced AML).
> He construido ChainSight, un motor open-source de screening AML para
> direcciones EVM, pensado específicamente para CASPs registrados en
> SEPBLAC bajo el nuevo marco MiCA + AMLR.
>
> La diferencia frente a Chainalysis/Elliptic: cada hallazgo cita su fuente
> regulatoria (FATF VA RFI, OFAC SDN, EU CFSP, UK OFSI) y el motor es
> determinista — un mismo address el martes y el jueves devuelve el mismo
> score. Defensibilidad real ante una inspección del Banco de España o
> SEPBLAC.
>
> Para que tomes la decisión rápido, he publicado el alcance honesto:
> {{LIVE_URL}}/methodology/coverage
>
> Y el audit de los 8 blockers que aún tenemos abiertos para ser un control
> primario regulado: https://github.com/AIRWAfinance/ChainSight/blob/main/beta/AUDIT_AML_5_SPECIALISTS.md (verify link is public — repo must be public)
>
> ¿Te merecería 20 minutos para una llamada de validación? La pregunta
> concreta: si cerramos esos 8 blockers, ¿pilotaríais 90 días a 5k€?
>
> Saludos,
> Jorge
> https://www.linkedin.com/in/[your-handle]

### LinkedIn DM (140 words)

> Hola [NOMBRE], soy Jorge — Team Leader AML/CDD en Bet365 Malta. He
> construido ChainSight, screening AML on-chain open-source con citas
> FATF/OFAC por cada hallazgo. Pensado para CASPs registrados en SEPBLAC.
>
> Antes de venderte nada, comparto el alcance honesto y el audit de los 8
> blockers que aún tenemos:
>
> {{LIVE_URL}}/methodology/coverage
> https://github.com/AIRWAfinance/ChainSight/blob/main/beta/AUDIT_AML_5_SPECIALISTS.md (verify link is public — repo must be public)
>
> Pregunta concreta: si cerramos esos 8 blockers, ¿pilotaríais 90 días a
> 5k€? Si la respuesta es no, ¿qué cambiaría tu respuesta? 20 minutos esta
> semana?
>
> Saludos.

---

## Pick 2 — Young Platform (IT, OAM) — best paid-pilot odds

**Why second:** Italian CASP, OAM-registered, mid-market budget. Less likely to already have Chainalysis. Bank of Italy + OAM inspection pressure is real and growing post-MiCA. They publish compliance posts on LinkedIn — easy hook.

**Buyer:** MLRO (*Responsabile Antiriciclaggio*) or Head of Compliance
**Channel preference:** Email (Italian-speaking compliance teams skew formal)

### Email (English — universally accepted in IT compliance)

> **Subject:** Citation-backed AML wallet screening, built for OAM/MiCA inspections
>
> Hi [NAME],
>
> I'm Jorge Fernández — AML/CDD Team Leader at Bet365 Malta, ICA Advanced
> AML certified. I built ChainSight specifically for the inspection
> reality your team faces: OAM + Bank of Italy auditors asking *"why this
> address scored 78 and not 42?"* with no defensible answer from a
> black-box vendor.
>
> ChainSight is deterministic. Every flag cites its source (FATF VA RFI
> 2020, OFAC SDN, EU CFSP, UK OFSI). Same address scored Monday and
> Friday returns the same number — and the methodology page shows the
> exact rule version that produced it.
>
> Two things I want you to read before any call:
>
> 1. **Honest scope statement** (what we cover, what we don't, what you
>    layer with): {{LIVE_URL}}/methodology/coverage
> 2. **Open audit of the 8 blockers** still open for "regulated primary
>    control" status: https://github.com/AIRWAfinance/ChainSight/blob/main/beta/AUDIT_AML_5_SPECIALISTS.md (verify link is public — repo must be public)
>
> Validation question for a 20-minute call: *if we close those 8 blockers,
> would Young Platform sponsor a 90-day paid pilot at €5k?* If not, what
> would change the answer?
>
> Free during beta — €5k is the post-blocker pilot ask, not today's.
>
> Thanks,
> Jorge

### LinkedIn DM fallback (90 words)

> Ciao [NAME] — Jorge, AML/CDD Team Leader at Bet365 Malta. Built
> ChainSight: open-source AML wallet screening, every flag cites FATF/OFAC.
> Built for the OAM inspection reality your team handles.
>
> Honest scope: {{LIVE_URL}}/methodology/coverage
> Open blockers audit: https://github.com/AIRWAfinance/ChainSight/blob/main/beta/AUDIT_AML_5_SPECIALISTS.md (verify link is public — repo must be public)
>
> 20-min validation call this week? Question: post-blocker, would you
> pilot at €5k for 90 days?

---

## Pick 3 — Bitpanda (AT/MFSA) — highest credibility prize

**Why third:** Largest target. Hardest to land. But the Bet365 Malta credential = MFSA = Bitpanda's Malta entity = same regulator. They have a sophisticated compliance team that will read the audit doc seriously — meaning even a "no" gives you the most actionable feedback in your validation set.

**Buyer:** Head of Financial Crime / Group MLRO
**Channel preference:** Email — they will not respond to LinkedIn DMs

### Email (English)

> **Subject:** Citation-backed AML wallet screening — defensibility primer for MFSA inspections
>
> Hi [NAME],
>
> I'm Jorge Fernández — AML/CDD Team Leader at Bet365 Malta (ICA Advanced
> AML), so I run point on MFSA-equivalent regulator interactions in my day
> job. That experience drove me to build ChainSight: an open-source,
> deterministic, citation-backed AML wallet-screening engine.
>
> The thesis: black-box vendor scores fail under regulator scrutiny because
> they drift between runs and the methodology is opaque. ChainSight pins
> rule versions per scan, cites the source for every flag (FATF VA RFI,
> OFAC SDN, EU CFSP, UK OFSI), and is fully reviewable code — not a model
> card.
>
> I'm not pitching it as a Chainalysis replacement. I'm pitching it as a
> defensibility layer that sits *alongside* your existing stack and gives
> the MLRO team a tool they can hand to a regulator and say *"here's why."*
>
> Two artefacts before any call — both designed to save your time:
>
> 1. **Honest scope statement**: {{LIVE_URL}}/methodology/coverage
> 2. **Public audit of every gap**: https://github.com/AIRWAfinance/ChainSight/blob/main/beta/AUDIT_AML_5_SPECIALISTS.md (verify link is public — repo must be public)
>
> The audit lists 8 blockers I need to close before ChainSight is sellable
> as a regulated primary control. I'm in the validation phase, not the
> sales phase. The single question I'd ask in a 20-minute call:
>
> *"If we close those 8 blockers, would Bitpanda sponsor a 90-day paid pilot
> as a complementary control at €5–10k?"*
>
> Even a "no, because [X]" is the most useful answer your team could give
> me right now. Worth 20 minutes?
>
> Thanks,
> Jorge Fernández González
> https://www.linkedin.com/in/[your-handle]
> https://github.com/AIRWAfinance/ChainSight

---

## Pre-flight checks before sending (today, 30 min)

- [ ] **LinkedIn URL placeholder** — replace `[your-handle]` in all 3 emails with your actual LinkedIn URL
- [ ] **Bit2Me MLRO name** — search LinkedIn for "Bit2Me + AML" or "Bit2Me + Compliance," verify person + email format `firstname.lastname@bit2me.com`
- [ ] **Young Platform MLRO** — same drill, email format `firstname.lastname@youngplatform.com`
- [ ] **Bitpanda MLRO** — likely `firstname.lastname@bitpanda.com`. If you cannot confirm via LinkedIn, use Apollo.io / Hunter.io for a one-time lookup
- [ ] **Vercel deploy confirmed** — `{{LIVE_URL}}/methodology/coverage` returns 200 (not 404). If 404, the deploy hasn't finished — wait, then test before sending
- [ ] **GitHub link** — confirm `beta/AUDIT_AML_5_SPECIALISTS.md` is rendered on github.com (it's pushed in commit `ed91621`)

---

## Tracking sheet (paste into Notion or a Google Sheet)

| Prospect | Buyer name | Sent | Reply? | Booked call? | "Yes if blockers close"? | Notes |
|----------|------------|------|--------|---------------|---------------------------|-------|
| Bit2Me | | | | | | |
| Young Platform | | | | | | |
| Bitpanda | | | | | | |

After all 3 land, repeat for the next 3 from `VALIDATION_TARGETS.md` (Bitstamp EU, Bitvavo, 21Shares). Total target by end of week 2: 5 booked calls.

---

## If a prospect says "interested, send me more"

Don't send a deck. Send the live demo URL + offer a 15-minute screen-share. Decks die in inboxes; live demos book second meetings.

The walkthrough script (5 minutes):
1. Open `https://chainsight.airwa.finance/scan` — paste a known sanctioned wallet (e.g. one from OFAC SDN list — `0x098B716B8Aaf21512996dC57EB0615e2383E2f96` is Tornado Cash router)
2. Show the deterministic score + all citations
3. Open the PDF — point at the rule version and citation footer
4. Open `/methodology/coverage` — show the honest scope
5. Stop talking. Ask: *"What part of this would your team's audit checklist actually use?"*
