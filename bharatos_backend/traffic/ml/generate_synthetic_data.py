import numpy as np
import pandas as pd

np.random.seed(42)
n_samples = 4000

hour_of_day = np.random.randint(0, 24, n_samples)
day_of_week = np.random.randint(0, 7, n_samples)  # 0=Mon ... 6=Sun
rainfall_mm = np.where(np.random.rand(n_samples) < 0.6, 0, np.random.uniform(0, 30, n_samples))
visibility_m = np.random.uniform(300, 10000, n_samples)
distance_to_sangam_km = np.random.uniform(0, 15, n_samples)
is_bridge_segment = np.random.binomial(1, 0.3, n_samples)
near_railway_crossing = np.random.binomial(1, 0.15, n_samples)
road_width_category = np.random.randint(0, 3, n_samples)  # 0=narrow, 1=medium, 2=wide

# Only one scenario active per sample (matches the dropdown UI — one scenario at a time)
scenario_options = [
    "none", "rally", "protest", "vip_movement", "wedding_season",
    "mela_bathing_day", "exam_season", "market_day", "railway_crossing_closure",
]
scenario_type = np.random.choice(scenario_options, n_samples)

def flag(name):
    return (scenario_type == name).astype(float)

# Rough, literature-informed + Prayagraj-specific relationships:
rush_hour_boost = np.where(
    ((hour_of_day >= 8) & (hour_of_day <= 10)) | ((hour_of_day >= 17) & (hour_of_day <= 20)),
    25, 0
)
weekend_relief = np.where((day_of_week >= 5), -10, 0)
rain_effect = np.minimum(rainfall_mm * 0.8, 20)
fog_effect = np.where(visibility_m < 1000, (1000 - visibility_m) / 1000 * 20, 0)

wedding_effect = flag("wedding_season") * np.where(road_width_category == 0, 25, 10)
mela_effect = flag("mela_bathing_day") * (40 * (1 - distance_to_sangam_km / 15).clip(0, 1)
                                           + is_bridge_segment * 15)
railway_effect = flag("railway_crossing_closure") * np.where(near_railway_crossing == 1, 20, 5)

congestion_percent = (
    20
    + rush_hour_boost
    + weekend_relief
    + rain_effect
    + fog_effect
    + flag("rally") * 30
    + flag("protest") * 25
    + flag("vip_movement") * 20
    + wedding_effect
    + mela_effect
    + flag("exam_season") * 10
    + flag("market_day") * 15
    + railway_effect
    + np.random.normal(0, 8, n_samples)  # noise
)

# Bridges amplify whatever congestion is already happening upstream
congestion_percent = np.where(is_bridge_segment == 1, congestion_percent * 1.2, congestion_percent)
congestion_percent = np.clip(congestion_percent, 0, 100)

df = pd.DataFrame({
    "hour_of_day": hour_of_day,
    "day_of_week": day_of_week,
    "rainfall_mm": rainfall_mm,
    "visibility_m": visibility_m,
    "distance_to_sangam_km": distance_to_sangam_km,
    "is_bridge_segment": is_bridge_segment,
    "near_railway_crossing": near_railway_crossing,
    "road_width_category": road_width_category,
    "is_rally": flag("rally"),
    "is_protest": flag("protest"),
    "is_vip_movement": flag("vip_movement"),
    "is_wedding_season": flag("wedding_season"),
    "is_mela_bathing_day": flag("mela_bathing_day"),
    "is_exam_season": flag("exam_season"),
    "is_market_day": flag("market_day"),
    "is_railway_crossing_closure": flag("railway_crossing_closure"),
    "congestion_percent": congestion_percent,
})

df.to_csv("traffic/ml/training_data.csv", index=False)
print(f"Generated {n_samples} synthetic rows -> traffic/ml/training_data.csv")