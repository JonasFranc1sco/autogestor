from django.urls import path
from core.views import DashboardView, WorkshopView

urlpatterns = [
    path("workshop/", WorkshopView.as_view(), name="workshop"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
]
