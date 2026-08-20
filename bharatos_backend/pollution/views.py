import joblib
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import PollutionPredictSerializer, FactoryImpactSerializer
from .models import FactorySimulation
from .ml.dispersion import (
    generate_city_grid, compute_plume_over_grid, estimate_emission_rate,
    flag_violations, generate_recommendation,
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml/saved_models/pollution_regression.pkl')
_model = None

def get_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)  # loaded once, reused across requests
    return _model


class PollutionPredictView(APIView):
    """Baseline city-wide pollution prediction — no hypothetical factory."""

    def post(self, request):
        serializer = PollutionPredictSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        model = get_model()
        grid = generate_city_grid(data['center_lat'], data['center_lng'])

        predictions = []
        for point in grid:
            features = [[data['wind_speed'], data['temperature'], data['humidity'],
                         data['hour_of_day'], data['traffic_index']]]
            predicted_pm25 = model.predict(features)[0]
            predictions.append({**point, "concentration": round(predicted_pm25, 2)})

        return Response({"grid": predictions}, status=status.HTTP_200_OK)


class FactoryImpactView(APIView):
    """The 'what-if factory' scenario engine endpoint — government-only in practice."""

    def post(self, request):
        serializer = FactoryImpactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        grid = generate_city_grid(data['latitude'], data['longitude'])
        emission_rate = estimate_emission_rate(data['industry_type'], data['scale'])

        plume_grid = compute_plume_over_grid(
            emission_rate, data['latitude'], data['longitude'], data['stack_height_m'],
            data['wind_speed'], data['wind_direction_deg'], grid,
        )

        # Baseline is a flat assumption here for simplicity — in production,
        # swap this for a real call to PollutionPredictView's logic
        baseline_grid = [{**p, "concentration": 25.0} for p in grid]

        combined_grid = [
            {**p, "concentration": round(p["concentration"] + b["concentration"], 2)}
            for p, b in zip(plume_grid, baseline_grid)
        ]

        violations = flag_violations(baseline_grid, combined_grid)
        recommendation = generate_recommendation(violations, len(combined_grid))

        FactorySimulation.objects.create(
            industry_type=data['industry_type'], scale=data['scale'],
            latitude=data['latitude'], longitude=data['longitude'],
            stack_height_m=data['stack_height_m'],
            decision=recommendation['decision'], reason=recommendation['reason'],
        )

        return Response({
            "baseline_grid": baseline_grid,
            "projected_grid": combined_grid,
            "violations": violations,
            "recommendation": recommendation,
        }, status=status.HTTP_200_OK)