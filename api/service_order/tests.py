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
