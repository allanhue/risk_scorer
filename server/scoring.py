import yaml
from pathlib import Path

RULES_PATH = Path(__file__).parent / "kgft_rules.yaml"

with open(RULES_PATH) as f:
    RULES = yaml.safe_load(f)


def classify_green(sector: str, purpose: str) -> bool:
    sector_rules = RULES["green_sectors"].get(sector)
    if not sector_rules:
        return False

    if sector_rules["default_green"]:
        return True

    purpose_lower = purpose.lower()
    return any(activity in purpose_lower for activity in sector_rules["eligible_activities"])


def get_county_risk(county: str) -> str:
    for level, counties in RULES["county_risk"].items():
        if county in counties:
            return level
    return "medium"  # unlisted counties default to medium


def score_loan(loan_amount: float, purpose: str, county: str, sector: str) -> dict:
    is_green = classify_green(sector, purpose)
    county_risk = get_county_risk(county)

    # Combine green status + county climate risk into overall risk level
    if is_green and county_risk == "low":
        risk_level = "low"
        confidence = 0.85
    elif is_green and county_risk == "medium":
        risk_level = "low"
        confidence = 0.72
    elif is_green and county_risk == "high":
        risk_level = "medium"
        confidence = 0.65
    elif not is_green and county_risk == "high":
        risk_level = "high"
        confidence = 0.80
    else:
        risk_level = "medium"
        confidence = 0.68

    explanation = (
        f"{'Green-aligned' if is_green else 'Not green-aligned'} activity in {sector} sector. "
        f"{county} has {county_risk} climate hazard exposure."
    )

    return {
        "riskLevel": risk_level,
        "isGreen": is_green,
        "confidence": confidence,
        "explanation": explanation,
    }