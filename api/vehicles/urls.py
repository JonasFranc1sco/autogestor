from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet

router = DefaultRouter()
router.register('Vehicles', VehicleViewSet, basename="Vehicle")

urlpatterns = []
urlpatterns += router.urls
