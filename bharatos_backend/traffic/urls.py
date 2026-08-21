from django.urls import path
from .views import TrafficPredictView

urlpatterns = [
    path('predict/', TrafficPredictView.as_view(), name='traffic-predict'),
]