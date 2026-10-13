from decimal import Decimal
from django.db import transaction
from rest_framework import serializers

from .models import ServiceOrder, ServiceOrderService, ServiceOrderProduct
from clients.models import Client
from clients.serializers import ClientSerializer
from vehicles.models import Vehicle
from vehicles.serializers import VehicleSerializer
from employees.models import Employee
from employees.serializers import EmployeeSerializer
from products.models import Product
from products.serializers import ProductsSerializer
from services.models import Service
from services.serializers import ServiceSerializer


class ServiceOrderServiceSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), write_only=True, required=False, allow_null=True
    )
    service_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ServiceOrderService
        fields = [
            "id", "service", "service_id", "service_name",
            "price", "discount", "total_price"
        ]


class ServiceOrderProductSerializer(serializers.ModelSerializer):
    product = ProductsSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), write_only=True, source="product"
    )
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ServiceOrderProduct
        fields = [
            "id", "product", "product_id", "quantity",
            "price", "discount", "total_price"
        ]


class ServiceOrderSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)
    mechanic = EmployeeSerializer(read_only=True)

    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(), write_only=True, source="client"
    )
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(), write_only=True, source="vehicle"
    )
    mechanic_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), write_only=True, source="mechanic", required=False, allow_null=True
    )

    services = ServiceOrderServiceSerializer(many=True, required=False)
    products = ServiceOrderProductSerializer(many=True, required=False)

    class Meta:
        model = ServiceOrder
        fields = [
            "id", "client", "vehicle", "mechanic",
            "client_id", "vehicle_id", "mechanic_id",
            "status", "description", "observations",
            "total_price", "services", "products",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    @transaction.atomic
    def create(self, validated_data):
        services_data = validated_data.pop("services", [])
        products_data = validated_data.pop("products", [])

        service_order = ServiceOrder.objects.create(**validated_data)

        for s_data in services_data:
            service = s_data.get("service_id")
            service_name = s_data.get("service_name")
            price = s_data.get("price", Decimal("0.00"))
            discount = s_data.get("discount", Decimal("0.00"))

            if not service and service_name:
                service, _ = Service.objects.get_or_create(
                    name=service_name,
                    defaults={
                        "employee": service_order.mechanic,
                        "cost_price": price,
                        "sale_price": price,
                        "margin_percentage": Decimal("0.00"),
                        "description": service_name,
                    }
                )

            if service:
                ServiceOrderService.objects.create(
                    service_order=service_order,
                    service=service,
                    price=price,
                    discount=discount,
                )

        for p_data in products_data:
            product = p_data.get("product")
            quantity = p_data.get("quantity", 1)
            price = p_data.get("price", product.sale_price if product else Decimal("0.00"))
            discount = p_data.get("discount", Decimal("0.00"))

            ServiceOrderProduct.objects.create(
                service_order=service_order,
                product=product,
                quantity=quantity,
                price=price,
                discount=discount,
            )

        calculated = service_order.calculate_total()
        if calculated > 0 or not service_order.total_price:
            service_order.total_price = calculated
            service_order.save(update_fields=["total_price"])

        return service_order
