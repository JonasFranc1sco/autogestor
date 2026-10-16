from rest_framework import status
from rest_framework.test import APITestCase

from clients.models import Client
from core.models import Workshop
from users.models import User, Role
from vehicles.models import Vehicle

VEHICLES_URL = "/api/vehicles/"


class VehicleApiTests(APITestCase):
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
        self.client_owner = Client.objects.create(
            workshop=self.workshop,
            name="João Silva",
            document="12345678901",
        )
        self.foreign_client = Client.objects.create(
            workshop=self.other_workshop,
            name="Cliente Fora",
            document="99999999999",
        )
        self.client.force_authenticate(self.admin)

    def payload(self, **overrides):
        data = {
            "owner_id": str(self.client_owner.id),
            "license_plate": "BRA2E19",
            "year": 2020,
            "brand": "Volkswagen",
            "model": "Gol",
            "color": "Prata",
            "chassis": "9BWZZZ377VT004251",
            "mileage": "21000.00",
        }
        data.update(overrides)
        return data

    def test_create_vehicle(self):
        response = self.client.post(VEHICLES_URL, self.payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        vehicle = Vehicle.objects.get(license_plate="BRA2E19")
        self.assertEqual(vehicle.workshop, self.workshop)
        self.assertEqual(vehicle.year, 2020)
        self.assertEqual(str(vehicle.mileage), "21000.00")

    def test_invalid_license_plate_rejected(self):
        response = self.client.post(
            VEHICLES_URL,
            self.payload(license_plate="1234ABC"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mercosul_plate_accepted(self):
        response = self.client.post(
            VEHICLES_URL,
            self.payload(license_plate="BRA2E19"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        response = self.client.post(
            VEHICLES_URL,
            self.payload(license_plate="ABC1D23", owner_id=str(self.client_owner.id)),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_owner_from_other_workshop_rejected(self):
        response = self.client.post(
            VEHICLES_URL,
            self.payload(owner_id=str(self.foreign_client.id)),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_plate_in_workshop_rejected(self):
        self.client.post(VEHICLES_URL, self.payload(), format="json")

        response = self.client.post(VEHICLES_URL, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_scoped_by_workshop(self):
        self.client.post(VEHICLES_URL, self.payload(), format="json")
        Vehicle.objects.create(
            workshop=self.other_workshop,
            owner=self.foreign_client,
            license_plate="XYZ9Z99",
            brand="Fiat",
            model="Uno",
        )

        response = self.client.get(VEHICLES_URL)

        plates = {item["license_plate"] for item in response.data["results"]}
        self.assertIn("BRA2E19", plates)
        self.assertNotIn("XYZ9Z99", plates)
