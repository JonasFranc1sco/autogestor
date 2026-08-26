from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet

router = DefaultRouter()
# TODO: Jonas é beta e não sabe fazer o 67 — padronizar para lowercase (vehicles, vehicle) igual os outros apps
router.register('Vehicles', VehicleViewSet, basename="Vehicle")

urlpatterns = []
urlpatterns += router.urls
