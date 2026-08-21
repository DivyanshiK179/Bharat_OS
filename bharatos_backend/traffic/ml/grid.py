import numpy as np

# Real Prayagraj landmark coordinates — used to make the synthetic grid
# feel geographically honest instead of purely random
SANGAM = (25.4306, 81.8809)
NAINI_BRIDGE = (25.4170, 81.8470)
RAILWAY_JUNCTION = (25.4484, 81.8180)

def _haversine_km(lat1, lng1, lat2, lng2):
    R = 6371
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lng2 - lng1)
    a = np.sin(dphi / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dlambda / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))


def generate_road_grid(center_lat, center_lng, radius_km=5, spacing_m=300):
    """Same pattern as pollution's generate_city_grid — a canvas of points,
    each tagged with structural features (bridge/railway/road-width) based
    on proximity to real Prayagraj landmarks."""
    points = []
    steps = int((radius_km * 1000) / spacing_m)
    for i in range(-steps, steps + 1):
        for j in range(-steps, steps + 1):
            lat = center_lat + (i * spacing_m) / 110_540
            lng = center_lng + (j * spacing_m) / (111_320 * np.cos(np.radians(center_lat)))

            dist_to_sangam = _haversine_km(lat, lng, *SANGAM)
            dist_to_bridge = _haversine_km(lat, lng, *NAINI_BRIDGE)
            dist_to_railway = _haversine_km(lat, lng, *RAILWAY_JUNCTION)

            points.append({
                "id": f"{i}_{j}",
                "lat": lat,
                "lng": lng,
                "distance_to_sangam_km": round(dist_to_sangam, 2),
                "is_bridge_segment": 1 if dist_to_bridge < 0.3 else 0,
                "near_railway_crossing": 1 if dist_to_railway < 0.4 else 0,
                # Deterministic pseudo-variety for road width, so the same point
                # always gets the same category (stand-in until you have real OSM road-width tags)
                "road_width_category": abs(i + j) % 3,  # 0=narrow, 1=medium, 2=wide
            })
    return points