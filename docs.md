# Green Taxonomy Risk Scorer — Product Documentation

The Green Taxonomy Risk Scorer helps lenders and financial institutions assess whether a loan aligns with Kenya’s Green Finance Taxonomy and how exposed it is to climate-related risk.

It is designed to reduce manual review time, improve explainability, and give teams a fast, consistent way to evaluate lending opportunities through a green lens.

**Current status (Aug 2026):** The product is live with rules-based scoring. Live climate data feeds, PDF export, public demo access, and a production ML model are not yet implemented.



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

The result is a structured assessment that offers a clear recommendation and an explanation of the decision.

**Important:** The current product uses a rules-based engine rather than a machine learning model. This keeps the output transparent and auditable while the product matures.

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
