from django.db import models
from core.models import BaseModel
from clients.models import Client
from vehicles.models import Vehicle
from employees.models import Employee


class ServiceOrder(BaseModel):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Aberta"
        IN_PROGRESS = "IN_PROGRESS", "Em andamento"
        WAITING_PARTS = "WAITING_PARTS", "Aguardando peças"
        WAITING_CLIENT = "WAITING_CLIENT", "Aguardando cliente"
        DONE = "DONE", "Concluída"
        CANCELLED = "CANCELLED", "Cancelada"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="service_orders")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="service_orders")
    mechanic = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="service_orders")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    description = models.TextField(blank=True, null=True, help_text="Descrição do serviço solicitado")
    observations = models.TextField(blank=True, null=True, help_text="Observações internas")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Valor total do serviço")

    def __str__(self):
        return f"OS — {self.client.name}"
