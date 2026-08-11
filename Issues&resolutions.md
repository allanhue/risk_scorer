# Green Taxonomy Risk Scorer — Issues & Resolutions

Developer troubleshooting log. Use this when the same problems reappear or when onboarding someone new.

---

## Auth & Frontend Routing

### `@/components/Navbar` not found
**Cause:** `tsconfig.json` path alias `@/*` pointed at the project root, but `components/` lives under `app/`.

**Fix:** Update `tsconfig.json`:
```json
"paths": {
  "@/*": ["./app/*"]
}
```
Restart the Next.js dev server after changing paths.

---

### `middleware.ts` failed to parse (“Expected a semicolon”)
**Cause:** Mismatched closing brackets. `clerkMiddleware(...)` and the `config` export were accidentally merged into one `});`.

**Fix:** Keep them as two separate, correctly closed statements. Use the current Clerk API:
```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

---

### `middleware.ts` not picked up by Next.js
**Cause:** File was placed inside `app/` instead of the project root.

**Fix:** Move it to the project root:
```
risk_scorer/
  middleware.ts          ← correct location
  app/
  ...
```

---

## Database / Backend

### `psycopg2.OperationalError: server closed the connection unexpectedly`
**Cause:** Neon free-tier compute suspends after inactivity. SQLAlchemy was holding dead connections and did not retry.

**Fix (two parts):**
1. Use the **pooled** connection string (hostname contains `-pooler`):
   ```
   DATABASE_URL=postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require
   ```
2. Configure the SQLAlchemy engine with pre-ping and recycle:
   ```python
   engine = create_engine(
       DATABASE_URL,
       pool_pre_ping=True,
       pool_recycle=300,
   )
   ```

---

### Stale Prisma files and Prisma-generated `.env` in `web/`
**Cause:** Earlier architecture planned database access from Next.js. Prisma leftovers remained after the decision to keep all DB access in the FastAPI service.

**Fix:** Remove Prisma completely from the frontend:
- Delete `web/prisma/` (or any Prisma schema)
- Remove any Prisma-related dependencies and generated client
- Ensure `DATABASE_URL` exists **only** in `server/.env`
- Frontend talks only to FastAPI via `NEXT_PUBLIC_SCORING_SERVICE_URL`

---

## Frontend / React

### Hydration mismatch warnings
**Cause:** Browser extensions injecting attributes into `<body>`.

**Fix:** In `app/layout.tsx`:
```tsx
<body suppressHydrationWarning>
  {children}
</body>
```

---

## Environment Variables Checklist

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

Never put `DATABASE_URL` in the frontend. Never commit real keys.

---

## Quick Diagnostic Commands

```bash
# Frontend
cd web && npm run dev

# Backend
cd server && uvicorn main:app --reload --port 8000

# Check Neon connection (from server/)
python -c "from sqlalchemy import create_engine, text; e=create_engine('YOUR_URL', pool_pre_ping=True); print(e.connect().execute(text('SELECT 1')).scalar())"
```

---

## Still Open / Next Known Risks

| Item | Status | Notes |
|------|--------|-------|
| Live climate data (CHIRPS + NDMA) | Not started | Static `county_risk` still used |
| PDF report generation | Not started | Planned via weasyprint/reportlab |
| Public no-login demo path | Not decided | Separate from authenticated dashboard |
| ML model (logistic / XGBoost + SHAP) | In progress / not yet developed | Rules engine remains the source of truth until model is ready and validated |

When you hit a new issue, add it here with Cause + Fix so the log stays useful.