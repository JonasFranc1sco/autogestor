from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from clients.models import Client
from core.models import Workshop
from employees.models import Employee
from products.models import Product
from service_order.models import ServiceOrder, ServiceOrderProduct, ServiceOrderService
from services.models import Service
from users.models import User, Role
from vehicles.models import Vehicle

OS_URL = "/api/service-orders/"


class ServiceOrderBaseTestCase(APITestCase):
    def setUp(self):
        self.workshop = Workshop.objects.create(name="Oficina A")
        self.other_workshop = Workshop.objects.create(name="Oficina B")

        self.admin = User.objects.create_user(
            email="admin@oficina.com",
            password="senhaForte123",
            full_name="Admin",
            role=Role.ADMIN,
            workshop=self.workshop,
        )
        self.mechanic_user = User.objects.create_user(
            email="mecanico@oficina.com",
            password="senhaForte123",
            full_name="Mecânico",
            role=Role.MECHANIC,
            workshop=self.workshop,
        )
        self.client_obj = Client.objects.create(
            workshop=self.workshop,
            name="João Silva",
            document="12345678901",
        )
        self.vehicle = Vehicle.objects.create(
            workshop=self.workshop,
            owner=self.client_obj,
            brand="Volkswagen",
            model="Gol",
            license_plate="BRA2E19",
        )
        self.mechanic = Employee.objects.create(
            workshop=self.workshop,
            name="Marcos Silva",
        )
        self.product = Product.objects.create(
            workshop=self.workshop,
            name="Filtro de Óleo",
            cost_price=Decimal("20.00"),
            sale_price=Decimal("40.00"),
            margin_percentage=Decimal("100.00"),
            stock_quantity=15,
        )
        self.catalog_service = Service.objects.create(
            workshop=self.workshop,
            name="Alinhamento",
            sale_price=Decimal("80.00"),
            cost_price=Decimal("30.00"),
        )
        self.client.force_authenticate(self.admin)

    def payload(self, **overrides):
        data = {
            "client_id": str(self.client_obj.id),
            "vehicle_id": str(self.vehicle.id),
            "description": "Revisão preventiva",
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
        data.update(overrides)
        return data


class ServiceOrderCreateTests(ServiceOrderBaseTestCase):
    def test_create_with_services_and_products_calculates_total(self):
        response = self.client.post(OS_URL, self.payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        order = ServiceOrder.objects.get()
        self.assertEqual(order.client, self.client_obj)
        self.assertEqual(order.vehicle, self.vehicle)
        self.assertEqual(order.services.count(), 1)
        self.assertEqual(order.products.count(), 1)

        service_item = order.services.first()
        self.assertEqual(service_item.total_price, Decimal("90.00"))

        product_item = order.products.first()
        self.assertEqual(product_item.total_price, Decimal("75.00"))

        self.assertEqual(order.total_price, Decimal("165.00"))
        self.assertEqual(order.number, 1)
        self.assertEqual(order.created_by, self.admin)

    def test_create_without_items(self):
        response = self.client.post(
            OS_URL,
            self.payload(services=[], products=[]),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        order = ServiceOrder.objects.get()
        self.assertEqual(order.total_price, Decimal("0.00"))

    def test_total_price_from_payload_is_ignored(self):
        response = self.client.post(
            OS_URL,
            self.payload(services=[], products=[], total_price="999.00"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(ServiceOrder.objects.get().total_price, Decimal("0.00"))

    def test_vehicle_of_another_client_rejected(self):
        other_client = Client.objects.create(
            workshop=self.workshop,
            name="Maria Souza",
            document="11122233344",
        )
        response = self.client.post(
            OS_URL,
            self.payload(client_id=str(other_client.id)),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_vehicle_of_another_workshop_rejected(self):
        foreign_client = Client.objects.create(
            workshop=self.other_workshop,
            name="Cliente Fora",
            document="99999999999",
        )
        foreign_vehicle = Vehicle.objects.create(
            workshop=self.other_workshop,
            owner=foreign_client,
            brand="Fiat",
            model="Uno",
            license_plate="XYZ9Z99",
        )

        response = self.client.post(
            OS_URL,
            self.payload(vehicle_id=str(foreign_vehicle.id)),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_service_item_without_service_or_name_rejected(self):
        response = self.client.post(
            OS_URL,
            self.payload(services=[{"price": "100.00"}], products=[]),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_discount_greater_than_price_rejected(self):
        response = self.client.post(
            OS_URL,
            self.payload(
                services=[{"service_name": "Troca", "price": "50.00", "discount": "80.00"}],
                products=[],
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_product_quantity_less_than_one_rejected(self):
        response = self.client.post(
            OS_URL,
            self.payload(
                services=[],
                products=[{"product_id": str(self.product.id), "quantity": 0, "price": "40.00"}],
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_catalog_service(self):
        response = self.client.post(
            OS_URL,
            self.payload(
                services=[{"service_id": str(self.catalog_service.id), "price": "80.00"}],
                products=[],
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        order = ServiceOrder.objects.get()
        item = order.services.get()
        self.assertEqual(item.service, self.catalog_service)
        self.assertEqual(order.total_price, Decimal("80.00"))

    def test_duplicate_service_by_name_rejected(self):
        response = self.client.post(
            OS_URL,
            self.payload(
                services=[
                    {"service_name": "Troca de óleo e filtro", "price": "100.00"},
                    {"service_name": "Troca de óleo e filtro", "price": "100.00"},
                ],
                products=[],
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mechanic_cannot_create_service_order(self):
        self.client.force_authenticate(self.mechanic_user)
        response = self.client.post(OS_URL, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_service_items_rejected(self):
        response = self.client.post(
            OS_URL,
            self.payload(
                services=[
                    {"service_id": str(self.catalog_service.id), "price": "80.00"},
                    {"service_id": str(self.catalog_service.id), "price": "80.00"},
                ],
                products=[],
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_number_is_sequential_per_workshop(self):
        self.client.post(OS_URL, self.payload(), format="json")
        self.client.post(OS_URL, self.payload(), format="json")

        other_admin = User.objects.create_user(
            email="admin@outra.com",
            password="senhaForte123",
            full_name="Admin B",
            role=Role.ADMIN,
            workshop=self.other_workshop,
        )
        other_client = Client.objects.create(
            workshop=self.other_workshop,
            name="Cliente Fora",
        )
        other_vehicle = Vehicle.objects.create(
            workshop=self.other_workshop,
            owner=other_client,
            brand="Fiat",
            model="Uno",
            license_plate="XYZ9Z99",
        )

        self.client.force_authenticate(other_admin)
        response = self.client.post(
            OS_URL,
            {
                "client_id": str(other_client.id),
                "vehicle_id": str(other_vehicle.id),
                "services": [],
                "products": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(
            list(
                ServiceOrder.objects.filter(workshop=self.workshop)
                .values_list("number", flat=True)
                .order_by("number")
            ),
            [1, 2],
        )
        self.assertEqual(
            ServiceOrder.objects.get(workshop=self.other_workshop).number, 1
        )


class ServiceOrderUpdateTests(ServiceOrderBaseTestCase):
    def create_order(self):
        response = self.client.post(OS_URL, self.payload(), format="json")
        return response.data["id"]

    def test_update_replaces_items_and_recalculates_total(self):
        order_id = self.create_order()

        response = self.client.patch(
            f"{OS_URL}{order_id}/",
            {
                "services": [
                    {"service_id": str(self.catalog_service.id), "price": "80.00", "discount": "0.00"}
                ],
                "products": [
                    {"product_id": str(self.product.id), "quantity": 1, "price": "40.00", "discount": "0.00"}
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        order = ServiceOrder.objects.get(id=order_id)
        self.assertEqual(order.services.count(), 1)
        self.assertEqual(order.products.count(), 1)
        self.assertEqual(order.total_price, Decimal("120.00"))

    def test_patch_only_services_keeps_products(self):
        order_id = self.create_order()

        response = self.client.patch(
            f"{OS_URL}{order_id}/",
            {"services": [{"service_name": "Troca de óleo e filtro", "price": "50.00"}]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        order = ServiceOrder.objects.get(id=order_id)
        self.assertEqual(order.products.count(), 1)
        self.assertEqual(order.total_price, Decimal("125.00"))

    def test_patch_only_products_keeps_services(self):
        order_id = self.create_order()

        response = self.client.patch(
            f"{OS_URL}{order_id}/",
            {"products": [{"product_id": str(self.product.id), "quantity": 1, "price": "40.00"}]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        order = ServiceOrder.objects.get(id=order_id)
        self.assertEqual(order.services.count(), 1)
        self.assertEqual(order.total_price, Decimal("130.00"))

    def test_update_without_items_keeps_existing(self):
        order_id = self.create_order()

        response = self.client.patch(
            f"{OS_URL}{order_id}/",
            {"description": "Descrição atualizada"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        order = ServiceOrder.objects.get(id=order_id)
        self.assertEqual(order.services.count(), 1)
        self.assertEqual(order.total_price, Decimal("165.00"))
        self.assertEqual(order.description, "Descrição atualizada")

    def test_update_ignores_total_price_from_payload(self):
        order_id = self.create_order()

        response = self.client.patch(
            f"{OS_URL}{order_id}/",
            {"total_price": "9999.00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(ServiceOrder.objects.get(id=order_id).total_price, Decimal("165.00"))

    def test_mechanic_cannot_edit_items(self):
        order_id = self.create_order()
        self.client.force_authenticate(self.mechanic_user)

        response = self.client.patch(
            f"{OS_URL}{order_id}/",
            {"services": []},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_mechanic_can_update_observations(self):
        order_id = self.create_order()
        self.client.force_authenticate(self.mechanic_user)

        response = self.client.patch(
            f"{OS_URL}{order_id}/",
            {"observations": "Aguardando autorização do cliente"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            ServiceOrder.objects.get(id=order_id).observations,
            "Aguardando autorização do cliente",
        )


class ServiceOrderStatusTests(ServiceOrderBaseTestCase):
    def create_order(self):
        response = self.client.post(OS_URL, self.payload(), format="json")
        return ServiceOrder.objects.get(id=response.data["id"])

    def test_valid_transition(self):
        order = self.create_order()

        response = self.client.post(
            f"{OS_URL}{order.id}/change-status/",
            {"status": ServiceOrder.Status.IN_PROGRESS},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        order.refresh_from_db()
        self.assertEqual(order.status, ServiceOrder.Status.IN_PROGRESS)

    def test_open_to_done_is_rejected(self):
        order = self.create_order()

        response = self.client.post(
            f"{OS_URL}{order.id}/change-status/",
            {"status": ServiceOrder.Status.DONE},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_done_sets_closed_at_and_is_terminal(self):
        order = self.create_order()
        order.status = ServiceOrder.Status.IN_PROGRESS
        order.save()

        response = self.client.post(
            f"{OS_URL}{order.id}/change-status/",
            {"status": ServiceOrder.Status.DONE},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        order.refresh_from_db()
        self.assertIsNotNone(order.closed_at)

        response = self.client.post(
            f"{OS_URL}{order.id}/change-status/",
            {"status": ServiceOrder.Status.IN_PROGRESS},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_status_rejected(self):
        order = self.create_order()

        response = self.client.post(
            f"{OS_URL}{order.id}/change-status/",
            {"status": "QUALQUER"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mechanic_can_change_status(self):
        order = self.create_order()
        self.client.force_authenticate(self.mechanic_user)

        response = self.client.post(
            f"{OS_URL}{order.id}/change-status/",
            {"status": ServiceOrder.Status.IN_PROGRESS},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)


class ServiceOrderAccessTests(ServiceOrderBaseTestCase):
    def test_page_size_param_is_respected(self):
        for _ in range(3):
            self.client.post(OS_URL, self.payload(), format="json")

        response = self.client.get(OS_URL, {"page_size": 2})
        self.assertEqual(len(response.data["results"]), 2)
        self.assertEqual(response.data["count"], 3)

    def test_list_scoped_by_workshop(self):
        self.client.post(OS_URL, self.payload(), format="json")

        other_admin = User.objects.create_user(
            email="admin@outra.com",
            password="senhaForte123",
            full_name="Admin B",
            role=Role.ADMIN,
            workshop=self.other_workshop,
        )
        self.client.force_authenticate(other_admin)
        response = self.client.get(OS_URL)

        self.assertEqual(response.data["count"], 0)

    def test_retrieve_from_other_workshop_returns_404(self):
        response = self.client.post(OS_URL, self.payload(), format="json")
        order_id = response.data["id"]

        other_admin = User.objects.create_user(
            email="admin@outra.com",
            password="senhaForte123",
            full_name="Admin B",
            role=Role.ADMIN,
            workshop=self.other_workshop,
        )
        self.client.force_authenticate(other_admin)
        response = self.client.get(f"{OS_URL}{order_id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_restricted_to_admin_or_manager(self):
        response = self.client.post(OS_URL, self.payload(), format="json")
        order_id = response.data["id"]

        self.client.force_authenticate(self.mechanic_user)
        response = self.client.delete(f"{OS_URL}{order_id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.admin)
        response = self.client.delete(f"{OS_URL}{order_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class ServiceOrderStockIntegrationTests(ServiceOrderBaseTestCase):
    def test_create_order_deducts_product_stock(self):
        response = self.client.post(OS_URL, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 13)  # 15 - 2

        movements = self.product.stock_movements.all()
        self.assertEqual(movements.count(), 1)
        self.assertEqual(movements.first().quantity, -2)

    def test_oversell_rejected(self):
        response = self.client.post(
            OS_URL,
            self.payload(
                services=[],
                products=[{"product_id": str(self.product.id), "quantity": 999, "price": "40.00"}],
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 15)

    def test_replace_products_returns_and_deducts_stock(self):
        response = self.client.post(OS_URL, self.payload(), format="json")
        order_id = response.data["id"]

        response = self.client.patch(
            f"{OS_URL}{order_id}/",
            {
                "products": [
                    {"product_id": str(self.product.id), "quantity": 1, "price": "40.00"}
                ]
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 14)  # devolve 2, baixa 1

    def test_cancel_order_returns_stock(self):
        response = self.client.post(OS_URL, self.payload(), format="json")
        order_id = response.data["id"]

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 13)

        response = self.client.post(
            f"{OS_URL}{order_id}/change-status/",
            {"status": "IN_PROGRESS"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        response = self.client.post(
            f"{OS_URL}{order_id}/change-status/",
            {"status": "CANCELLED"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 15)

    def test_delete_order_returns_stock(self):
        response = self.client.post(OS_URL, self.payload(), format="json")
        order_id = response.data["id"]

        response = self.client.delete(f"{OS_URL}{order_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 15)


class ServiceOrderPaymentTests(ServiceOrderBaseTestCase):
    def create_order(self):
        response = self.client.post(OS_URL, self.payload(), format="json")
        return response.data["id"]

    def test_register_payment_and_balance(self):
        order_id = self.create_order()

        response = self.client.post(
            f"{OS_URL}{order_id}/payments/",
            {"method": "PIX", "amount": "100.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        response = self.client.get(f"{OS_URL}{order_id}/")
        self.assertEqual(response.data["paid_total"], "100.00")
        self.assertEqual(response.data["balance"], "65.00")  # 165 - 100

    def test_payment_amount_must_be_positive(self):
        order_id = self.create_order()

        response = self.client.post(
            f"{OS_URL}{order_id}/payments/",
            {"method": "PIX", "amount": "0.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_blocked_on_cancelled_order(self):
        order_id = self.create_order()
        self.client.post(
            f"{OS_URL}{order_id}/change-status/", {"status": "CANCELLED"}, format="json"
        )

        response = self.client.post(
            f"{OS_URL}{order_id}/payments/",
            {"method": "CASH", "amount": "50.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refund_payment_restricted(self):
        order_id = self.create_order()
        response = self.client.post(
            f"{OS_URL}{order_id}/payments/",
            {"method": "CASH", "amount": "50.00"},
            format="json",
        )
        payment_id = response.data["id"]

        self.client.force_authenticate(self.mechanic_user)
        response = self.client.delete(f"{OS_URL}{order_id}/payments/{payment_id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.admin)
        response = self.client.delete(f"{OS_URL}{order_id}/payments/{payment_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_cash_register_summary(self):
        order_id = self.create_order()
        self.client.post(
            f"{OS_URL}{order_id}/payments/",
            {"method": "PIX", "amount": "100.00"},
            format="json",
        )
        self.client.post(
            f"{OS_URL}{order_id}/payments/",
            {"method": "CASH", "amount": "50.00"},
            format="json",
        )

        response = self.client.get("/api/cash-register/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["total"], "150.00")
        self.assertEqual(response.data["payments_count"], 2)
        methods = {item["method"]: item["total"] for item in response.data["methods"]}
        self.assertEqual(methods["PIX"], "100.00")
        self.assertEqual(methods["CASH"], "50.00")

    def test_status_change_records_event(self):
        order_id = self.create_order()
        self.client.post(
            f"{OS_URL}{order_id}/change-status/", {"status": "IN_PROGRESS"}, format="json"
        )

        response = self.client.get(f"{OS_URL}{order_id}/")
        events = response.data["events"]
        self.assertGreaterEqual(len(events), 2)  # criação + transição
        self.assertEqual(events[0]["to_status"], "OPEN")
        self.assertEqual(events[-1]["to_status"], "IN_PROGRESS")

    def test_closed_order_items_cannot_change(self):
        order_id = self.create_order()
        self.client.post(
            f"{OS_URL}{order_id}/change-status/", {"status": "IN_PROGRESS"}, format="json"
        )
        self.client.post(
            f"{OS_URL}{order_id}/change-status/", {"status": "DONE"}, format="json"
        )

        response = self.client.patch(
            f"{OS_URL}{order_id}/",
            {"products": []},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_odometer_saves(self):
        order_id = self.create_order()
        response = self.client.patch(
            f"{OS_URL}{order_id}/",
            {"odometer": 120000},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["odometer"], 120000)

    def test_vehicle_history_endpoint(self):
        self.create_order()
        response = self.client.get(f"/api/vehicles/{self.vehicle.id}/service-orders/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["number"], 1)


class ServiceOrderStockReleaseIdempotencyTests(ServiceOrderBaseTestCase):
    def create_order(self):
        response = self.client.post(OS_URL, self.payload(), format="json")
        return ServiceOrder.objects.get(id=response.data["id"])

    def test_cancel_then_delete_returns_stock_only_once(self):
        order = self.create_order()
        self.client.post(
            f"{OS_URL}{order.id}/change-status/", {"status": "IN_PROGRESS"}, format="json"
        )
        self.client.post(
            f"{OS_URL}{order.id}/change-status/", {"status": "CANCELLED"}, format="json"
        )

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 15)

        response = self.client.delete(f"{OS_URL}{order.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 15)

    def test_delete_done_order_does_not_return_stock(self):
        order = self.create_order()
        self.client.post(
            f"{OS_URL}{order.id}/change-status/", {"status": "IN_PROGRESS"}, format="json"
        )
        self.client.post(
            f"{OS_URL}{order.id}/change-status/", {"status": "DONE"}, format="json"
        )

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 13)

        response = self.client.delete(f"{OS_URL}{order.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 13)

    def test_delete_order_with_payments_rejected(self):
        order = self.create_order()
        self.client.post(
            f"{OS_URL}{order.id}/payments/",
            {"method": "CASH", "amount": "10.00"},
            format="json",
        )

        response = self.client.delete(f"{OS_URL}{order.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertTrue(ServiceOrder.objects.filter(id=order.id).exists())
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 13)

    def test_payment_above_balance_rejected(self):
        order = self.create_order()

        response = self.client.post(
            f"{OS_URL}{order.id}/payments/",
            {"method": "CASH", "amount": "9999.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_registers_event(self):
        order = self.create_order()
        self.client.post(
            f"{OS_URL}{order.id}/payments/",
            {"method": "PIX", "amount": "10.00"},
            format="json",
        )

        response = self.client.get(f"{OS_URL}{order.id}/")
        descriptions = [event["description"] for event in response.data["events"]]
        self.assertTrue(any("Pagamento" in item for item in descriptions))
