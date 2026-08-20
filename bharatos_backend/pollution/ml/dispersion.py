import numpy as np

def gaussian_plume_concentration(emission_rate_g_s, wind_speed_m_s, stack_height_m, x, y):
    if x <= 0:
        return 0.0
    sigma_y = 0.08 * x / np.sqrt(1 + 0.0001 * x)
    sigma_z = 0.06 * x / np.sqrt(1 + 0.0015 * x)
    term1 = emission_rate_g_s / (2 * np.pi * wind_speed_m_s * sigma_y * sigma_z)
    term2 = np.exp(-(y ** 2) / (2 * sigma_y ** 2))
    term3 = np.exp(-(stack_height_m ** 2) / (2 * sigma_z ** 2))
    return term1 * term2 * term3 * 1_000_000  # µg/m³


def compute_plume_over_grid(emission_rate_g_s, factory_lat, factory_lng, stack_height_m,
                              wind_speed_m_s, wind_direction_deg, grid_points):
    wind_rad = np.radians(wind_direction_deg)
    results = []
    for point in grid_points:
        dx_m = (point["lng"] - factory_lng) * 111_320 * np.cos(np.radians(factory_lat))
        dy_m = (point["lat"] - factory_lat) * 110_540
        x = dx_m * np.cos(wind_rad) + dy_m * np.sin(wind_rad)
        y = -dx_m * np.sin(wind_rad) + dy_m * np.cos(wind_rad)
        concentration = gaussian_plume_concentration(emission_rate_g_s, wind_speed_m_s, stack_height_m, x, y)
        results.append({**point, "concentration": round(concentration, 2)})
    return results


EMISSION_FACTORS_PM25 = {
    "textile": {"small": 500, "medium": 2000, "large": 8000},
    "chemical": {"small": 800, "medium": 3500, "large": 15000},
    "cement": {"small": 1200, "medium": 6000, "large": 25000},
    "food_processing": {"small": 200, "medium": 900, "large": 3500},
}

def estimate_emission_rate(industry: str, scale: str) -> float:
    return EMISSION_FACTORS_PM25[industry][scale] / 3600  # convert g/hour to g/second


def generate_city_grid(center_lat, center_lng, radius_km=5, spacing_m=200):
    """Builds an even grid of lat/lng points around a center point — your 'canvas' for predictions."""
    points = []
    steps = int((radius_km * 1000) / spacing_m)
    for i in range(-steps, steps + 1):
        for j in range(-steps, steps + 1):
            lat = center_lat + (i * spacing_m) / 110_540
            lng = center_lng + (j * spacing_m) / (111_320 * np.cos(np.radians(center_lat)))
            points.append({"id": f"{i}_{j}", "lat": lat, "lng": lng})
    return points


NAAQS_PM25_24HR_LIMIT = 60

def flag_violations(baseline_grid, combined_grid):
    baseline_by_id = {p["id"]: p["concentration"] for p in baseline_grid}
    violations = []
    for cell in combined_grid:
        base = baseline_by_id.get(cell["id"], 0)
        if base <= NAAQS_PM25_24HR_LIMIT < cell["concentration"]:
            violations.append(cell)
    return violations


def generate_recommendation(violations, total_cells):
    affected_pct = len(violations) / total_cells * 100
    if affected_pct == 0:
        return {"decision": "approve", "reason": "No zones exceed safe limits."}
    elif affected_pct < 5:
        return {
            "decision": "approve_with_conditions",
            "reason": f"{len(violations)} nearby zones would exceed NAAQS limits.",
            "conditions": ["Install emission scrubbers", "Increase stack height", "Restrict peak-hour operations"],
        }
    return {"decision": "reject", "reason": f"{affected_pct:.1f}% of surrounding zones would exceed safe limits."}