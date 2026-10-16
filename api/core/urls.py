from django.urls import path
from core.views import CashRegisterView, CepLookupView, DashboardView, ReportsView, WorkshopView

urlpatterns = [
    path("workshop/", WorkshopView.as_view(), name="workshop"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("cash-register/", CashRegisterView.as_view(), name="cash-register"),
    path("reports/", ReportsView.as_view(), name="reports"),
    path("utils/cep/", CepLookupView.as_view(), name="lookup-cep"),
]
