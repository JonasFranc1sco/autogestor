from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Employee
from .serializers import EmployeeSerializer
from users.permissions import CanManageEmployees
from core.tenancy import TenantViewSetMixin


class EmployeeViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("address").all()
    serializer_class = EmployeeSerializer

    permission_classes = [CanManageEmployees]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "document_cpf", "document_rg", "email"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("include_inactive") == "true":
            return queryset
        return queryset.filter(is_active=True)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])
