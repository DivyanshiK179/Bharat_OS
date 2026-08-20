from django.db import models

class StationReading(models.Model):
    """Real readings pulled from OpenAQ/CPCB, used to train the model."""
    station_name = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    pm25 = models.FloatField()
    wind_speed = models.FloatField()
    temperature = models.FloatField()
    humidity = models.FloatField()
    hour_of_day = models.IntegerField()
    recorded_at = models.DateTimeField()

    def __str__(self):
        return f"{self.station_name} @ {self.recorded_at}"


class FactorySimulation(models.Model):
    """Every 'what-if factory' scenario a government user runs, saved for record-keeping."""
    industry_type = models.CharField(max_length=100)
    scale = models.CharField(max_length=20)
    latitude = models.FloatField()
    longitude = models.FloatField()
    stack_height_m = models.FloatField()
    decision = models.CharField(max_length=30)   # approve / approve_with_conditions / reject
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.industry_type} ({self.scale}) - {self.decision}"