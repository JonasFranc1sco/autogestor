from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Service
from .serializers import ServiceSerializer
from users.permissions import CanManageServices
from core.tenancy import TenantViewSetMixin


class ServiceViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Service.objects.select_related("employee", "employee__address").all()
    serializer_class = ServiceSerializer
    permission_classes = [CanManageServices]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "sale_price", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("include_inactive") == "true":
            return queryset
        return queryset.filter(is_active=True)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])
