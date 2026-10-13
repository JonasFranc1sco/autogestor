from decimal import Decimal
from django.test import TestCase
from clients.models import Client
from vehicles.models import Vehicle
from employees.models import Employee
from products.models import Product
from services.models import Service
from service_order.models import ServiceOrder, ServiceOrderService, ServiceOrderProduct
from service_order.serializers import ServiceOrderSerializer


class ServiceOrderTests(TestCase):
    def setUp(self):
        self.client = Client.objects.create(name="João Silva", email="joao@teste.com")
        self.vehicle = Vehicle.objects.create(
            owner=self.client,
            brand="Volkswagen",
            model="Gol",
            license_plate="BRA2E19",
        )
        self.mechanic = Employee.objects.create(name="Marcos Silva")
        self.product = Product.objects.create(
            name="Filtro de Óleo",
            cost_price=Decimal("20.00"),
            sale_price=Decimal("40.00"),
            margin_percentage=Decimal("100.00"),
            stock_quantity=15,
        )

    def test_create_service_order_with_mechanic_services_and_products(self):
        data = {
            "client_id": str(self.client.id),
            "vehicle_id": str(self.vehicle.id),
            "mechanic_id": str(self.mechanic.id),
            "description": "Revisão preventiva",
            "observations": "Cliente solicitou entrega até as 17h",
            "services": [
                {
                    "service_name": "Troca de óleo e filtro",
                    "price": "100.00",
                    "discount": "10.00",
                }
            ],
            "products": [
                {
                    "product_id": str(self.product.id),
                    "quantity": 2,
                    "price": "40.00",
                    "discount": "5.00",
                }
            ],
        }

        serializer = ServiceOrderSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        order = serializer.save()

        self.assertEqual(order.client, self.client)
        self.assertEqual(order.vehicle, self.vehicle)
        self.assertEqual(order.mechanic, self.mechanic)
        self.assertEqual(order.services.count(), 1)
        self.assertEqual(order.products.count(), 1)

        # Service total: 100.00 - 10.00 = 90.00
        service_item = order.services.first()
        self.assertEqual(service_item.total_price, Decimal("90.00"))

        # Product total: (40.00 * 2) - 5.00 = 75.00
        product_item = order.products.first()
        self.assertEqual(product_item.total_price, Decimal("75.00"))

        # Grand total: 90.00 + 75.00 = 165.00
        self.assertEqual(order.total_price, Decimal("165.00"))

    def test_create_service_order_without_mechanic(self):
        data = {
            "client_id": str(self.client.id),
            "vehicle_id": str(self.vehicle.id),
            "description": "Diagnóstico inicial",
        }

        serializer = ServiceOrderSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        order = serializer.save()

        self.assertIsNone(order.mechanic)
        self.assertEqual(order.total_price, Decimal("0.00"))
