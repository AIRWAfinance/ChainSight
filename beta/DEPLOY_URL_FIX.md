# Deploy URL fix — 5 minutes

Outreach to EU CASPs is **gated** on a working public URL. Currently
`chainsight.airwa.finance` does not resolve. Two paths.

## Path A — fastest (5 minutes, use the Vercel-issued URL)

**No DNS changes needed.** Use whatever URL Vercel already gave you.

1. Open https://vercel.com/dashboard.
2. Find the **ChainSight** project.
3. The production URL is shown at the top of the project page (e.g.
   `chainsight-airwafinance.vercel.app` or similar).
4. Verify it returns 200 by visiting in incognito:
   - `https://<your-vercel-url>/`
   - `https://<your-vercel-url>/login`
   - `https://<your-vercel-url>/methodology/coverage`
   - `https://<your-vercel-url>/trust`
   - `https://<your-vercel-url>/pricing`
5. Open `beta/OUTREACH_PERSONALISED.md` and replace every
   `{{LIVE_URL}}` placeholder with that Vercel URL.
6. Open `beta/OUTREACH.md` line ~31 — replace
   `https://chainsight.airwa.finance/beta` with `<your-vercel-url>/beta`.

**Done. You can send outreach today.**

## Path B — proper (30–90 minutes, custom domain)

Use `chainsight.airwa.finance` properly. DNS propagation takes 5–60
minutes after the records are saved.

### B.1 — Vercel: add the domain to the project

1. Vercel dashboard → ChainSight project → Settings → Domains.
2. Add domain: `chainsight.airwa.finance`.
3. Vercel will show one of two records to add at your DNS host:
   - **`CNAME`** to `cname.vercel-dns.com` (most common), OR
   - **`A`** records to specific Vercel IPs (if your domain root is on a host that doesn't support CNAME at subdomain).

   Copy whatever Vercel shows you.

### B.2 — Registrar: add the DNS record

Where is `airwa.finance` registered? Typical registrars: Namecheap, GoDaddy,
Cloudflare, OVH.

1. Log in to the registrar that owns `airwa.finance`.
2. Find DNS / Zone editor / Records.
3. Add a record:
   - **Type:** `CNAME`
   - **Host / Name:** `chainsight`
   - **Value / Target:** `cname.vercel-dns.com`
   - **TTL:** 300 (5 minutes) for fast propagation
4. Save.

### B.3 — Wait for cert + verify

1. Wait 5–10 minutes for DNS propagation. Vercel will auto-issue a
   Let's Encrypt cert as soon as it sees the record.
2. Vercel domain page will turn the row green when it's healthy.
3. Test in incognito:
   - `https://chainsight.airwa.finance/`
   - `https://chainsight.airwa.finance/methodology/coverage`
4. Update outreach files (same as Path A step 5–6) but use the proper
   domain.

## Required env vars on Vercel

Before the first paying customer, set these in the project's Environment
Variables panel (Production scope):

| Variable | Value | Why |
|----------|-------|-----|
| `CHAINSIGHT_SESSION_SECRET` | random 64+ char string | Login JWT signing — without this, `/api/auth/login` 500s |
| `ETHERSCAN_API_KEY` | key from etherscan.io/myapikey | Required for scans |
| `CHAINSIGHT_DB_URL` | postgres://... | Production storage (use Neon, Supabase, or Vercel Postgres in EU region) |
| `CHAINSIGHT_ADMIN_EMAILS` | `cryptoworldinversiones@gmail.com` | Auto-promote your email to admin on first login |
| `CRON_SECRET` | random 32+ char string | Manual cron triggers (Vercel-Cron header works without it) |
| `CHAINSIGHT_ALERT_DELTA` | `5` | Watchlist email-alert threshold (default 5 score points) |

Optional / future:
- `CHAINSIGHT_MFA_ISSUER` — defaults to "ChainSight"
- SMTP credentials for `lib/notify/email.ts` (when you wire up alert email
  delivery)

## Smoke test after deploy

```
curl -sI https://<your-url>/ | head -5
curl -s   https://<your-url>/api/sanctions/freshness | head -c 200
curl -s   https://<your-url>/api/auth/me
```

Expected: 200 on all three. The freshness endpoint should show the lists
were synced by Vercel Cron at 02:00 UTC.

## After deploy, smoke-test outreach

1. Send Pick 1 (Bit2Me, Spanish) from `beta/OUTREACH_PERSONALISED.md`.
2. Wait 24h.
3. If Pick 1 reply pattern is good, send Picks 2 + 3 same week.
4. Day 14 decision gate: ≥2 "yes if blockers close" → tag v0.7.2 with
   live customer features. <2 → reposition.
