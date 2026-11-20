# Risk Scorer (under development)


- Lets users sign in or register using Clerk

## Run locally

1. Start the backend server from `server/`:

```bash
cd server
pip install -r requirements.txt
.\venv\Scripts\Activate.ps1  
uvicorn main:app --reload --port 8000
```

2. Start the frontend from the repo root:

```bash
npm install
npm run dev
```

3. Open the app at `http://localhost:3000`

## Notes

From a PowerShell prompt:

```powershell
cd C:\risk_scorer\server
.\venv\Scripts\Activate.ps1
python -m model.model path\to\evaluation.csv --output path\to\evaluation-report.json
```
```
