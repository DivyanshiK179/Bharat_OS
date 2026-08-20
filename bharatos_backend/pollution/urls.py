from django.urls import path
from .views import PollutionPredictView, FactoryImpactView

urlpatterns = [
    path('predict/', PollutionPredictView.as_view(), name='pollution-predict'),
    path('factory-impact/', FactoryImpactView.as_view(), name='factory-impact'),
]