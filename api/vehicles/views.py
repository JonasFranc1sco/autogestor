from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
    ordering_fields = ["license_plate", "mileage", "created_at", "brand"]
    ordering = ["license_plate"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("include_inactive") == "true":
            return queryset
        return queryset.filter(is_active=True)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


    @action(detail=True, methods=["get"], url_path="service-orders")
    def service_orders(self, request, pk=None):
        """Histórico de ordens de serviço do veículo."""
        from service_order.models import ServiceOrder
        from service_order.serializers import ServiceOrderSerializer

        vehicle = self.get_object()
        queryset = (
            ServiceOrder.objects
            .filter(vehicle=vehicle)
            .select_related("client", "vehicle", "mechanic")
            .prefetch_related(
                "services__service", "products__product",
                "payments", "events__created_by",
            )
        )
        serializer = ServiceOrderSerializer(
            queryset, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data)
