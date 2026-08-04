# Risk Scorer

Loan  scoring app built with Next.js and Clerk for authentication.

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


.\venv\Scripts\Activate.ps1  
(venv) PS C:\risk_scorer\server>  uvicorn main:app --reload --port 8000   

