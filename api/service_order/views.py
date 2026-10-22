from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    ServiceOrder, ServiceOrderEvent, ServiceOrderPayment,
    ServiceOrderAttachment,
)
from .serializers import (
    ServiceOrderSerializer, ServiceOrderPaymentSerializer,
    ServiceOrderAttachmentSerializer,
)
from users.models import Role
from users.permissions import CanManageServiceOrders
from core.tenancy import TenantViewSetMixin
from products.services.stock import StockService


class ServiceOrderViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = ServiceOrder.objects.select_related(
        "workshop", "client", "client__address",
        "vehicle", "vehicle__owner", "vehicle__owner__address",
        "created_by",
    ).prefetch_related(
        "services__service__employee__address", "products__product",
        "payments", "events__created_by", "services__mechanic__address", "products__seller",
    ).all()
    serializer_class = ServiceOrderSerializer

    permission_classes = [CanManageServiceOrders]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "client",]
    search_fields = ["number", "client__name", "vehicle__license_plate", "description"]
    ordering_fields = ["created_at", "number", "total_price", "status"]
    ordering = ["-created_at"]

    MECHANIC_EDITABLE_FIELDS = {"observations"}

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
        if instance.payments.exists():
            raise ValidationError(
                "Estorne os pagamentos antes de excluir a ordem de serviço."
            )
        with transaction.atomic():
            StockService.release_service_order_stock(
                instance,
                user=self.request.user,
                reason=f"OS #{instance.number} — exclusão",
            )
            instance.delete()

    @action(detail=True, methods=["post"], url_path="change-status")
    def change_status(self, request, pk=None):
        with transaction.atomic():
            service_order = ServiceOrder.objects.select_for_update().get(
                pk=self.get_object().pk
            )

            previous_status = service_order.status
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

            ServiceOrderEvent.objects.create(
                service_order=service_order,
                from_status=previous_status,
                to_status=new_status,
                description=f"Status alterado de {previous_status} para {new_status}",
                created_by=request.user,
            )

            if new_status == ServiceOrder.Status.CANCELLED:
                StockService.release_service_order_stock(
                    service_order,
                    user=request.user,
                    reason=f"OS #{service_order.number} — cancelamento",
                )

        return Response(self.get_serializer(service_order).data)


    @action(detail=True, methods=["get", "post"], url_path="payments")
    def payments(self, request, pk=None):
        service_order = self.get_object()

        if request.method == "GET":
            queryset = service_order.payments.select_related("created_by")
            serializer = ServiceOrderPaymentSerializer(queryset, many=True)
            return Response(serializer.data)
        
        serializer = ServiceOrderPaymentSerializer(
            data=request.data,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            locked_order = ServiceOrder.objects.select_for_update().get(pk=service_order.pk)
            if locked_order.status == ServiceOrder.Status.CANCELLED:
                return Response(
                    {"detail": "Não é possível registrar pagamentos em uma OS cancelada."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
                
            amount = serializer.validated_data["amount"]
            if amount > locked_order.balance:
                return Response(
                    {"detail": f"O valor do pagamento não pode exceder o saldo da OS ({locked_order.balance})."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            payment = serializer.save(
                service_order=locked_order,
                workshop=service_order.workshop,
                created_by=request.user,
            )
            ServiceOrderEvent.objects.create(
                service_order=locked_order,
                description=f"Pagamento de {payment.amount} registrado ({payment.get_method_display()})",
                created_by=request.user,
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path="payments/(?P<payment_id>[^/.]+)")
    def delete_payment(self, request, pk=None, payment_id=None):
        if request.user.role not in (Role.ADMIN, Role.MANAGER):
            raise PermissionDenied(
                "Apenas administradores e gerentes podem estornar pagamentos."
            )

        service_order = self.get_object()
        try:
            payment = service_order.payments.get(pk=payment_id)
        except ServiceOrderPayment.DoesNotExist:
            return Response(
                {"detail": "Pagamento não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ServiceOrderEvent.objects.create(
            service_order=service_order,
            description=f"Pagamento de {payment.amount} estornado",
            created_by=request.user,
        )
        payment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=True, methods=["get", "post"], url_path="attachments")
    def attachments(self, request, pk=None):
        service_order = self.get_object()

        if request.method == "GET":
            serializer = ServiceOrderAttachmentSerializer(
                service_order.attachments.select_related("uploaded_by"),
                many=True,
                context=self.get_serializer_context(),
            )
            return Response(serializer.data)

        serializer = ServiceOrderAttachmentSerializer(
            data=request.data,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(
            service_order=service_order,
            uploaded_by=request.user,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path="attachments/(?P<attachment_id>[^/.]+)")
    def delete_attachment(self, request, pk=None, attachment_id=None):
        service_order = self.get_object()
        try:
            attachment = service_order.attachments.get(pk=attachment_id)
        except ServiceOrderAttachment.DoesNotExist:
            return Response(
                {"detail": "Anexo não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        attachment.file.delete(save=False)
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
