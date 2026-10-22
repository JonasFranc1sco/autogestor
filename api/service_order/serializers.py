from decimal import Decimal
from django.db import transaction
from rest_framework import serializers

from .models import (
    ServiceOrder, ServiceOrderService, ServiceOrderProduct,
    ServiceOrderEvent, ServiceOrderPayment, ServiceOrderAttachment,
)
from clients.models import Client
from clients.serializers import ClientSerializer
from vehicles.models import Vehicle
from vehicles.serializers import VehicleSerializer
from users.models import User
from users.serializers.user import UserListSerializer
from employees.models import Employee
from employees.serializers import EmployeeSerializer
from products.models import Product
from products.serializers import ProductsSerializer
from services.models import Service
from services.serializers import ServiceSerializer
from core.tenancy import TenantPrimaryKeyRelatedField
from products.services.stock import StockService
from products.models import StockMovement


class ServiceOrderServiceSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = TenantPrimaryKeyRelatedField(
        queryset=Service.objects.all(), write_only=True, source="service", required=False, allow_null=True
    )
    service_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"), required=False)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"), required=False, default=Decimal("0.00"))
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    mechanic = EmployeeSerializer(read_only=True)
    mechanic_id = TenantPrimaryKeyRelatedField(
        queryset=Employee.objects.all(), write_only=True, source="mechanic", required=False, allow_null=True
    )

    class Meta:
        model = ServiceOrderService
        fields = [
            "id", "service", "service_id", "service_name",
            "mechanic", "mechanic_id",
            "price", "discount", "total_price",
        ]

    def validate(self, attrs):
        if not attrs.get("service") and not attrs.get("service_name"):
            raise serializers.ValidationError(
                "Informe service_id ou service_name para o serviço."
            )

        price = attrs.get("price")
        if price is None:
            service = attrs.get("service")
            attrs["price"] = service.sale_price if service else Decimal("0.00")

        discount = attrs.get("discount", Decimal("0.00"))
        if discount > attrs["price"]:
            raise serializers.ValidationError(
                {"discount": "O desconto não pode ser maior que o preço do serviço."}
            )
        return attrs


class ServiceOrderProductSerializer(serializers.ModelSerializer):
    product = ProductsSerializer(read_only=True)
    product_id = TenantPrimaryKeyRelatedField(
        queryset=Product.objects.all(), write_only=True, source="product"
    )
    seller = UserListSerializer(read_only=True)
    seller_id = TenantPrimaryKeyRelatedField(
        queryset=User.objects.all(), write_only=True, source="seller", required=False, allow_null=True
    )
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"), required=False)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"), required=False, default=Decimal("0.00"))
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ServiceOrderProduct
        fields = [
            "id", "product", "product_id",
            "seller", "seller_id", "quantity",
            "price", "discount", "total_price",
        ]

    def validate(self, attrs):
        quantity = attrs.get("quantity", 1)
        if quantity < 1:
            raise serializers.ValidationError(
                {"quantity": "A quantidade deve ser maior ou igual a 1."}
            )

        product = attrs.get("product")
        price = attrs.get("price")
        if price is None:
            attrs["price"] = product.sale_price if product else Decimal("0.00")

        discount = attrs.get("discount", Decimal("0.00"))
        if discount > attrs["price"] * quantity:
            raise serializers.ValidationError(
                {"discount": "O desconto não pode ser maior que o total do item."}
            )
        return attrs


class ServiceOrderEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.full_name", read_only=True, default=None
    )

    class Meta:
        model = ServiceOrderEvent
        fields = [
            "id", "from_status", "to_status", "description",
            "created_by_name", "created_at",
        ]
        read_only_fields = fields


class ServiceOrderPaymentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.full_name", read_only=True, default=None
    )
    service_order = TenantPrimaryKeyRelatedField(
        queryset=ServiceOrder.objects.all(), required=False
    )

    class Meta:
        model = ServiceOrderPayment
        fields = [
            "id", "service_order", "method", "amount",
            "paid_at", "created_by_name", "created_at",
        ]
        read_only_fields = ["id", "paid_at", "created_at", "created_by_name"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "O valor do pagamento deve ser maior que zero."
            )
        return value


class ServiceOrderSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)

    client_id = TenantPrimaryKeyRelatedField(
        queryset=Client.objects.all(), write_only=True, source="client"
    )
    vehicle_id = TenantPrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(), write_only=True, source="vehicle"
    )

    services = ServiceOrderServiceSerializer(many=True, required=False)
    products = ServiceOrderProductSerializer(many=True, required=False)
    events = ServiceOrderEventSerializer(many=True, read_only=True)
    payments = ServiceOrderPaymentSerializer(many=True, read_only=True)
    paid_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ServiceOrder
        fields = [
            "id", "number", "client", "vehicle",
            "client_id", "vehicle_id",
            "status", "description", "observations", "odometer",
            "total_price", "paid_total", "balance",
            "services", "products", "events", "payments",
            "created_at", "updated_at", "opened_at", "closed_at",
        ]
        read_only_fields = [
            "number", "status", "total_price", "paid_total", "balance",
            "created_at", "updated_at", "opened_at", "closed_at",
        ]

    def validate(self, attrs):
        client = attrs.get("client") or getattr(self.instance, "client", None)
        vehicle = attrs.get("vehicle") or getattr(self.instance, "vehicle", None)

        if client and vehicle and vehicle.owner_id != client.id:
            raise serializers.ValidationError(
                {"vehicle_id": "O veículo não pertence ao cliente informado."}
            )

        if self.instance is not None and self.instance.status in ServiceOrder.CLOSED_STATUSES:
                raise serializers.ValidationError(
                    "Não é possível alterar uma ordem de serviço encerrada."
                )

        services_items = attrs.get("services", [])
        products_items = attrs.get("products", [])

        service_keys = set()
        for item_data in services_items:
            service = item_data.get("service")
            raw_name = service.name if service is not None else item_data.get("service_name")
            key = (raw_name or "").strip().lower()
            if key and key in service_keys:
                raise serializers.ValidationError(
                    {"services": "Serviço duplicado na mesma ordem de serviço."}
                )
            if key:
                service_keys.add(key)

        product_keys = set()
        for item_data in products_items:
            product = item_data.get("product")
            key = str(product.pk) if product is not None else None
            if key and key in product_keys:
                raise serializers.ValidationError(
                    {"products": "Produto duplicado na mesma ordem de serviço."}
                )
            if key:
                product_keys.add(key)
        return attrs

    def _get_user(self):
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            return request.user
        return None

    def _get_workshop(self, validated_data):
        workshop = validated_data.pop("workshop", None)
        if workshop is None:
            request = self.context.get("request")
            if request is not None and request.user.is_authenticated:
                workshop = request.user.workshop
        return workshop

    def _create_service_item(self, service_order, item_data, workshop):
        service = item_data.get("service")
        service_name = item_data.get("service_name")

        if not service and service_name:
            service, _ = Service.objects.get_or_create(
                name=service_name,
                workshop=workshop,
                is_active=True,
                defaults={
                    "employee": item_data.get("mechanic"),
                    "cost_price": item_data.get("price", Decimal("0.00")),
                    "sale_price": item_data.get("price", Decimal("0.00")),
                    "margin_percentage": Decimal("0.00"),
                    "description": service_name,
                }
            )

        ServiceOrderService.objects.create(
            service_order=service_order,
            service=service,
            mechanic=item_data.get("mechanic"),
            price=item_data.get("price", Decimal("0.00")),
            discount=item_data.get("discount", Decimal("0.00")),
        )

    def _create_product_item(self, service_order, item_data, user=None):
        product = item_data["product"]
        quantity = item_data.get("quantity", 1)

        ServiceOrderProduct.objects.create(
            service_order=service_order,
            product=product,
            seller=item_data.get("seller"),
            quantity=quantity,
            price=item_data.get("price", product.sale_price),
            discount=item_data.get("discount", Decimal("0.00")),
        )

        StockService.register_movement(
            product=product,
            movement_type=StockMovement.MovementType.OUT,
            quantity=-quantity,
            reason=f"OS #{service_order.number} — baixa de peça",
            service_order=service_order,
            user=user,
        )

    def _return_products_stock(self, service_order, user=None):
        for item in service_order.products.all():
            StockService.register_movement(
                product=item.product,
                movement_type=StockMovement.MovementType.IN,
                quantity=item.quantity,
                reason=f"OS #{service_order.number} — devolução de peça",
                service_order=service_order,
                user=user,
            )

    def _replace_items(self, service_order, services_data, products_data, workshop, user=None):
        if services_data is not None:
            service_order.services.all().delete()
            for item_data in services_data:
                self._create_service_item(service_order, item_data, workshop)

        if products_data is not None:
            self._return_products_stock(service_order, user)
            service_order.products.all().delete()
            for item_data in products_data:
                self._create_product_item(service_order, item_data, user=user)

    @transaction.atomic
    def create(self, validated_data):
        services_data = validated_data.pop("services", [])
        products_data = validated_data.pop("products", [])

        workshop = self._get_workshop(validated_data)
        if workshop is None:
            raise serializers.ValidationError(
                "Não foi possível identificar a oficina para criar a ordem de serviço."
            )

        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            validated_data.setdefault("created_by", request.user)

        service_order = ServiceOrder.objects.create(workshop=workshop, **validated_data)

        for item_data in services_data:
            self._create_service_item(service_order, item_data, workshop)

        for item_data in products_data:
            self._create_product_item(service_order, item_data, user=self._get_user())

        service_order.total_price = service_order.calculate_total()
        service_order.save(update_fields=["total_price"])

        ServiceOrderEvent.objects.create(
            service_order=service_order,
            to_status=service_order.status,
            description=f"OS #{service_order.number} criada",
            created_by=self._get_user(),
        )

        return service_order

    @transaction.atomic
    def update(self, instance, validated_data):
        locked_order = ServiceOrder.objects.select_for_update().get(pk=instance.pk)
        if locked_order.status in ServiceOrder.CLOSED_STATUSES:
            raise serializers.ValidationError(
                "Não é possível alterar uma ordem de serviço encerrada."
            )
        services_data = validated_data.pop("services", None)
        products_data = validated_data.pop("products", None)
        validated_data.pop("workshop", None)

        instance = super().update(instance, validated_data)

        if services_data is not None or products_data is not None:
            self._replace_items(
                instance,
                services_data,
                products_data,
                instance.workshop,
                user=self._get_user(),
            )

        new_total = instance.calculate_total()
        paid_total = locked_order.paid_total
        if new_total < paid_total:
            raise serializers.ValidationError(
                {
                    "detail": (
                        f"O novo valor total da OS ({new_total}) não pode ser menor"
                        f"que o valor já pago ({paid_total}). Estorne os pagamentos antes de reduzir os itens."
                    )
                }
            )
        instance.total_price = new_total
        instance.save(update_fields=["total_price"])

        return instance


class ServiceOrderAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.full_name", read_only=True, default=None
    )
    file_url = serializers.SerializerMethodField()

    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

    class Meta:
        model = ServiceOrderAttachment
        fields = [
            "id", "file", "file_url", "description",
            "uploaded_by_name", "created_at",
        ]
        read_only_fields = ["id", "uploaded_by_name", "created_at"]

    def validate_file(self, value):
        import os

        ext = os.path.splitext(value.name)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                "Formato não permitido. Envie JPG, PNG, WEBP ou PDF."
            )
        if value.size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError(
                "O arquivo deve ter no máximo 10 MB."
            )
        return value

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request is not None:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None
