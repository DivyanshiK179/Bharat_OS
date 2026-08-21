from django.db import models

class TrafficSimulation(models.Model):
    """Every traffic scenario a user runs, saved for record-keeping — mirrors FactorySimulation."""
    scenario_type = models.CharField(max_length=40)   # rally / protest / mela_bathing_day / etc.
    center_lat = models.FloatField()
    center_lng = models.FloatField()
    hour_of_day = models.IntegerField()
    rainfall_mm = models.FloatField()
    avg_congestion_percent = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.scenario_type} @ {self.created_at} ({self.avg_congestion_percent:.1f}%)"