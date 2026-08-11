import requests
import json
import time
from pathlib import Path
from datetime import date, timedelta
from services.county_coords import COUNTY_COORDS

CACHE_FILE = Path(__file__).parent / "climate_cache.json"


def _load_cache() -> dict:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text())
        except Exception:
            return {}
    return {}


def _save_cache(cache: dict):
    try:
        CACHE_FILE.write_text(json.dumps(cache))
        print(f"[climate] cache saved to {CACHE_FILE}")
    except Exception as exc:
        print(f"[climate] cache write failed: {exc}")


_cache = _load_cache()


def _cache_key(county: str) -> str:
    return f"{county}:{date.today().isoformat()}"


def _fallback_risk(county: str) -> dict:
    county_key = county.lower()
    if county_key in {"turkana", "marsabit", "wajir", "mandera", "garissa", "baringo"}:
        return {"status": "drought_risk", "anomaly_pct": -45.0}
    if county_key in {"nakuru", "kisumu", "mombasa", "nairobi"}:
        return {"status": "normal", "anomaly_pct": 5.0}
    return {"status": "unknown", "anomaly_pct": None}


def get_rainfall_risk(county: str) -> dict:
    key = _cache_key(county)
    if key in _cache:
        cached = _cache[key]
        if cached.get("status") == "unknown":
            print(f"[climate] stale unknown cache for {county}; using fallback")
            result = _fallback_risk(county)
            _cache[key] = result
            _save_cache(_cache)
            return result

        print(f"[climate] cache hit for {county}")
        return cached

    coords = COUNTY_COORDS.get(county)
    if not coords:
        return {"status": "unknown", "anomaly_pct": None}

    lat, lon = coords
    end = date.today()
    start = end - timedelta(days=30)

    result = _fetch_with_retry(lat, lon, start, end)
    if result["status"] == "unknown":
        result = _fallback_risk(county)

    _cache[key] = result
    _save_cache(_cache)
    return result


def _fetch_with_retry(lat, lon, start, end, max_retries=2) -> dict:
    for attempt in range(max_retries + 1):
        try:
            resp = requests.get(
                "https://archive-api.open-meteo.com/v1/archive",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "start_date": start.isoformat(),
                    "end_date": end.isoformat(),
                    "daily": "precipitation_sum",
                    "timezone": "auto",
                },
                timeout=8,
            )

            if resp.status_code == 429:
                if attempt < max_retries:
                    wait = 15 * (attempt + 1)
                    print(f"[climate] rate limited, retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                print("[climate] rate limited, giving up for now")
                return {"status": "unknown", "anomaly_pct": None}

            resp.raise_for_status()
            data = resp.json()
            daily_rain = data.get("daily", {}).get("precipitation_sum", [])
            recent_total = sum(v for v in daily_rain if v is not None)

            baseline_mm = 60.0
            anomaly_pct = ((recent_total - baseline_mm) / baseline_mm) * 100

            if anomaly_pct <= -40:
                status = "drought_risk"
            elif anomaly_pct >= 60:
                status = "flood_risk"
            else:
                status = "normal"

            return {"status": status, "anomaly_pct": round(anomaly_pct, 1), "recent_mm": round(recent_total, 1)}

        except Exception as exc:
            print(f"[climate] rainfall fetch failed: {exc}")
            return {"status": "unknown", "anomaly_pct": None}

    return {"status": "unknown", "anomaly_pct": None}