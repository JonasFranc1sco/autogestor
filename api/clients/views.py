from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client
from .serializers import ClientSerializer
from users.permissions import CanManageClients
from core.tenancy import TenantViewSetMixin


class ClientViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Client.objects.select_related("address").all()
    serializer_class = ClientSerializer

    permission_classes = [CanManageClients]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["person_type", "is_active"]
    search_fields = ["name", "document", "email", "phone"]
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
