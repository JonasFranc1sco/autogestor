from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Vehicle
from .serializers import VehicleSerializer
from users.permissions import CanManageVehicles
from core.tenancy import TenantViewSetMixin


class VehicleViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Vehicle.objects.select_related("owner", "owner__address").all()
    serializer_class = VehicleSerializer

    permission_classes = [CanManageVehicles]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["owner", "brand"]
    search_fields = ["license_plate", "brand", "model", "owner__name", "chassis"]
    ordering_fields = ["license_plate", "created_at", "brand"]
    ordering = ["license_plate"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("include_inactive") == "true":
            return queryset
        return queryset.filter(is_active=True)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])
