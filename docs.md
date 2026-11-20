# Green Taxonomy Risk Scorer — Product Documentation

The Green Taxonomy Risk Scorer helps lenders and financial institutions assess whether a loan aligns with Kenya’s Green Finance Taxonomy and how exposed it is to climate-related risk.

It is designed to reduce manual review time, improve explainability, and give teams a fast, consistent way to evaluate lending opportunities through a green lens.

**Current status (Nov 2026):** Loan scoring uses the rules engine. An offline evaluator is available for comparing candidate model predictions with the rules baseline and, where labeled outcomes exist, with those outcomes. No ML model is trained or used in the live scoring path.



## 1. Product overview

The product evaluates loan applications across two core dimensions:

- **Green taxonomy alignment** — whether the activity or sector aligns with Kenya’s Green Finance Taxonomy (KGFT)
- **Climate risk exposure** — how vulnerable the proposed activity or location may be to climate-related stress

This helps lenders answer practical questions such as:

- Is this loan aligned with green finance standards?
- Does the activity fit a green, transitional, or non-aligned category?
- How risky is the exposure from a climate or sustainability perspective?
- Why was this score generated in plain, understandable language?

---

## 2. Who it is for

The product is built for:

- Banks and lenders evaluating credit exposure
- Microfinance institutions (MFIs) screening applications
- Sustainability and risk teams reviewing green taxonomy alignment
- Compliance teams that need a transparent, explainable decision aid

It is especially useful where teams need a fast first-pass screening tool without relying entirely on a fully manual review process.

---

## 3. What the product does

The scorer helps users assess a submitted loan and returns:

- A risk level
- A green flag: aligned, transitional, or not aligned
- A confidence score
- An explanatory summary in plain language

The output is designed to be easy to understand by both credit teams and sustainability stakeholders, not just technical analysts.

---

## 4. How the scoring works

Users submit loan information such as:

- Sector or activity type
- County or location
- Loan purpose
- Amount and other structured details

The application evaluates the request against the configured rules and combines:

- Green taxonomy criteria for the sector or activity
- A climate-risk indication based on location

Climate coordinates now include all 47 Kenyan county administrative centres, plus approximate point proxies for Central, Western, and Eastern Kenya and selected cities in all eight East African Community partner states. The loan and demo forms offer these locations. County names are resolved without case sensitivity and common spelling variants such as `Muranga`, `Taita Taveta`, and `Trans Nzoia` are accepted. Kenya's counties are the administrative units recognized by the national constitution ([State Department for Devolution](https://devolution.go.ke/county-information)); EAC membership is drawn from the [EAC Partner States](https://www.eac.int/eac-partner-states/) list. Regional names and East African cities are point proxies; use a specific county/city for a more local climate lookup. These coordinates enable a rainfall-data lookup and do not imply that the location's static climate-risk tier has been independently assessed. Counties or locations without a configured static tier still default to `medium`.

The result is a structured assessment that offers a clear recommendation and an explanation of the decision.

**Important:** The current product uses a rules-based engine rather than a machine learning model. This keeps the output transparent and auditable while the product matures.

### Offline model evaluation

The evaluator in `server/model/model.py` is a research utility. It takes candidate risk predictions in a CSV, recomputes the current rules score for each loan, and reports candidate-versus-rules agreement. If the CSV also contains reviewed `actual_risk_level` labels, it reports candidate and rules metrics against those outcomes. This gives a baseline comparison without changing the API or production scoring behavior.

Required CSV columns are `loan_amount`, `purpose`, `county`, and `sector`. Optional columns are `description`, `currency`, `model_risk_level`, and `actual_risk_level`. Risk labels must be `low`, `medium`, or `high`; the risk prediction and actual label columns must be filled for every row or neither used. Each row represents one loan and its candidate prediction.

For multi-label taxonomy classification, add both `model_taxonomy_labels` and `actual_taxonomy_labels`. Put one or more semicolon-separated labels in each cell, for example `solar_energy; energy_efficiency`. Both columns must be present for every row when this evaluation is used. Suggested initial labels include `eligible_green_activity`, `not_eligible`, `needs_more_evidence`, `solar_energy`, `energy_efficiency`, `sustainable_agriculture`, `clean_transport`, `water_management`, `waste_circular_economy`, and `green_building`. Have taxonomy reviewers define the label guide, including whether broad eligibility labels can co-exist with activity labels, before labeling data. The evaluator reports macro/micro F1, per-label precision and recall, and exact-set (subset) accuracy against those reviewed labels. The current rules engine only returns a green/not-green decision, so taxonomy-category predictions cannot be compared directly with a rules-produced category.


The risk report includes accuracy, macro F1, per-class precision/recall/F1, and a confusion matrix. `candidate_vs_rules` measures agreement with the existing decision aid. Outcome comparisons are emitted only when reviewed outcomes are supplied. Agreement with rules is not real-world accuracy: rules-generated labels are not independent ground truth. Use a representative, permissioned dataset with outcomes reviewed by qualified risk staff before making claims about predictive performance. Keep train and evaluation periods or records separate to avoid data leakage, inspect metrics by relevant groups, and document the dataset, label definition, date range, and model version.

### Optional transformer experiment

An optional training and inference script now lives at `server/model/transformer.py`. It fine-tunes a [Hugging Face Transformers](https://huggingface.co/docs/transformers/installation) sequence classifier for **multi-label taxonomy categories**. English defaults to [`microsoft/deberta-v3-base`](https://huggingface.co/microsoft/deberta-v3-base); select `FacebookAI/xlm-roberta-base` for multilingual/Swahili text. It serializes project text alongside purpose, description, sector, county, amount, technology, and evidence fields. The script is for offline experiments and does not connect to the API or change production scoring.



For an NVIDIA GPU, use the OS/Pip/CUDA selector on the [official PyTorch install page](https://pytorch.org/get-started/locally/) to get the matching `torch` command, then install `model\requirements-ml.txt` as above. PyTorch's CUDA wheel and installed NVIDIA driver must be compatible. The optional ML packages are kept separate from `server/requirements.txt`, so the live app does not need the large training stack. The ML requirements install Transformers, Accelerate (used by the training runner), SentencePiece (needed by the DeBERTa tokenizer), and NumPy. PyTorch is installed separately so you can choose CPU or the appropriate GPU build.

Prepare two CSV files, with records separated by borrower/project and time where possible:

- Training CSV required columns: `project_text`, `taxonomy_labels`. Optional text/structured columns: `purpose`, `description`, `sector`, `county`, `loan_amount`, `currency`, `technology`, and `evidence`.
- Validation CSV has the same columns and label vocabulary. Keep a separate untouched holdout CSV for the final evaluation.
- `taxonomy_labels` is a semicolon-separated set of expert-reviewed labels, such as `solar_energy; energy_efficiency`. The label vocabulary is read from the training file; validation labels must use that same vocabulary.

Train from `server`:

```powershell
python -m model.transformer train model-data\train.csv model-data\validation.csv --output-dir model-artifacts\taxonomy-encoder
```

For multilingual training, add `--base-model FacebookAI/xlm-roberta-base`. The first run downloads the base model; training time and memory depend on model size, data, and hardware. The script saves the fine-tuned weights, tokenizer, and label mapping under `server/model-artifacts/` (ignored by Git).

Generate predictions on the untouched holdout file, which should include the input columns and `actual_taxonomy_labels` for evaluation:

```powershell
python -m model.transformer predict model-artifacts\taxonomy-encoder model-data\holdout.csv model-data\holdout-predictions.csv
python -m model.model model-data\holdout-predictions.csv --output model-data\holdout-report.json
```

The predictor adds `model_taxonomy_labels`; the evaluator compares them with `actual_taxonomy_labels`. It also compares risk labels with the rules engine only when `model_risk_level` is supplied. The model emits labels whose score meets a default 0.5 threshold (`--threshold` can override it); calibrate thresholds using validation data and freeze them before holdout evaluation. This starter concatenates readable structured fields into the encoder input text; it does not yet implement a separate numeric-feature neural head, document PDF extraction, or confidence-based abstention.

After training the artifact at `server/model-artifacts/taxonomy-encoder`, start the FastAPI server from `server` with `uvicorn main:app --reload`. The optional JSON inference route is `POST http://127.0.0.1:8000/model/taxonomy/predict`. It uses the local model artifact (or `TAXONOMY_MODEL_PATH` if configured) and is separate from `POST /score`:

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

Postman: POST the URL above, set `Content-Type: application/json`, and send the JSON as a raw body. PowerShell:

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

The response returns candidate taxonomy labels and per-label scores and always marks the result for human review. If the ML packages or trained model artifact are unavailable, the endpoint returns HTTP 503; `/score` continues to use the rules engine.

The transformer produces taxonomy suggestions, not a regulatory eligibility decision. Its quality depends on sufficiently large, representative, independently labeled data. Do not treat rules-generated labels as outcomes or use predictions to approve lending automatically. Have sustainability/credit reviewers adjudicate labels and examine errors, including across counties, sectors, and borrower groups, before considering any deployment. The rules engine stays the trusted production baseline.

### Guided evaluation process

1. Assemble historical applications with consistent input fields and independently reviewed outcomes. Do not use the rules score as the `actual_risk_level` label.
2. Train and validate a candidate model outside the live scoring service. Generate one `model_risk_level` prediction per held-out CSV row, preserving the row’s original loan fields.
3. Run the evaluator command above. Start with candidate-versus-rules agreement to understand where the candidate differs, then use outcome metrics to assess predictive value when trustworthy labels are available.
4. Review the confusion matrix and class-level metrics with credit and sustainability reviewers. Investigate errors and differences across sectors, counties, and relevant borrower groups; do not rely on accuracy alone.
5. Record data and model limitations, and repeat evaluation on later or otherwise untouched records. Only consider deployment after governance review, explainability checks, monitoring plans, and a controlled rollout. The rules engine remains the trusted production baseline until that review is complete.

---

## 5. Core user experience

### Primary flow

1. A user completes the loan assessment form.
2. The application evaluates the proposal against green taxonomy and climate-risk criteria.
3. The scoring engine returns a result with a clear risk signal and explanation.
4. The user can review the outcome and decide next steps.

### Product value

- Faster initial screening for green lending decisions
- More consistent outcomes across similar applications
- Explainability that supports review and governance
- A practical bridge between sustainability criteria and credit operations

---

## 6. Product principles

We are building the product around a few clear principles:

- **Explainability over black-box decisions** — users should understand why a score was produced.
- **Practical lending support** — the product is a decision aid, not a replacement for due diligence.
- **Transparency** — green and climate classifications should be understandable to non-technical teams.
- **Responsible risk assessment** — the product should support fair, consistent, and auditable review.

---

## 7. Current capabilities

The live product currently includes:

- Loan-level assessment input
- Rules-based green taxonomy scoring
- Climate-risk flagging based on county-level rules
- Score output with risk level and explanatory text
- User account access for authenticated workflows

The product is intentionally focused on the core decision-support experience before broader enhancements are added.

---

## 8. Planned roadmap

### Near-term priorities

1. Live climate data integration
   - Replace static climate-risk assumptions with more current environmental signals.

2. PDF report generation
   - Create exportable lender-facing reports for review and documentation.

3. Product polish and usability improvements
   - Improve layout, clarity, and onboarding experience.

4. Public demo path
   - Support a non-login experience for broader product exploration and outreach.

5. ML model exploration
   - Evaluate machine learning as a future enhancement while keeping the rules engine as a trusted baseline.

The rules engine remains the production scoring path until a new model is proven to be at least as reliable and explainable.

---

## 9. Product positioning

Green Taxonomy Risk Scorer sits between manual due diligence and a fully automated credit decision engine.

It gives lenders a fast, transparent, and operationally useful way to assess whether a loan aligns with green finance goals and how exposed it may be to climate-related risk.

This makes the product especially relevant in sectors where sustainability, climate disclosure, and credit risk are increasingly connected.

---

## 10. Success measures

The product should help teams improve:

- Time-to-assessment for loan review
- Consistency of taxonomy-based screening
- Clarity and traceability of risk explanations
- Confidence in evaluating green and climate-related credit decisions

---

## 11. Product decisions and trade-offs

### Authenticated experience

- Strong for accountability and auditability
- Better for lenders who need clear ownership and stored history
- Higher friction for first-time or casual users

### Public / no-login experience

- Better for demos and quick validation
- Lower friction for distribution
- Less useful for storing account-level history and formal governance

The product can support both models over time, but the core offering is strongest when it balances accessibility with formal lender workflows.

---

## 12. Current product narrative

The Green Taxonomy Risk Scorer is a practical decision-support tool for lenders who need to assess sustainability alignment and climate exposure quickly and consistently.

It is designed to make green finance screening more transparent, more efficient, and easier to understand for teams working across credit, risk, and sustainability functions.

As the product evolves, the roadmap will add stronger climate data, richer reporting, and eventually more advanced model-based capabilities while preserving transparent, explainable decision-making.
