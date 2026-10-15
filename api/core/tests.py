from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from clients.models import Client
from core.models import Workshop
from products.models import Product
from service_order.models import ServiceOrder
from users.models import User, Role
from vehicles.models import Vehicle

DASHBOARD_URL = "/api/dashboard/"


class DashboardTests(APITestCase):
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
        self.client.force_authenticate(self.admin)

        client_obj = Client.objects.create(workshop=self.workshop, name="João")
        vehicle = Vehicle.objects.create(
            workshop=self.workshop, owner=client_obj, brand="VW", model="Gol", license_plate="BRA2E19"
        )
        ServiceOrder.objects.create(
            workshop=self.workshop, client=client_obj, vehicle=vehicle,
            total_price=Decimal("150.00"),
        )
        ServiceOrder.objects.create(
            workshop=self.workshop, client=client_obj, vehicle=vehicle,
            status=ServiceOrder.Status.IN_PROGRESS, total_price=Decimal("200.00"),
        )
        done = ServiceOrder.objects.create(
            workshop=self.workshop, client=client_obj, vehicle=vehicle,
            status=ServiceOrder.Status.IN_PROGRESS, total_price=Decimal("300.00"),
        )
        done.status = ServiceOrder.Status.DONE
        done.save()

        Product.objects.create(
            workshop=self.workshop, name="Filtro", cost_price=10, sale_price=20,
            stock_quantity=2, min_stock_quantity=5,
        )
        Product.objects.create(
            workshop=self.workshop, name="Óleo", cost_price=10, sale_price=20,
            stock_quantity=50, min_stock_quantity=5,
        )

        other_client = Client.objects.create(workshop=self.other_workshop, name="Fora")
        other_vehicle = Vehicle.objects.create(
            workshop=self.other_workshop, owner=other_client, brand="Fiat", model="Uno", license_plate="XYZ9Z99"
        )
        ServiceOrder.objects.create(
            workshop=self.other_workshop, client=other_client, vehicle=other_vehicle,
            total_price=Decimal("999.00"),
        )

    def test_dashboard_counts_and_revenue(self):
        response = self.client.get(DASHBOARD_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        counts = response.data["counts"]
        self.assertEqual(counts["open_service_orders"], 1)
        self.assertEqual(counts["in_progress_service_orders"], 1)
        self.assertEqual(counts["done_this_month"], 1)
        self.assertEqual(counts["clients"], 1)
        self.assertEqual(counts["vehicles"], 1)
        self.assertEqual(response.data["revenue_this_month"], "300.00")

    def test_dashboard_low_stock_only_low_products(self):
        response = self.client.get(DASHBOARD_URL)

        names = [item["name"] for item in response.data["low_stock_products"]]
        self.assertIn("Filtro", names)
        self.assertNotIn("Óleo", names)

    def test_dashboard_recent_orders_scoped_by_workshop(self):
        response = self.client.get(DASHBOARD_URL)

        numbers = [item["number"] for item in response.data["recent_service_orders"]]
        self.assertEqual(len(numbers), 3)

        plates = {item["vehicle_plate"] for item in response.data["recent_service_orders"]}
        self.assertNotIn("XYZ9Z99", plates)

    def test_dashboard_requires_authentication(self):
        self.client.force_authenticate(None)
        response = self.client.get(DASHBOARD_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_for_user_without_workshop(self):
        nomad = User.objects.create_user(
            email="semoficina@teste.com",
            password="senhaForte123",
            full_name="Sem Oficina",
            workshop=None,
        )
        self.client.force_authenticate(nomad)
        response = self.client.get(DASHBOARD_URL)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ReportsTests(APITestCase):
    def setUp(self):
        self.workshop = Workshop.objects.create(name="Oficina A")
        self.admin = User.objects.create_user(
            email="admin@oficina.com",
            password="senhaForte123",
            full_name="Admin",
            role=Role.ADMIN,
            workshop=self.workshop,
        )
        self.client.force_authenticate(self.admin)

        client_obj = Client.objects.create(workshop=self.workshop, name="João")
        vehicle = Vehicle.objects.create(
            workshop=self.workshop, owner=client_obj, brand="VW", model="Gol", license_plate="BRA2E19"
        )
        self.order = ServiceOrder.objects.create(
            workshop=self.workshop, client=client_obj, vehicle=vehicle,
            status=ServiceOrder.Status.DONE, total_price=Decimal("500.00"),
        )

    def test_reports_summary(self):
        response = self.client.get("/api/reports/")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["summary"]["orders"], 1)
        self.assertEqual(response.data["summary"]["done_orders"], 1)
        self.assertEqual(response.data["summary"]["revenue_done"], "500.00")

    def test_reports_period_filter(self):
        response = self.client.get(
            "/api/reports/", {"date_from": "2000-01-01", "date_to": "2000-01-31"}
        )
        self.assertEqual(response.data["summary"]["orders"], 0)

    def test_reports_invalid_date(self):
        response = self.client.get("/api/reports/", {"date_from": "invalida"})
        self.assertEqual(response.status_code, 400)

    def test_reports_scoped_by_workshop(self):
        other_workshop = Workshop.objects.create(name="Outra")
        User.objects.create_user(
            email="fora@teste.com", password="senhaForte123",
            full_name="Fora", role=Role.ADMIN, workshop=other_workshop,
        )
        other_admin = User.objects.get(email="fora@teste.com")
        self.client.force_authenticate(other_admin)
        response = self.client.get("/api/reports/")
        self.assertEqual(response.data["summary"]["orders"], 0)


class ReportsTotalsTests(APITestCase):
    def setUp(self):
        self.workshop = Workshop.objects.create(name="Oficina A")
        self.admin = User.objects.create_user(
            email="admin@oficina.com",
            password="senhaForte123",
            full_name="Admin",
            role=Role.ADMIN,
            workshop=self.workshop,
        )
        self.client.force_authenticate(self.admin)

    def test_top_items_use_quantity_and_discount(self):
        from products.models import Product
        from service_order.models import ServiceOrderProduct

        client_obj = Client.objects.create(workshop=self.workshop, name="João")
        vehicle = Vehicle.objects.create(
            workshop=self.workshop, owner=client_obj, brand="VW", model="Gol", license_plate="BRA2E19"
        )
        product = Product.objects.create(
            workshop=self.workshop, name="Filtro", cost_price=10, sale_price=20
        )
        order = ServiceOrder.objects.create(
            workshop=self.workshop, client=client_obj, vehicle=vehicle,
            status=ServiceOrder.Status.DONE,
        )
        # 2 x 40 - 5 = 75 (e não apenas 40)
        ServiceOrderProduct.objects.create(
            service_order=order, product=product, quantity=2,
            price=Decimal("40.00"), discount=Decimal("5.00"),
        )

        response = self.client.get("/api/reports/")
        top = response.data["top_products"][0]
        self.assertEqual(top["name"], "Filtro")
        self.assertEqual(top["quantity"], 2)
        self.assertEqual(top["total"], "75.00")

    def test_cancelled_orders_excluded_from_ranking(self):
        from products.models import Product
        from service_order.models import ServiceOrderProduct

        client_obj = Client.objects.create(workshop=self.workshop, name="João")
        vehicle = Vehicle.objects.create(
            workshop=self.workshop, owner=client_obj, brand="VW", model="Gol", license_plate="BRA2E19"
        )
        product = Product.objects.create(
            workshop=self.workshop, name="Filtro", cost_price=10, sale_price=20
        )
        order = ServiceOrder.objects.create(
            workshop=self.workshop, client=client_obj, vehicle=vehicle,
            status=ServiceOrder.Status.CANCELLED,
        )
        ServiceOrderProduct.objects.create(
            service_order=order, product=product, quantity=5, price=Decimal("20.00"),
        )

        response = self.client.get("/api/reports/")
        self.assertEqual(response.data["top_products"], [])

    def test_reports_requires_admin_or_manager(self):
        attendant = User.objects.create_user(
            email="atendente@teste.com",
            password="senhaForte123",
            full_name="Atendente",
            role=Role.ATTENDANT,
            workshop=self.workshop,
        )
        self.client.force_authenticate(attendant)
        response = self.client.get("/api/reports/")
        self.assertEqual(response.status_code, 403)
