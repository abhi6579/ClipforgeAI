# ClipForge AI — Launch Runbook

Everything below is ordered. Do them top to bottom.

---

## ✅ Already done (in code, tested)

- Auth: scrypt hashing, DB sessions, httpOnly cookies
- **Rate limiting** on login (8/10min per account, 20/10min per IP), register (5/hr per IP), AI routes (20/min)
- **Atomic credit spend** — verified safe against parallel double-spend
- Ownership checks on every read/write (verified: cross-user returns 404)
- Free-plan cap (6 videos) + game credit cap (120/day), both server-enforced
- Daily task reset + streak tracking, idempotent under concurrency
- `error.tsx`, `global-error.tsx`, `not-found.tsx`
- `robots.ts`, `sitemap.ts`, favicon, OG share image, full metadata
- Terms + Privacy pages
- Health endpoint at `/api/health` with DB latency

---

## 🚀 Launch steps

### 1 · Domain + hosting (30 min)
1. Buy the domain. Confirm the handle is free on X/TikTok/IG before you commit.
2. Deploy to Vercel: import the repo, framework auto-detects Next.js.
3. Point DNS at Vercel, wait for the SSL cert.

### 2 · Production database (20 min)
Do **not** ship with the sandbox Postgres.
1. Create a free Neon or Supabase project.
2. Copy the pooled connection string, add `?sslmode=require`.
3. Set `DATABASE_URL` in Vercel env vars.
4. Run `npx drizzle-kit push` against it once.
5. Take a snapshot / enable daily backups.

### 3 · Environment variables (5 min)
In Vercel → Settings → Environment Variables:

| Key | Value | Required |
|---|---|---|
| `DATABASE_URL` | production Postgres URL | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` | ✅ |
| `OPENAI_API_KEY` | your key | optional |
| `SUPPORT_EMAIL` | real inbox you monitor | recommended |

> `NEXT_PUBLIC_SITE_URL` must be set or your sitemap, canonicals and social
> previews will all point at `localhost`.

### 4 · Payments — Stripe (2–3 hrs)
The plan-switch logic already exists in `/api/billing`. You are only adding the money.
1. Create Stripe account, complete business verification.
2. Create two recurring prices: Creator $19/mo, Studio $59/mo.
3. `npm i stripe`.
4. Replace the body of `POST /api/billing` with a Checkout Session redirect.
5. Add `POST /api/webhooks/stripe` to handle `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted` — that
   handler is the **only** place allowed to change `users.plan`.
6. Add a `stripeCustomerId` column to `users`.
7. Test with card `4242 4242 4242 4242`, then switch to live keys.

Stripe will ask for your Terms and Privacy URLs — they already exist at
`/terms` and `/privacy`.

### 5 · Sponsor revenue (1–2 hrs)
The `offers` table is your ad inventory; it's currently seeded with demo rows.
1. Apply to an offerwall (AdGem, Fyber, OfferToro) **or** sign 2–3 direct
   affiliate deals with creator tools — direct pays far better.
2. Replace the seeded rows with real offers + tracking links.
3. Add a `POST /api/offers/postback` endpoint that the network calls to confirm
   a conversion, and only credit the user from there. Never credit on click.

### 6 · Email (1 hr)
Not built yet, and you will need it.
1. `npm i resend`, verify your sending domain.
2. Wire: welcome email, password reset, payment receipt.
3. **Password reset is the gap that will generate the most support tickets** —
   ship it in week one.

### 7 · Monitoring (30 min)
1. Sentry: `npx @sentry/wizard@latest -i nextjs`. Hooks straight into the
   `console.error` calls already in `error.tsx` and `guard()`.
2. Uptime monitor pointed at `/api/health`, alert on non-200.
3. Vercel Analytics or Plausible for traffic.

### 8 · Pre-launch smoke test (30 min)
On the **production** URL, in an incognito window:
- [ ] Register a brand-new account → lands on dashboard with 60 credits
- [ ] Empty states show on all 5 tabs
- [ ] Add video → run AI overview → credits drop 60 → 55
- [ ] Approve + export a clip
- [ ] Complete a task → credits rise
- [ ] Play Hook Rush → credits rise
- [ ] Claim a sponsor offer → cannot claim twice
- [ ] Switch to Creator plan → AI becomes free
- [ ] Log out, log back in → data persists
- [ ] Open on a real phone
- [ ] Paste the URL into X/Slack → OG image renders
- [ ] Check `/robots.txt` and `/sitemap.xml`

### 9 · Launch day
1. **Reddit** — r/NewTubers, r/youtubers, r/ContentCreators. Lead with the
   problem, not the product. No link in the title.
2. **X/TikTok** — screen-record the 40-min podcast → 5 clips flow. That demo
   *is* the marketing.
3. **Product Hunt** — Tuesday–Thursday, 12:01am PT.
4. **Indie Hackers / Hacker News Show HN**.
5. Have the demo account live so nobody has to sign up to see value.

---

## ⚠️ Known gaps — ship anyway, fix in week 1

| Gap | Impact | Priority |
|---|---|---|
| No password reset | Support tickets | **P0 — week 1** |
| No real video transcoding (cut plan + ffmpeg only) | Limits price to $19 | P1 |
| Rate limiter is in-memory | Resets on deploy; breaks on multi-instance → move to Upstash Redis | P1 |
| No email at all | No onboarding/receipts | P1 |
| No account deletion UI | GDPR request handled manually | P2 |
| Plan changes not idempotent vs Stripe webhook retries | Double credits | P1 when Stripe lands |

---

## Cost at launch

| Item | Monthly |
|---|---|
| Vercel Hobby/Pro | $0–20 |
| Neon/Supabase free tier | $0 |
| Domain | ~$1 |
| OpenAI (1,000 runs) | ~$1.50 |
| **Total** | **under $25** |

Break-even is **two Creator subscriptions**.
