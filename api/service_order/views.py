from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import ServiceOrder
from .serializers import ServiceOrderSerializer
from users.models import Role
from users.permissions import CanManageServiceOrders
from core.tenancy import TenantViewSetMixin


class ServiceOrderViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = ServiceOrder.objects.select_related(
        "workshop", "client", "client__address",
        "vehicle", "vehicle__owner", "vehicle__owner__address",
        "mechanic", "mechanic__address", "created_by",
    ).prefetch_related(
        "services__service__employee__address", "products__product",
    ).all()
    serializer_class = ServiceOrderSerializer

    permission_classes = [CanManageServiceOrders]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "client", "mechanic"]
    search_fields = ["number", "client__name", "vehicle__license_plate", "description"]
    ordering_fields = ["created_at", "number", "total_price", "status"]
    ordering = ["-created_at"]

    MECHANIC_EDITABLE_FIELDS = {"observations", "mechanic_id"}

    def update(self, request, *args, **kwargs):
        if request.user.role == Role.MECHANIC:
            extra = set(request.data.keys()) - self.MECHANIC_EDITABLE_FIELDS
            if extra:
                raise PermissionDenied(
                    "Mecânicos só podem atualizar observações e o mecânico responsável."
                )
        return super().update(request, *args, **kwargs)

    def perform_destroy(self, instance):
        if self.request.user.role not in (Role.ADMIN, Role.MANAGER):
            raise PermissionDenied("Apenas administradores e gerentes podem excluir ordens de serviço.")
        super().perform_destroy(instance)

    @action(detail=True, methods=["post"], url_path="change-status")
    def change_status(self, request, pk=None):
        with transaction.atomic():
            service_order = ServiceOrder.objects.select_for_update().get(
                pk=self.get_object().pk
            )

            new_status = request.data.get("status")

            if new_status not in ServiceOrder.Status.values:
                return Response(
                    {"detail": "Status inválido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not service_order.can_transition_to(new_status):
                return Response(
                    {"detail": f"Transição de status inválida: {service_order.status} → {new_status}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            service_order.status = new_status

            if new_status in ServiceOrder.CLOSED_STATUSES:
                service_order.closed_at = timezone.now()

            service_order.save(update_fields=["status", "closed_at", "updated_at"])

        return Response(self.get_serializer(service_order).data)
