from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Workshop
from products.models import Product
from users.models import User, Role

PRODUCTS_URL = "/api/products/"


class ProductApiTests(APITestCase):
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
        self.mechanic = User.objects.create_user(
            email="mecanico@oficina.com",
            password="senhaForte123",
            full_name="Mecânico",
            role=Role.MECHANIC,
            workshop=self.workshop,
        )
        self.client.force_authenticate(self.admin)

    def payload(self, **overrides):
        data = {
            "name": "Filtro de Óleo",
            "reference_code": "FO-001",
            "barcode": "7891234567890",
            "description": "Filtro de óleo padrão",
            "application": "Gol 2010-2020",
            "supplier": "Fornecedor X",
            "brand": "Marca Y",
            "cost_price": "20.00",
            "margin_percentage": "100.00",
            "sale_price": "40.00",
            "stock_quantity": 15,
            "min_stock_quantity": 5,
            "location": "Corredor A",
        }
        data.update(overrides)
        return data

    def test_create_product(self):
        response = self.client.post(PRODUCTS_URL, self.payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        product = Product.objects.get(barcode="7891234567890")
        self.assertEqual(product.workshop, self.workshop)

    def test_negative_stock_rejected(self):
        response = self.client.post(
            PRODUCTS_URL,
            self.payload(stock_quantity=-5),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cost_hidden_for_mechanic(self):
        response = self.client.post(PRODUCTS_URL, self.payload(), format="json")
        product_id = response.data["id"]

        self.client.force_authenticate(self.mechanic)
        response = self.client.get(f"{PRODUCTS_URL}{product_id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("cost_price", response.data)
        self.assertNotIn("margin_percentage", response.data)
        self.assertIn("sale_price", response.data)

    def test_cost_visible_for_admin(self):
        response = self.client.post(PRODUCTS_URL, self.payload(), format="json")

        self.assertIn("cost_price", response.data)

    def test_duplicate_barcode_in_workshop_rejected(self):
        self.client.post(PRODUCTS_URL, self.payload(), format="json")

        response = self.client.post(PRODUCTS_URL, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_same_barcode_allowed_in_other_workshop(self):
        self.client.post(PRODUCTS_URL, self.payload(), format="json")

        Product.objects.create(
            workshop=self.other_workshop,
            name="Filtro de Outra Oficina",
            barcode="7891234567890",
            cost_price=10,
            sale_price=20,
        )
        self.assertEqual(Product.objects.filter(barcode="7891234567890").count(), 2)

    def test_list_scoped_by_workshop(self):
        self.client.post(PRODUCTS_URL, self.payload(), format="json")
        Product.objects.create(
            workshop=self.other_workshop,
            name="Produto Fora",
            cost_price=10,
            sale_price=20,
        )

        response = self.client.get(PRODUCTS_URL)

        names = {item["name"] for item in response.data["results"]}
        self.assertIn("Filtro de Óleo", names)
        self.assertNotIn("Produto Fora", names)

    def test_soft_delete_hides_product(self):
        response = self.client.post(PRODUCTS_URL, self.payload(), format="json")
        product_id = response.data["id"]

        delete = self.client.delete(f"{PRODUCTS_URL}{product_id}/")
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)

        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.data["count"], 0)
