# Green Taxonomy Risk Scorer — System Documentation

Developer reference for architecture, data flow, setup, and current state.

**Status (Aug 2026):** Rules-based scoring is live. Live climate data, PDF reports, public demo path, and ML model are not yet implemented. ML work is in progress but not developed.

---

## 1. Purpose

A risk scoring application that classifies loans by:

- **Green taxonomy alignment** — based on Kenya’s Green Finance Taxonomy (KGFT)
- **Climate risk exposure** — by county

Target users: banks, MFIs, and lenders who need a fast, explainable score instead of a fully manual compliance review.

The system produces:
- Risk level
- Green flag (aligned / not aligned / transitional)
- Confidence score
- Plain-language explanation

---

## 2. High-Level Architecture

```
┌─────────────────┐         HTTP          ┌─────────────────┐
│  Next.js (web)  │ ────────────────────► │  FastAPI (server)│
│  + Clerk auth   │   POST /score         │  + scoring.py    │
└─────────────────┘                       │  + SQLAlchemy    │
                                          └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │  Neon Postgres  │
                                          │  (users, loans, │
                                          │   scores)       │
                                          └─────────────────┘
```

Key rule: **The frontend never talks to the database.**  
It only calls the FastAPI `/score` endpoint. FastAPI owns all persistence.

---

## 3. Auth Model

- **Clerk** handles all sign-in / sign-up UI via catch-all routes (`[[...rest]]`).
- `middleware.ts` (project root) protects `/dashboard(.*)` using `clerkMiddleware` + `createRouteMatcher`.
- Navbar (`app/components/Navbar.tsx`) uses `SignedIn` / `SignedOut` / `UserButton` from `@clerk/nextjs` so auth state is reflected live.
- On each scoring request the frontend sends the Clerk user ID + email.
- FastAPI mirrors the Clerk user into its own `users` table on first sight (creates the row if missing).  
  This lets loans be linked to a submitter without the backend knowing anything about passwords or sessions.

---

## 4. Scoring Flow (Current)

1. User fills `LoanForm` (sector, county, amount, purpose, etc.).
2. Frontend calls `lib/api.ts` → `scoreLoan(...)`.
3. Request hits FastAPI `POST /score`.
4. `scoring.py` loads rules from `kgft_rules.yaml`.
5. Rules engine combines:
   - Sector / activity eligibility (KGFT)
   - Static county climate-risk tier (low / medium / high)
6. Result is persisted:
   - `Loan` row
   - `Score` row (linked to the mirrored `User`)
7. Response returns risk level, green flag, confidence, and explanation to the frontend.

**Important:** Scoring is still **rules-based**. There is no trained ML model in production yet.

---

## 5. Project Layout (Relevant Parts)

```
                    # DATABASE_URL only
```

---

## 6. Environment Variables

### Frontend — `web/.env.local`
```
NEXT_PUBLIC_SCORING_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
``````

Notes:
- Use the Neon **pooled** hostname (`-pooler`).
- Never expose `DATABASE_URL` to the frontend.
- Never commit real keys.

---

## 7. Database

- Provider: Neon (Postgres)
- Access: only from FastAPI via SQLAlchemy
- Connection resilience: `pool_pre_ping=True`, `pool_recycle=300`
- Main entities (conceptual):
  - `User` — mirrored from Clerk (id, email, …)
  - `Loan` — submitted loan details
  - `Score` — computed result linked to loan + user

Prisma was removed from the frontend; the backend is the single source of truth for the database.

---

## 8. Scoring Logic (Current Implementation)

Location: `server/scoring.py` + `server/kgft_rules.yaml`

- Rules-based (not ML).
- Inputs typically include sector/activity and county.
- Output:
  - Risk level
  - Green alignment flag
  - Confidence score
  - Human-readable explanation

County climate risk is still a **static table** inside the YAML.  
This is the next major improvement target (live CHIRPS + NDMA data).

---

## 9. Suggested Next Steps (Priority Order)

| Priority | Item | Status | Notes |
|----------|------|--------|-------|
| 1 | Live climate data | Not started | Replace static `county_risk` with CHIRPS rainfall + NDMA hazard pull |
| 2 | PDF report generation | Not started | FastAPI endpoint using weasyprint or reportlab for CBK-style compliance docs |
| 3 | UI polish | Not started | Spacing, typography, empty/loading states |
| 4 | Public demo path | Not decided | No-login version for distribution, separate from authenticated dashboard |
| 5 | ML model | **In progress / not yet developed** | Logistic regression or XGBoost + SHAP. Keep rules engine as fallback until model is validated |

Until the ML model is trained, tested, and shown to be at least as reliable as the rules, the rules engine remains the production scoring path.

---

## 10. Local Development

```bash
# Terminal 1 — Backend
cd server
# ensure .env has the pooled DATABASE_URL
venv\Scripts\Activate.ps1   
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd web
# ensure .env.local has Clerk keys + scoring service URL
npm run dev
```

Protect routes are handled by `middleware.ts`. Dashboard requires a signed-in Clerk user.

---

## 11. Design Decisions Worth Remembering

- Frontend is auth + UI only. All business logic and persistence live in FastAPI.
- Clerk user IDs are mirrored into Postgres so loans can be owned without the backend implementing its own auth.
- Rules engine is the current source of truth. ML is additive, not a replacement, until proven.
- Neon free tier requires pooled connection string + connection pool settings to avoid “server closed the connection” errors after idle periods.

---

## 12. Related Documents

- `ISSUES_AND_RESOLUTIONS.md` — problems already encountered and how they were fixed.

When the ML path, live climate data, or public demo is implemented, update this document so it stays the single source of truth for developers.


Goal,Authenticated (Clerk),Public (no login)
Avoid bias / gaming,"Strong. You can rate-limit, require identity, store history, detect repeated gaming of scores.",Weak. Anyone can spam different amounts/places to probe the rules.
Accountability & audit,Strong. Every score is tied to a user. Useful later for banks/MFIs.,None. Anonymous.
User history & saved reports,Natural. Dashboard of past scores + PDFs.,Harder (or need email capture / temporary tokens).
Distribution / first touch,Higher friction. Compliance people may bounce if they have to create an account just to try it.,"Low friction. Share a link in WhatsApp, LinkedIn, CBK/KBA circles."
Data for improving the model,Better. You get real usage patterns from identified users.,Noisier / more synthetic.
Compliance / enterprise sales,Required eventually. Banks will want SSO or controlled accounts.,Good only as a teaser.