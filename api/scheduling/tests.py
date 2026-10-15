from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APITestCase

from clients.models import Client
from core.models import Workshop
from scheduling.models import Appointment
from users.models import User, Role
from vehicles.models import Vehicle

APPOINTMENTS_URL = "/api/appointments/"


class AppointmentApiTests(APITestCase):
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
        self.client_obj = Client.objects.create(
            workshop=self.workshop, name="João Silva", document="12345678901"
        )
        self.vehicle = Vehicle.objects.create(
            workshop=self.workshop, owner=self.client_obj,
            brand="VW", model="Gol", license_plate="BRA2E19",
        )
        self.client.force_authenticate(self.admin)

    def payload(self, **overrides):
        data = {
            "client_id": str(self.client_obj.id),
            "vehicle_id": str(self.vehicle.id),
            "scheduled_at": (timezone.now() + timedelta(days=1)).isoformat(),
            "expected_duration_minutes": 60,
            "description": "Troca de óleo",
        }
        data.update(overrides)
        return data

    def test_create_appointment(self):
        response = self.client.post(APPOINTMENTS_URL, self.payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        appointment = Appointment.objects.get()
        self.assertEqual(appointment.workshop, self.workshop)
        self.assertEqual(appointment.status, Appointment.Status.SCHEDULED)

    def test_vehicle_of_another_client_rejected(self):
        other_client = Client.objects.create(
            workshop=self.workshop, name="Maria", document="11122233344"
        )
        response = self.client.post(
            APPOINTMENTS_URL,
            self.payload(client_id=str(other_client.id)),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_transitions(self):
        response = self.client.post(APPOINTMENTS_URL, self.payload(), format="json")
        appointment_id = response.data["id"]

        response = self.client.post(
            f"{APPOINTMENTS_URL}{appointment_id}/change-status/",
            {"status": Appointment.Status.COMPLETED},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        response = self.client.post(
            f"{APPOINTMENTS_URL}{appointment_id}/change-status/",
            {"status": Appointment.Status.SCHEDULED},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_scoped_by_workshop_and_date_filter(self):
        self.client.post(APPOINTMENTS_URL, self.payload(), format="json")

        other_admin = User.objects.create_user(
            email="admin@outra.com",
            password="senhaForte123",
            full_name="Admin B",
            role=Role.ADMIN,
            workshop=self.other_workshop,
        )
        self.client.force_authenticate(other_admin)
        response = self.client.get(APPOINTMENTS_URL)
        self.assertEqual(response.data["count"], 0)

    def test_date_range_filter(self):
        self.client.post(APPOINTMENTS_URL, self.payload(), format="json")

        tomorrow = (timezone.localdate() + timedelta(days=1)).isoformat()
        yesterday = (timezone.localdate() - timedelta(days=1)).isoformat()

        response = self.client.get(
            APPOINTMENTS_URL, {"date_from": tomorrow, "date_to": tomorrow}
        )
        self.assertEqual(response.data["count"], 1)

        response = self.client.get(
            APPOINTMENTS_URL, {"date_from": yesterday, "date_to": yesterday}
        )
        self.assertEqual(response.data["count"], 0)
