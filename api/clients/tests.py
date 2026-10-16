from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clients.models import Client
from core.models import Address, Workshop
from users.models import User, Role

CLIENTS_URL = "/api/clients/"


class ClientApiTests(APITestCase):
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
        self.other_user = User.objects.create_user(
            email="admin@outra.com",
            password="senhaForte123",
            full_name="Admin B",
            role=Role.ADMIN,
            workshop=self.other_workshop,
        )
        self.client.force_authenticate(self.admin)

    def payload(self, **overrides):
        data = {
            "person_type": "PF",
            "name": "João Silva",
            "phone": "+5562999990000",
            "email": "joao@teste.com",
            "document": "52998224725",
            "responsible": "",
            "address": {
                "cep": "76800000",
                "street": "Rua Central",
                "number": "10",
                "neighborhood": "Centro",
                "city": "Goiânia",
                "state": "GO",
                "complement": "",
            },
        }
        data.update(overrides)
        return data

    def test_create_client_with_address(self):
        response = self.client.post(CLIENTS_URL, self.payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        client_obj = Client.objects.get(document="52998224725")
        self.assertEqual(client_obj.workshop, self.workshop)
        self.assertEqual(client_obj.address.city, "Goiânia")

    def test_create_client_without_address(self):
        response = self.client.post(
            CLIENTS_URL,
            self.payload(address=None),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIsNone(Client.objects.get(document="52998224725").address)

    def test_update_client_without_address_creates_address(self):
        response = self.client.post(
            CLIENTS_URL,
            self.payload(address=None),
            format="json",
        )
        client_id = response.data["id"]

        response = self.client.patch(
            f"{CLIENTS_URL}{client_id}/",
            {
                "address": {
                    "cep": "74000000",
                    "street": "Rua Nova",
                    "number": "20",
                    "neighborhood": "Setor Oeste",
                    "city": "Goiânia",
                    "state": "GO",
                    "complement": "",
                }
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        client_obj = Client.objects.get(id=client_id)
        self.assertEqual(client_obj.address.street, "Rua Nova")

    def test_list_is_paginated_and_scoped_by_workshop(self):
        self.client.post(CLIENTS_URL, self.payload(), format="json")
        Client.objects.create(
            workshop=self.other_workshop,
            name="Cliente de Outra Oficina",
            document="12345678909",
        )

        response = self.client.get(CLIENTS_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertIn("results", response.data)
        names = {item["name"] for item in response.data["results"]}
        self.assertIn("João Silva", names)
        self.assertNotIn("Cliente de Outra Oficina", names)

    def test_retrieve_from_other_workshop_returns_404(self):
        foreign = Client.objects.create(
            workshop=self.other_workshop,
            name="Cliente de Outra Oficina",
            document="12345678909",
        )

        response = self.client.get(f"{CLIENTS_URL}{foreign.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_search_by_name(self):
        self.client.post(CLIENTS_URL, self.payload(), format="json")
        self.client.post(
            CLIENTS_URL,
            self.payload(name="Maria Souza", document="11144477735", email="maria@teste.com"),
            format="json",
        )

        response = self.client.get(CLIENTS_URL, {"search": "Maria"})

        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Maria Souza")

    def test_delete_is_soft_and_hidden_from_list(self):
        response = self.client.post(CLIENTS_URL, self.payload(), format="json")
        client_id = response.data["id"]

        delete = self.client.delete(f"{CLIENTS_URL}{client_id}/")
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)

        self.assertTrue(Client.objects.get(id=client_id).is_active is False)

        response = self.client.get(CLIENTS_URL)
        self.assertEqual(response.data["count"], 0)

        response = self.client.get(CLIENTS_URL, {"include_inactive": "true"})
        self.assertEqual(response.data["count"], 1)

    def test_document_unique_per_workshop(self):
        self.client.post(CLIENTS_URL, self.payload(), format="json")

        Client.objects.create(
            workshop=self.other_workshop,
            name="Mesmo CPF",
            document="52998224725",
        )
        self.assertEqual(Client.objects.filter(document="52998224725").count(), 2)

    def test_same_document_in_same_workshop_rejected(self):
        self.client.post(CLIENTS_URL, self.payload(), format="json")

        response = self.client.post(CLIENTS_URL, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ClientDocumentValidationTests(APITestCase):
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

    def test_invalid_cpf_check_digits_rejected(self):
        response = self.client.post(
            CLIENTS_URL,
            {"name": "CPF Inválido", "document": "12345678901"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_cpf_accepted_with_mask(self):
        response = self.client.post(
            CLIENTS_URL,
            {"name": "CPF Válido", "document": "529.982.247-25"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_invalid_cnpj_rejected(self):
        response = self.client.post(
            CLIENTS_URL,
            {"name": "Empresa", "person_type": "PJ", "document": "11222333000100"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_cnpj_accepted(self):
        response = self.client.post(
            CLIENTS_URL,
            {"name": "Empresa", "person_type": "PJ", "document": "11.222.333/0001-81"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
