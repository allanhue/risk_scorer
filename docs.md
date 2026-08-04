# Project Implementation Notes

## Purpose

This project is a loan risk scoring application built with Next.js on the frontend, Clerk for authentication, and a Python FastAPI backend for scoring and database persistence.

## Key implementation details

- `app/layout.tsx` wraps the app in `ClerkProvider` for authentication support.
- `app/components/Navbar.tsx` uses `useAuth()` and `UserButton` from `@clerk/nextjs` to show authentication state in the navbar.
- Login and registration are handled by Clerk UI components in:
  - `app/auth/login/[[...rest]]/page.tsx`
  - `app/auth/register/[[...rest]]/page.tsx`
- Auth-protected routes are managed using Clerk middleware in `app/middleware.ts`.
- The loan scoring form is implemented in `app/components/LoanForm.tsx` and sends POST requests to the backend API.

## Backend behavior

- Backend runs in `server/` using FastAPI and SQLAlchemy.
- `server/database.py` reads `DATABASE_URL` from `server/.env` and now fails fast if the value is missing.
- `server/main.py` exposes `/score` to compute and store loan scores.
- The backend persists `User`, `Loan`, and `Score` records in the configured database.

## Recent fixes

- Fixed malformed Clerk auth page contents in the catch-all auth route files.
- Corrected `Navbar.tsx` to use valid Clerk client exports and removed broken `SignedIn`/`SignedOut` imports.
- Added a clear backend startup validation for `DATABASE_URL`.
- Added `suppressHydrationWarning` to `app/layout.tsx` to avoid hydration mismatches from browser/extension-injected body attributes.
- Documented the setup and implementation details for future reference.
