import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

# Swap this CSV for your blended real (TomTom) + synthetic (SUMO) dataset
# as real data accumulates — same file, same column names, zero code changes needed.
df = pd.read_csv('traffic/ml/training_data.csv')

FEATURES = [
    "hour_of_day", "day_of_week", "rainfall_mm", "visibility_m",
    "distance_to_sangam_km", "is_bridge_segment", "near_railway_crossing",
    "road_width_category", "is_rally", "is_protest", "is_vip_movement",
    "is_wedding_season", "is_mela_bathing_day", "is_exam_season",
    "is_market_day", "is_railway_crossing_closure",
]
X = df[FEATURES]
y = df["congestion_percent"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# XGBoost specifically (not linear regression) because congestion effects genuinely
# interact — e.g. a wedding procession hits narrow roads far harder than wide ones,
# and a mela bathing day's impact depends on distance to Sangam AND bridge proximity
# together. Tree ensembles capture these interactions; a linear model can't.
model = XGBRegressor(n_estimators=200, max_depth=5, learning_rate=0.08, random_state=42)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
print(f"Model trained. Mean Absolute Error: {mae:.2f} congestion points")
print("Report this honestly in your pitch, same as the pollution model's MAE.")

os.makedirs("traffic/ml/saved_models", exist_ok=True)
joblib.dump(model, "traffic/ml/saved_models/traffic_xgboost.pkl")