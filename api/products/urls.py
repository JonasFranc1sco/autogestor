from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet

router = DefaultRouter()
router.register('products', ProductViewSet, basename="Product")

urlpatterns = []
urlpatterns += router.urls
