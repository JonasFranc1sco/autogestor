from django.db import models
from core.models import BaseModel, Workshop
from clients.models import Client
from vehicles.models import Vehicle
from employees.models import Employee
from service_order.models import ServiceOrder
from users.models import User


class Appointment(BaseModel):
    """Agendamento de serviço na oficina."""

    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Agendado"
        COMPLETED = "COMPLETED", "Realizado"
        NO_SHOW = "NO_SHOW", "Não compareceu"
        CANCELLED = "CANCELLED", "Cancelado"

    STATUS_TRANSITIONS = {
        Status.SCHEDULED: {Status.COMPLETED, Status.NO_SHOW, Status.CANCELLED},
        Status.COMPLETED: set(),
        Status.NO_SHOW: set(),
        Status.CANCELLED: set(),
    }

    workshop = models.ForeignKey(
        Workshop,
        on_delete=models.PROTECT,
        related_name='appointments',
        verbose_name='Oficina',
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name='appointments',
        verbose_name='Cliente',
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.PROTECT,
        related_name='appointments',
        verbose_name='Veículo',
    )
    mechanic = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='appointments',
        verbose_name='Mecânico',
    )
    service_order = models.ForeignKey(
        ServiceOrder,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='appointments',
        verbose_name='Ordem de Serviço',
    )
    scheduled_at = models.DateTimeField(verbose_name='Data e hora')
    expected_duration_minutes = models.PositiveIntegerField(
        default=60,
        verbose_name='Duração estimada (minutos)',
    )
    description = models.TextField(blank=True, null=True, verbose_name='Descrição')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
        verbose_name='Status',
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='created_appointments',
        verbose_name='Criado por',
    )

    class Meta(BaseModel.Meta):
        verbose_name = 'Agendamento'
        verbose_name_plural = 'Agendamentos'
        ordering = ['scheduled_at']

    def can_transition_to(self, new_status):
        return new_status in self.STATUS_TRANSITIONS.get(self.status, set())

    def __str__(self):
        return f"Agendamento {self.scheduled_at:%d/%m/%Y %H:%M} — {self.client.name}"
