from django.urls import path
from core.views import WorkshopView

urlpatterns = [
    path("workshop/", WorkshopView.as_view(), name="workshop"),
]
