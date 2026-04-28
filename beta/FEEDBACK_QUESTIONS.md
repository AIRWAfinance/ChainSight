# ChainSight beta — feedback questions

Don't ship beta features and wait. Schedule a 30-minute interview at week-2
with each beta user. Walk them through the same wallet, then ask:

## On the report

1. Does the **risk score** match what your manual review would conclude?
   (Show 3 wallets — known low, known medium, known critical.)
2. Is the **threshold ladder** (Low / Standard DD / Enhanced DD / Block-SAR)
   how *your* team labels things, or do you use different terms?
3. Are the **citations per finding** specific enough that an auditor would
   accept them? What's missing?
4. Where in the **counterparty graph** is your eye drawn first? Is the
   information you need actually there?

## On the workflow

5. Walk me through the **happy path** of a wallet review at your company.
   Where does ChainSight fit?
6. What blocks ChainSight from replacing whatever tool you're using today?
7. Who else on your team needs to see ChainSight before you'd commit?
8. What's your **buying authority** — could you authorise a $99/mo or
   $999/mo subscription, or does it require legal/procurement?

## On gaps

9. Which **chain** are you most often asked about that we don't support yet?
10. What **additional sanctions list** would make you trust the screening
    more? (UN? OFSI? Regional ones?)
11. What **data field** do you copy-paste between systems most often that
    the report doesn't surface?
12. Is the **PDF format** acceptable for a SAR submission, or do you need
    a specific template (FinCEN, EU MLRO)?

## On pricing willingness

13. If we charged $X/month, what features would have to be in the box?
    (Probe at $49, $199, $999.)
14. How many wallets/month do you currently screen? How is that growing?
15. What's the worst that could happen with a *cheap* AML tool — and how
    much would your team pay to never have that happen?

## On the engineering

16. Would self-hosting be a feature for you, or a hassle?
17. Does the **MIT-licensed engine** matter to your auditors, or is it just
    a tech-team curiosity?
18. Do you need a **public API** or is the web app enough?
19. Would **webhooks** (push score changes to your backend) close a real
    workflow gap, or are emails fine?

---

## Recording these answers

Spreadsheet template (track per beta user):

| Date | User | Company | Score-match? | Workflow-fit (1-5) | Buying authority | Top blocker | Top wishlist | Next step | Status |
|------|------|---------|--------------|---------------------|------------------|-------------|--------------|-----------|--------|
|      |      |         |              |                     |                  |             |              |           |        |

The `Top blocker` column is the most important one in the table. Look for
patterns across 3+ users — that's your next sprint.
