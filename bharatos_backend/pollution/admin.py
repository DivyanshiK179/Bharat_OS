from django.contrib import admin
from .models import StationReading, FactorySimulation


@admin.register(FactorySimulation)
class FactorySimulationAdmin(admin.ModelAdmin):
    list_display = ('industry_type', 'scale', 'decision', 'stack_height_m', 'created_at')
    list_filter = ('decision', 'industry_type', 'scale')
    search_fields = ('industry_type', 'reason')
    ordering = ('-created_at',)


@admin.register(StationReading)
class StationReadingAdmin(admin.ModelAdmin):
    list_display = ('station_name', 'pm25', 'wind_speed', 'temperature', 'recorded_at')
    list_filter = ('station_name',)
    search_fields = ('station_name',)
    ordering = ('-recorded_at',)