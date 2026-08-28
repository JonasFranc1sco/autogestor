from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ServiceOrderViewSet

router = DefaultRouter()
router.register("service-orders", ServiceOrderViewSet, basename="service-order")

urlpatterns = []
urlpatterns += router.urls
