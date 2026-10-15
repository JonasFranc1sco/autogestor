from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Workshop
from employees.models import Employee
from users.models import User, Role

EMPLOYEES_URL = "/api/employees/"


class EmployeeApiTests(APITestCase):
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
        self.attendant = User.objects.create_user(
            email="atendente@oficina.com",
            password="senhaForte123",
            full_name="Atendente",
            role=Role.ATTENDANT,
            workshop=self.workshop,
        )
        self.client.force_authenticate(self.admin)

    def payload(self, **overrides):
        data = {
            "name": "Marcos Silva",
            "phone": "+5562999990000",
            "email": "marcos@teste.com",
            "document_cpf": "12345678901",
            "document_rg": "1234567",
            "address": None,
        }
        data.update(overrides)
        return data

    def test_create_employee(self):
        response = self.client.post(EMPLOYEES_URL, self.payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        employee = Employee.objects.get(document_cpf="12345678901")
        self.assertEqual(employee.workshop, self.workshop)

    def test_attendant_cannot_create_employee(self):
        self.client.force_authenticate(self.attendant)
        response = self.client.post(EMPLOYEES_URL, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_cpf_rejected(self):
        self.client.post(EMPLOYEES_URL, self.payload(), format="json")

        response = self.client.post(EMPLOYEES_URL, self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_scoped_by_workshop(self):
        self.client.post(EMPLOYEES_URL, self.payload(), format="json")
        Employee.objects.create(
            workshop=self.other_workshop,
            name="Funcionário Fora",
        )

        response = self.client.get(EMPLOYEES_URL)

        names = {item["name"] for item in response.data["results"]}
        self.assertIn("Marcos Silva", names)
        self.assertNotIn("Funcionário Fora", names)

    def test_soft_delete(self):
        response = self.client.post(EMPLOYEES_URL, self.payload(), format="json")
        employee_id = response.data["id"]

        delete = self.client.delete(f"{EMPLOYEES_URL}{employee_id}/")
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)

        response = self.client.get(EMPLOYEES_URL)
        self.assertEqual(response.data["count"], 0)
        self.assertTrue(Employee.objects.get(id=employee_id).is_active is False)
