from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from core.tenancy import TenantViewSetMixin
from users.permissions import CanManageAppointments
from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related(
        "client", "client__address", "vehicle", "vehicle__owner",
        "mechanic", "service_order",
    ).all()
    serializer_class = AppointmentSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "client", "mechanic"]
    search_fields = ["client__name", "vehicle__license_plate", "description"]
    ordering_fields = ["scheduled_at", "created_at"]
    ordering = ["scheduled_at"]

    def get_permissions(self):
        return [CanManageAppointments()]

    def get_queryset(self):
        queryset = super().get_queryset()
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if date_from:
            queryset = queryset.filter(scheduled_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(scheduled_at__date__lte=date_to)
        return queryset

    @action(detail=True, methods=["post"], url_path="change-status")
    def change_status(self, request, pk=None):
        appointment = self.get_object()
        new_status = request.data.get("status")

        if new_status not in Appointment.Status.values:
            return Response(
                {"detail": "Status inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not appointment.can_transition_to(new_status):
            return Response(
                {"detail": f"Transição de status inválida: {appointment.status} → {new_status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment.status = new_status
        appointment.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(appointment).data)
