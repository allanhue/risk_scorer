# Green Taxonomy Risk Scorer — Implementation Notes

## Purpose

A  risk scoring application that classifies loans by **green taxonomy alignment** (based on Kenya's Green Finance Taxonomy, KGFT) and **climate risk exposure** (by county). Built to give banks and lenders a fast, explainable score instead of a manual compliance review.



The frontend never talks to the database directly — it only calls the FastAPI `/score` endpoint. FastAPI mirrors the Clerk user ID into its own `users` table so loans can be linked to a submitter without the backend knowing anything about passwords or sessions.


## Key implementation details

- **Auth**: Clerk handles all sign-in/sign-up UI via catch-all routes (`[[...rest]]`). `middleware.ts` protects `/dashboard(.*)` using `clerkMiddleware` + `createRouteMatcher`.
- **Navbar** (`app/components/Navbar.tsx`): uses `SignedIn` / `SignedOut` / `UserButton` from `@clerk/nextjs` to reflect auth state live.
- **Scoring flow**: `LoanForm` → `lib/api.ts` (`scoreLoan`) → FastAPI `/score` → `scoring.py` applies KGFT rules → result saved to Postgres (`Loan` + `Score` rows) → response returned to frontend.
- **User linking**: Clerk user ID + email are passed with each scoring request; FastAPI creates a mirrored `User` row on first sight if one doesn't exist yet.
- **Scoring logic** (`server/scoring.py`): rules-based (not ML yet) — combines sector eligibility (from `kgft_rules.yaml`) with a static county climate-risk tier (low/medium/high) to produce a risk level, green flag, confidence score, and plain-language explanation.

## Environment variables

**`web/.env.local`**
```
NEXT_PUBLIC_SCORING_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

**`server/.env`**
```
DATABASE_URL=postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require
```

Note the `-pooler` in the Neon hostname — required, see "Fixes" below.

## Fixes and implemetations 

| Issue | Cause | Fix |
|---|---|---|
| `@/components/Navbar` not found | `tsconfig.json` aliased `@/*` to project root, but `components/` lives inside `app/` | Changed `paths` to `"@/*": ["./app/*"]` |
| `middleware.ts` failed to parse ("Expected a semicolon") | Mismatched closing brackets — `clerkMiddleware(...)` and `config = {...}` got merged into one closing `});` | Rewrote with two separate, correctly closed statements; updated to current Clerk API (`await auth.protect()`) |
| `middleware.ts` not picked up | File was inside `app/` instead of the project root | Moved to `risk_scorer/middleware.ts` |
| `psycopg2.OperationalError: server closed the connection unexpectedly` | Neon free-tier compute suspends after inactivity; SQLAlchemy doesn't auto-retry dead connections | Added `pool_pre_ping=True` and `pool_recycle=300` to the SQLAlchemy engine; switched to Neon's **pooled** connection string (`-pooler` hostname) |
| Hydration mismatch warnings | Browser extensions injecting attributes into `<body>` | Added `suppressHydrationWarning` to `app/layout.tsx` |
| Stale `prisma/` and Prisma-generated `.env` in `web/` | Leftover from an earlier architecture decision (DB access originally planned in Next.js) | Removed Prisma entirely from frontend — `server/` is now the sole owner of `DATABASE_URL` and all DB access |



## Suggested next steps, in priority order

1. **Live climate data** — replace the static `county_risk` list in `kgft_rules.yaml` with a real CHIRPS rainfall + NDMA hazard data pull, so scores reflect current conditions rather than a fixed table.
2. **PDF report generation** — add a report endpoint (e.g. via `weasyprint` or `reportlab` in the FastAPI service) so a scored loan can be exported as a CBK-facing compliance document.
3. **UI polish** — visual pass on spacing, typography, and empty/loading states now that the functional flow is stable.
4. **Public demo path** — decide whether to expose a no-login version of the scorer for distribution (e.g. shareable link for compliance communities), separate from the authenticated dashboard.
5. **ML model** — once enough real/labeled loan data exists, consider swapping the rules engine for a trained model (logistic regression or XGBoost) with SHAP explainability, keeping the current rules engine as a fallback/baseline.