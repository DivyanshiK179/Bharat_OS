from rest_framework import serializers

class PollutionPredictSerializer(serializers.Serializer):
    center_lat = serializers.FloatField()
    center_lng = serializers.FloatField()
    wind_speed = serializers.FloatField()
    temperature = serializers.FloatField()
    humidity = serializers.FloatField()
    hour_of_day = serializers.IntegerField(min_value=0, max_value=23)
    traffic_index = serializers.FloatField()

class FactoryImpactSerializer(serializers.Serializer):
    industry_type = serializers.ChoiceField(choices=["textile", "chemical", "cement", "food_processing"])
    scale = serializers.ChoiceField(choices=["small", "medium", "large"])
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    stack_height_m = serializers.FloatField()
    wind_speed = serializers.FloatField()
    wind_direction_deg = serializers.FloatField()