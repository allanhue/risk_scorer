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

For example, if the CSV is at `server\model\evaluation.csv`, run `python -m model.model model\evaluation.csv --output model\evaluation-report.json` from `server`. The command prints the report and optionally saves the same JSON to the output path. It needs no additional Python package beyond the project requirements.

Install into the server virtual environment. Python 3.11 is supported by the current PyTorch/Transformers stack. First install a PyTorch build that fits your machine. For CPU on Windows:

```powershell
cd C:\risk_scorer\server
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
python -m pip install -r model\requirements-ml.txt
```