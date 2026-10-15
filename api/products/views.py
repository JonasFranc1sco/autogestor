from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, StockMovement
from .serializers import ProductsSerializer, StockMovementSerializer

from users.permissions import CanManageProducts, CanManageStock
from core.tenancy import TenantViewSetMixin


class ProductViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductsSerializer
    permission_classes = [CanManageProducts]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["brand", "supplier", "is_active"]
    search_fields = ["name", "barcode", "reference_code", "application", "brand"]
    ordering_fields = ["name", "stock_quantity", "sale_price", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("include_inactive") == "true":
            return queryset
        return queryset.filter(is_active=True)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class StockMovementViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related(
        "product", "created_by", "service_order"
    ).all()
    serializer_class = StockMovementSerializer
    permission_classes = [CanManageStock]
    http_method_names = ["get", "post", "head", "options"]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["product", "movement_type", "service_order"]
    search_fields = ["product__name", "reason"]
    ordering_fields = ["created_at", "quantity"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
