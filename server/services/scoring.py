import yaml
from pathlib import Path
from services.climate import get_rainfall_risk
from services.county_coords import canonical_location_name

RULES_PATH = Path(__file__).parent / "kgft_rules.yaml"

with open(RULES_PATH) as f:
    RULES = yaml.safe_load(f)


def classify_green(sector: str, purpose: str, description: str = "") -> bool:
    sector_rules = RULES["green_sectors"].get(sector)
    if not sector_rules:
        return False
    if sector_rules["default_green"]:
        return True
    combined_text = f"{purpose} {description}".lower()
    return any(activity in combined_text for activity in sector_rules["eligible_activities"])


def get_static_county_risk(county: str) -> str:
    canonical_county = canonical_location_name(county)
    for level, counties in RULES["county_risk"].items():
        if canonical_county.casefold() in {name.casefold() for name in counties}:
            return level
    return "medium"


def has_static_county_risk(county: str) -> bool:
    canonical_county = canonical_location_name(county).casefold()
    return any(
        canonical_county == name.casefold()
        for counties in RULES["county_risk"].values()
        for name in counties
    )


def score_loan(
    loan_amount: float,
    purpose: str,
    county: str,
    sector: str,
    description: str = "",
    currency: str = "KES",
) -> dict:
    is_green = classify_green(sector, purpose, description)
    static_risk = get_static_county_risk(county)
    has_location_tier = has_static_county_risk(county)
    climate = get_rainfall_risk(county)

    effective_risk = static_risk
    if climate["status"] in ("drought_risk", "flood_risk") and effective_risk != "high":
        effective_risk = "high" if static_risk == "medium" else "medium"

    if is_green and effective_risk == "low":
        risk_level, confidence = "low", 0.85
    elif is_green and effective_risk == "medium":
        risk_level, confidence = "low", 0.72
    elif is_green and effective_risk == "high":
        risk_level, confidence = "medium", 0.65
    elif not is_green and effective_risk == "high":
        risk_level, confidence = "high", 0.80
    else:
        risk_level, confidence = "medium", 0.68

    climate_note = ""
    if climate["status"] == "drought_risk":
        climate_note = f" Recent rainfall is {climate['anomaly_pct']}% below normal — active drought signal."
    elif climate["status"] == "flood_risk":
        climate_note = f" Recent rainfall is {climate['anomaly_pct']}% above normal — active flood signal."
    elif climate["status"] == "unknown":
        climate_note = " Live climate data unavailable; used baseline county risk only."

    location_explanation = (
        f"{county} has {static_risk} baseline climate hazard exposure."
        if has_location_tier
        else f"No location-specific baseline tier is configured for {county}; used the medium default."
    )
    explanation = (
        f"{'Green-aligned' if is_green else 'Not green-aligned'} activity in {sector} sector. "
        f"{location_explanation}{climate_note}"
    )

    return {
        "riskLevel": risk_level,
        "isGreen": is_green,
        "confidence": confidence,
        "explanation": explanation,
        "climateSignal": climate,
    }
