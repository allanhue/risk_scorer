# Risk Scorer (under development)

Scoring app built with Next.js and Clerk for authentication.


- Lets users sign in or register using Clerk

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
- Email sending uses Brevo transactional email when these backend env vars are set:
  - `BREVO_API_KEY`
  - `MAIL_FROM`
  - `MAIL_FROM_NAME`


.\venv\Scripts\Activate.ps1  
uvicorn main:app --reload --port 8000   
