import joblib
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import TrafficPredictSerializer
from .models import TrafficSimulation
from .ml.grid import generate_road_grid

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml/saved_models/traffic_xgboost.pkl')
_model = None

def get_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


FEATURES_ORDER = [
    "hour_of_day", "day_of_week", "rainfall_mm", "visibility_m",
    "distance_to_sangam_km", "is_bridge_segment", "near_railway_crossing",
    "road_width_category", "is_rally", "is_protest", "is_vip_movement",
    "is_wedding_season", "is_mela_bathing_day", "is_exam_season",
    "is_market_day", "is_railway_crossing_closure",
]

SCENARIO_TO_FLAGS = {
    name: name for name in [
        "rally", "protest", "vip_movement", "wedding_season",
        "mela_bathing_day", "exam_season", "market_day", "railway_crossing_closure",
    ]
}


class TrafficPredictView(APIView):
    """Predicts congestion across a grid of road points for a chosen scenario."""

    def post(self, request):
        serializer = TrafficPredictSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        model = get_model()
        grid = generate_road_grid(data["center_lat"], data["center_lng"])
        active_flag = SCENARIO_TO_FLAGS.get(data["scenario_type"])  # None if "none"

        predictions = []
        for point in grid:
            row = {
                "hour_of_day": data["hour_of_day"],
                "day_of_week": data["day_of_week"],
                "rainfall_mm": data["rainfall_mm"],
                "visibility_m": data["visibility_m"],
                "distance_to_sangam_km": point["distance_to_sangam_km"],
                "is_bridge_segment": point["is_bridge_segment"],
                "near_railway_crossing": point["near_railway_crossing"],
                "road_width_category": point["road_width_category"],
                "is_rally": 0, "is_protest": 0, "is_vip_movement": 0,
                "is_wedding_season": 0, "is_mela_bathing_day": 0,
                "is_exam_season": 0, "is_market_day": 0, "is_railway_crossing_closure": 0,
            }
            if active_flag:
                row[f"is_{active_flag}"] = 1

            features = [[row[f] for f in FEATURES_ORDER]]
            congestion = float(model.predict(features)[0])
            predictions.append({
                "id": point["id"], "lat": point["lat"], "lng": point["lng"],
                "congestion_percent": round(congestion, 1),
            })

        avg_congestion = sum(p["congestion_percent"] for p in predictions) / len(predictions)

        TrafficSimulation.objects.create(
            scenario_type=data["scenario_type"],
            center_lat=data["center_lat"], center_lng=data["center_lng"],
            hour_of_day=data["hour_of_day"], rainfall_mm=data["rainfall_mm"],
            avg_congestion_percent=avg_congestion,
        )

        return Response({"grid": predictions, "avg_congestion_percent": round(avg_congestion, 1)},
                         status=status.HTTP_200_OK)