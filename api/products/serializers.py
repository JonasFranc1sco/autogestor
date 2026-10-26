from django.db import transaction
from rest_framework import serializers
from .models import Product, StockMovement
from core.tenancy import TenantPrimaryKeyRelatedField
from users.models import Role
from service_order.models import ServiceOrder
from core.tenancy import tenant_of

HIDDEN_COST_FIELDS = ("cost_price", "margin_percentage")


class ProductsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'reference_code', 'barcode', 'description', 'application', 'supplier', 'brand',
                  'cost_price', 'margin_percentage', 'sale_price', 'stock_quantity', 'min_stock_quantity', 'warranty_days',
                  'location', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def _validate_unique(self, value, field, label):
        if not value:
            return value

        queryset = Product.objects.filter(**{field: value, "is_active": True})
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            workshop = tenant_of(request.user)
            if workshop is not None:
                queryset = queryset.filter(workshop=workshop)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                f"Já existe um produto ativo com este {label}."
            )
        return value

    def validate_barcode(self, value):
        return self._validate_unique(value, "barcode", "código de barras")

    def validate_reference_code(self, value):
        return self._validate_unique(value, "reference_code", "código de referência")

    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "A quantidade em estoque não pode ser negativa."
            )
        if self.instance is not None and value != self.instance.stock_quantity:
            raise serializers.ValidationError(
                "O saldo de estoque não pode ser alterado diretamente na edição do produto. Utilize a moventação de estoque"
            )
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        from products.services.stock import StockService
        
        initial_stock = validated_data.pop("stock_quantity", 0) or 0
        validated_data["stock_quantity"] = 0
        product = super().create(validated_data)
        
        if initial_stock > 0:
            request = self.context.get("request")
            user = (
                request.user
                if request is not None and request.user.is_authenticated
                else None
            )
            StockService.register_movement(
                product=product,
                movement_type=StockMovement.MovementType.IN,
                quantity=initial_stock,
                reason="Estoque inicial no cadastro",
                user=user
            )
        return product
    
    def update(self, instance, validated_data):
        validated_data.pop("stock_quantity", None)
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            if request.user.role not in (Role.ADMIN, Role.MANAGER, Role.ATTENDANT) and not request.user.is_superuser:
                for field in HIDDEN_COST_FIELDS:
                    data.pop(field, None)
        return data


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)
    product = TenantPrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))
    service_order = TenantPrimaryKeyRelatedField(
        queryset=ServiceOrder.objects.filter(is_active=True), required=False, allow_null=True
    )

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type', 'quantity',
            'reason', 'service_order', 'created_by', 'created_by_name',
            'stock_after', 'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'stock_after']

    def validate(self, attrs):
        movement_type = attrs.get("movement_type")
        quantity = attrs.get("quantity")

        if quantity == 0:
            raise serializers.ValidationError(
                {"quantity": "A quantidade da movimentação não pode ser zero."}
            )
        if movement_type == StockMovement.MovementType.IN and quantity < 0:
            raise serializers.ValidationError(
                {"quantity": "Entradas devem ter quantidade positiva."}
            )
        if movement_type == StockMovement.MovementType.OUT and quantity > 0:
            raise serializers.ValidationError(
                {"quantity": "Saídas devem ter quantidade negativa."}
            )
        return attrs

    def create(self, validated_data):
        from products.services.stock import StockService

        return StockService.register_movement(
            product=validated_data["product"],
            movement_type=validated_data["movement_type"],
            quantity=validated_data["quantity"],
            reason=validated_data.get("reason", ""),
            service_order=validated_data.get("service_order"),
            user=validated_data.get("created_by"),
        )
