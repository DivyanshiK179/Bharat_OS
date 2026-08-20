import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

# Load your cleaned dataset — this CSV comes from Step 1-2 of the earlier
# pollution pipeline (OpenAQ + weather, merged and cleaned)
df = pd.read_csv('pollution/ml/training_data.csv')
# Expected columns: pm25, wind_speed, temperature, humidity, hour_of_day, traffic_index

features = ['wind_speed', 'temperature', 'humidity', 'hour_of_day', 'traffic_index']
X = df[features]
y = df['pm25']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)

predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
print(f"Model trained. Mean Absolute Error: {mae:.2f} µg/m³")
print("This number tells you how far off predictions are on average — report this honestly in your pitch.")

# Save the trained model to disk so Django can load it without retraining every request
os.makedirs('pollution/ml/saved_models', exist_ok=True)
joblib.dump(model, 'pollution/ml/saved_models/pollution_regression.pkl')