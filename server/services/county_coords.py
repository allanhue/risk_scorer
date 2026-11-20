"""Approximate latitude/longitude for climate lookups.

Kenyan entries use county administrative centres as point proxies. Regional and
East African city entries are also point proxies, not area-wide climate averages.
Coordinates are (latitude, longitude).
"""

COUNTY_COORDS = {
    # Kenya: all 47 counties, represented by their administrative centre.
    "Mombasa": (-4.0435, 39.6682),
    "Kwale": (-4.1740, 39.4521),
    "Kilifi": (-3.6300, 39.8500),
    "Tana River": (-1.4900, 40.0300),  # Hola
    "Lamu": (-2.2717, 40.9020),
    "Taita-Taveta": (-3.3945, 38.3610),  # Mwatate
    "Garissa": (-0.4569, 39.6583),
    "Wajir": (1.7471, 40.0573),
    "Mandera": (3.9366, 41.8670),
    "Marsabit": (2.3284, 37.9899),
    "Isiolo": (0.3556, 37.5822),
    "Meru": (0.0467, 37.6559),
    "Tharaka-Nithi": (-0.3000, 37.6500),  # Kathwana
    "Embu": (-0.5389, 37.4596),
    "Kitui": (-1.3667, 38.0167),
    "Machakos": (-1.5177, 37.2634),
    "Makueni": (-1.8039, 37.6244),
    "Nyandarua": (-0.2700, 36.3800),  # Ol Kalou
    "Nyeri": (-0.4201, 36.9476),
    "Kirinyaga": (-0.4989, 37.2803),  # Kerugoya
    "Murang'a": (-0.7210, 37.1526),
    "Kiambu": (-1.1714, 36.8356),
    "Nairobi": (-1.2921, 36.8219),
    "Turkana": (3.1167, 35.6000),  # Lodwar
    "West Pokot": (1.2389, 35.1119),  # Kapenguria
    "Samburu": (1.0968, 36.6980),  # Maralal
    "Trans-Nzoia": (1.0191, 35.0023),  # Kitale
    "Uasin Gishu": (0.5143, 35.2698),  # Eldoret
    "Elgeyo-Marakwet": (0.6700, 35.5100),  # Iten
    "Nandi": (0.2039, 35.1050),  # Kapsabet
    "Baringo": (0.4667, 35.9833),
    "Laikipia": (0.2700, 36.5400),  # Rumuruti
    "Nakuru": (-0.3031, 36.0800),
    "Narok": (-1.0800, 35.8700),
    "Kajiado": (-1.8500, 36.7800),
    "Kericho": (-0.3670, 35.2830),
    "Bomet": (-0.7813, 35.3416),
    "Kakamega": (0.2827, 34.7519),
    "Vihiga": (0.0800, 34.7200),  # Mbale
    "Bungoma": (0.5635, 34.5606),
    "Busia": (0.4600, 34.1100),
    "Siaya": (-0.0600, 34.2900),
    "Kisumu": (-0.0917, 34.7680),
    "Homa Bay": (-0.5273, 34.4571),
    "Migori": (-1.0634, 34.4731),
    "Kisii": (-0.6817, 34.7667),
    "Nyamira": (-0.5633, 34.9358),

    # Broad Kenyan region proxies: use a specific county for a more local signal.
    "Central Kenya": (-0.5000, 37.0000),
    "Western Kenya": (0.2000, 34.7000),
    "Eastern Kenya": (-1.4000, 38.0000),

    # EAC partner-state cities; these are point locations, not national averages.
    "Kampala": (0.3476, 32.5825),
    "Gulu": (2.7746, 32.2990),
    "Mbarara": (-0.6072, 30.6545),
    "Dar es Salaam": (-6.7924, 39.2083),
    "Dodoma": (-6.1630, 35.7516),
    "Arusha": (-3.3869, 36.6830),
    "Mwanza": (-2.5164, 32.9175),
    "Kigali": (-1.9441, 30.0619),
    "Musanze": (-1.4998, 29.6340),
    "Bujumbura": (-3.3614, 29.3599),
    "Gitega": (-3.4271, 29.9246),
    "Juba": (4.8594, 31.5713),
    "Wau": (7.7011, 27.9897),
    "Kinshasa": (-4.4419, 15.2663),
    "Goma": (-1.6792, 29.2228),
    "Bukavu": (-2.5083, 28.8608),
    "Mogadishu": (2.0469, 45.3182),
    "Kismayo": (-0.3582, 42.5454),
}

LOCATION_ALIASES = {
    "muranga": "Murang'a",
    "muranga county": "Murang'a",
    "murang'a county": "Murang'a",
    "taita taveta": "Taita-Taveta",
    "taita taveta county": "Taita-Taveta",
    "elgeyo marakwet": "Elgeyo-Marakwet",
    "trans nzoia": "Trans-Nzoia",
    "central": "Central Kenya",
    "central part": "Central Kenya",
    "central region": "Central Kenya",
    "central kenya region": "Central Kenya",
    "western": "Western Kenya",
    "western part": "Western Kenya",
    "western region": "Western Kenya",
    "western kenya region": "Western Kenya",
    "eastern": "Eastern Kenya",
    "eastern part": "Eastern Kenya",
    "eastern region": "Eastern Kenya",
    "eastern kenya region": "Eastern Kenya",
    "kampala uganda": "Kampala",
    "dar es salaam tanzania": "Dar es Salaam",
    "kigali rwanda": "Kigali",
    "bujumbura burundi": "Bujumbura",
    "juba south sudan": "Juba",
    "kinshasa drc": "Kinshasa",
    "mogadishu somalia": "Mogadishu",
}


def _normalize_location(value: str) -> str:
    return " ".join(value.casefold().replace("'", "").replace("-", " ").split())


_NORMALIZED_COORDS = {_normalize_location(name): coords for name, coords in COUNTY_COORDS.items()}
_CANONICAL_NAMES = {_normalize_location(name): name for name in COUNTY_COORDS}
_NORMALIZED_ALIASES = {
    _normalize_location(alias): _normalize_location(canonical)
    for alias, canonical in LOCATION_ALIASES.items()
}


def canonical_location_name(location: str) -> str:
    """Return a canonical location label after applying spelling aliases."""
    key = _normalize_location(location)
    if key.endswith(" county"):
        key = key[:-7].strip()
    key = _NORMALIZED_ALIASES.get(key, key)
    return _CANONICAL_NAMES.get(key, location.strip())


def get_location_coordinates(location: str) -> tuple[float, float] | None:
    """Resolve a county, regional proxy, or supported EAC city case-insensitively."""
    canonical = canonical_location_name(location)
    return _NORMALIZED_COORDS.get(_normalize_location(canonical))
