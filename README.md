# Risk Scorer

A simple loan risk scoring app built with Next.js and Clerk for authentication.

## What it does

- Lets users sign in or register using Clerk
- Allows authenticated users to submit loan details
- Sends loan requests to a backend scoring service
- Stores loan records in a database via the backend

## Run locally

1. Start the backend server from `server/`:

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

2. Start the frontend from the repo root:

```bash
npm install
npm run dev
```

3. Open the app at `http://localhost:3000`

## Notes

- The backend expects `DATABASE_URL` in `server/.env`
- The frontend uses Clerk for auth and the scoring API at `http://localhost:8000`

## Implementation and challenge notes

- Auth is implemented with Clerk in the App Router. The Navbar uses `useAuth()` and `UserButton`, and auth pages render Clerk's `SignIn` and `SignUp` components.
- A malformed auth page file structure was fixed for the `app/auth/login/[[...rest]]/page.tsx` and `app/auth/register/[[...rest]]/page.tsx` routes.
- The backend database loader now validates `DATABASE_URL` on startup and fails fast with a clear error if the environment variable is missing.
- The app uses a dedicated backend scoring API at `localhost:8000` to keep scoring and loan history logic separate from the frontend.

