
For example, if the CSV is at `server\model\evaluation.csv`, run `python -m model.model model\evaluation.csv --output model\evaluation-report.json` from `server`. The command prints the report and optionally saves the same JSON to the output path. It needs no additional Python package beyond the project requirements.

Install into the server virtual environment. Python 3.11 is supported by the current PyTorch/Transformers stack. First install a PyTorch build that fits your machine. For CPU on Windows:

```powershell
cd C:\risk_scorer\server
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
python -m pip install -r model\requirements-ml.txt
```
# Green Taxonomy Risk Scorer — Engineering and Test Guide

This document is for developers and technical reviewers. Product overview and roadmap are maintained in the repository-root [`docs.md`](../docs.md).

## 1. Runtime overview

- FastAPI backend: `server/main.py`
- Rules scoring and explanations: `server/services/scoring.py`
- County/location rainfall lookup: `server/services/climate.py` and `server/services/county_coords.py`
- Rules configuration: `server/services/kgft_rules.yaml`
- Offline risk and taxonomy evaluator: `server/model/model.py`
- Optional multi-label taxonomy training/inference: `server/model/transformer.py`
- Optional ML dependencies: `server/model/requirements-ml.txt`
- Next.js location choices: `app/lib/locations.ts`, consumed by the loan and demo forms

`POST /score` and `POST /score/public` continue to use the rules engine. `POST /model/taxonomy/predict` is an experimental taxonomy suggestion endpoint that loads a locally fine-tuned model when configured. It does not replace the rules score and its response requires human review.

## 2. Location and climate coverage

`services/county_coords.py` contains approximate coordinates for all 47 Kenyan county administrative centres, regional point proxies for Central, Western, and Eastern Kenya, and selected cities across all eight EAC Partner States. Regional and city coordinates represent individual points, not area-wide averages. Kenya's 47 county units are documented by the [State Department for Devolution](https://devolution.go.ke/county-information); the EAC country list is maintained on the [Partner States page](https://www.eac.int/eac-partner-states/).

Location resolution is case-insensitive and accepts aliases such as `Muranga`, `Taita Taveta`, `Trans Nzoia`, `Central region`, and `Eastern part`. `get_location_coordinates()` resolves names for rainfall lookups; `canonical_location_name()` is also used for cache keys and static-risk matching. The loan/demo forms use the canonical values from `app/lib/locations.ts`.

Static county-risk tiers remain the small set configured in `services/kgft_rules.yaml`. Locations without a configured tier use a `medium` scoring fallback, and the explanation now identifies that fallback explicitly. Do not interpret this default as an independently researched risk classification.

The live rainfall lookup calls Open-Meteo's archive endpoint for the previous 30 days. The current implementation compares the 30-day rainfall total to a fixed 60 mm reference and labels anomalies at `<= -40%` as drought and `>= 60%` as flood. This is a simple prototype signal, not a location-specific long-term climate normal or a complete flood/drought hazard model. If the request fails, the service uses a small hard-coded fallback set; otherwise it returns `unknown`. Review this method before using rainfall classifications for credit decisions.

## 3. Install the optional transformer packages

Use the backend virtual environment. Install PyTorch separately to select the correct CPU or GPU build. For CPU on Windows:

```powershell
cd C:\risk_scorer\server
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
python -m pip install -r model\requirements-ml.txt
```

For an NVIDIA GPU, choose Windows/Pip/the installed CUDA version on the [official PyTorch install page](https://pytorch.org/get-started/locally/), install its `torch` command, then install `model\requirements-ml.txt`. The optional requirements contain Transformers, Accelerate, SentencePiece, and NumPy. They are separate from `server/requirements.txt` so the production rules service does not need the ML stack.

The training default is `microsoft/deberta-v3-base`. For English/Swahili or other multilingual text, use `FacebookAI/xlm-roberta-base`. The base weights download the first time. Training resource needs depend on the data, sequence length, and hardware.

## 4. Prepare data and train

Have qualified reviewers define taxonomy labels and annotate representative examples. Do not treat rules-generated labels as ground truth. Split data by borrower/project or time so related records do not leak between training, validation, and holdout sets.

Training and validation CSVs require:

- `project_text`: activity/project description
- `taxonomy_labels`: semicolon-separated expert-reviewed labels, e.g. `solar_energy; energy_efficiency`

Optional columns are `purpose`, `description`, `sector`, `county`, `loan_amount`, `currency`, `technology`, and `evidence`. The training label vocabulary is used for validation; validation cannot introduce new labels. Keep a separate untouched holdout CSV for final evaluation.

From `server/`:

```powershell
python -m model.transformer train model-data\train.csv model-data\validation.csv --output-dir model-artifacts\taxonomy-encoder
```

For the multilingual encoder:

```powershell
python -m model.transformer train model-data\train.csv model-data\validation.csv --base-model FacebookAI/xlm-roberta-base --output-dir model-artifacts\taxonomy-encoder
```

Training writes model weights, tokenizer, and label configuration under `server/model-artifacts/`, which is ignored by Git.

## 5. Predict and evaluate offline

The holdout CSV needs `project_text` and the optional model input fields. Include `actual_taxonomy_labels` if the predictions will be evaluated. Generate model labels and run the evaluator:

```powershell
python -m model.transformer predict model-artifacts\taxonomy-encoder model-data\holdout.csv model-data\holdout-predictions.csv
python -m model.model model-data\holdout-predictions.csv --output model-data\holdout-report.json
```

The transformer adds `model_taxonomy_labels` using a default probability threshold of 0.5; `--threshold` can override it. Calibrate the threshold with validation data and freeze it before holdout evaluation. Taxonomy metrics include macro/micro F1, per-label precision/recall/F1, and subset accuracy. The rules scorer produces only a green/not-green flag, so it cannot serve as a taxonomy-category benchmark.

For risk-level evaluation, the CSV needs `loan_amount`, `purpose`, `county`, `sector`, and `model_risk_level`; optional columns include `description`, `currency`, and reviewed `actual_risk_level`. Labels must be `low`, `medium`, or `high`. The evaluator reports candidate-versus-rules agreement and, if reviewed actual outcomes are provided, candidate and rules metrics against outcomes. Agreement with rules is consistency only, not predictive accuracy.

## 6. Optional JSON inference endpoint

After training `server/model-artifacts/taxonomy-encoder`, start the API from `server/`:

```powershell
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

The route is `POST http://127.0.0.1:8000/model/taxonomy/predict`. It loads the default local model directory or `TAXONOMY_MODEL_PATH` if set. Example request:

```json
{
  "projectText": "Rooftop solar installation with battery storage for a small farm",
  "loanAmount": 500000,
  "currency": "KES",
  "purpose": "Install solar panels for farm operations",
  "description": "Replace diesel generator with solar PV and battery storage",
  "county": "Nakuru",
  "sector": "energy",
  "technology": "solar photovoltaic and battery storage",
  "evidence": "Supplier quotation provided; installation permit pending"
}
```

Example PowerShell request:

```powershell
$body = @{
  projectText = "Rooftop solar installation with battery storage for a small farm"
  loanAmount = 500000
  currency = "KES"
  purpose = "Install solar panels for farm operations"
  description = "Replace diesel generator with solar PV and battery storage"
  county = "Nakuru"
  sector = "energy"
  technology = "solar photovoltaic and battery storage"
  evidence = "Supplier quotation provided; installation permit pending"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/model/taxonomy/predict" `
  -Method Post -ContentType "application/json" -Body $body
```

The response includes predicted labels, per-label scores, the threshold, and `requiresHumanReview: true`. If packages or a trained artifact are missing, the endpoint returns HTTP 503. `/score` remains the rules-based loan scoring endpoint.

## 7. Manual smoke checks

Run from `server/` after activating the backend virtual environment.

### Location aliases and coordinate coverage

```powershell
@'
from services.county_coords import get_location_coordinates

assert get_location_coordinates("muranga") == get_location_coordinates("Muranga County")
assert get_location_coordinates("Eastern part") is not None
assert get_location_coordinates("Kampala Uganda") == get_location_coordinates("Kampala")
print("location checks passed")
'@ | python
```

For a direct rainfall smoke check, call `get_rainfall_risk("Nakuru")`; it may make an external Open-Meteo request when there is no cache entry.

### Rules score API

Start the API and POST this body to `http://127.0.0.1:8000/score` from Postman or PowerShell:

```json
{
  "loanAmount": 500000,
  "currency": "KES",
  "purpose": "Solar mini-grid installation",
  "description": "Solar PV and battery storage for a farm",
  "county": "Muranga",
  "sector": "energy"
}
```

Confirm a JSON response includes `riskLevel`, `isGreen`, `confidence`, `explanation`, and `climateSignal`. Use an uncached location to exercise live climate lookup; if the service is unavailable, confirm the response reports an unknown signal or configured fallback rather than crashing.

### Transformer endpoint

After training and installing the optional packages, send the JSON example in Section 6 through Postman. Confirm the response includes `predictions`, `labelScores`, `threshold`, `requiresHumanReview`, and `productionScoringUsed: false`. Before training, HTTP 503 is expected. Verify `/score` still responds through the rules engine independently.

Automated Python tests are not currently included in this work; these are manual smoke checks. Do not describe model quality based on smoke checks—use the held-out labeled evaluation described above.
