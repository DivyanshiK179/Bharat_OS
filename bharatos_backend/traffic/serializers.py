from rest_framework import serializers

SCENARIO_CHOICES = [
    "none", "rally", "protest", "vip_movement", "wedding_season",
    "mela_bathing_day", "exam_season", "market_day", "railway_crossing_closure",
]

class TrafficPredictSerializer(serializers.Serializer):
    scenario_type = serializers.ChoiceField(choices=SCENARIO_CHOICES)
    center_lat = serializers.FloatField()
    center_lng = serializers.FloatField()
    hour_of_day = serializers.IntegerField(min_value=0, max_value=23)
    day_of_week = serializers.IntegerField(min_value=0, max_value=6)  # 0=Mon ... 6=Sun
    rainfall_mm = serializers.FloatField()
    visibility_m = serializers.FloatField(default=10000)  # fog: lower = worse visibility