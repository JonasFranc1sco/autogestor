from django.urls import path
from core.views import CashRegisterView, DashboardView, WorkshopView

urlpatterns = [
    path("workshop/", WorkshopView.as_view(), name="workshop"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("cash-register/", CashRegisterView.as_view(), name="cash-register"),
]
