import numpy as np
import pandas as pd

np.random.seed(42)
n_samples = 2000

wind_speed = np.random.uniform(0.5, 8, n_samples)          # m/s
temperature = np.random.uniform(10, 40, n_samples)          # °C
humidity = np.random.uniform(20, 90, n_samples)             # %
hour_of_day = np.random.randint(0, 24, n_samples)
traffic_index = np.random.uniform(0, 100, n_samples)        # 0=empty roads, 100=peak jam

# Rough, literature-informed relationships:
# - higher wind speed disperses pollution -> lower PM2.5
# - higher traffic -> higher PM2.5
# - rush hours (7-10am, 5-9pm) -> higher PM2.5
# - higher humidity can trap particulates -> slightly higher PM2.5
# - some random noise to simulate real-world variability
rush_hour_boost = np.where(
    ((hour_of_day >= 7) & (hour_of_day <= 10)) | ((hour_of_day >= 17) & (hour_of_day <= 21)),
    15, 0
)

pm25 = (
    40
    - wind_speed * 3.5
    + traffic_index * 0.4
    + humidity * 0.15
    + rush_hour_boost
    + np.random.normal(0, 8, n_samples)  # noise
)
pm25 = np.clip(pm25, 5, 300)  # keep values physically realistic

df = pd.DataFrame({
    'wind_speed': wind_speed,
    'temperature': temperature,
    'humidity': humidity,
    'hour_of_day': hour_of_day,
    'traffic_index': traffic_index,
    'pm25': pm25,
})

df.to_csv('pollution/ml/training_data.csv', index=False)
print(f"Generated {n_samples} synthetic rows -> pollution/ml/training_data.csv")