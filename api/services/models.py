from decimal import Decimal 
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from core.models import BaseModel, Workshop
from employees.models import Employee


class Service(BaseModel):
    workshop = models.ForeignKey(
        Workshop,
        on_delete=models.PROTECT,
        related_name='services',
        verbose_name='Oficina',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='services')

    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(Decimal("0.00"))], help_text="Preço de custo pago ao funcionário")
    margin_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))], default=0, help_text="Margem desejada em %")
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))], default=0, help_text="Preço final do valor do serviço")
    warranty_days = models.PositiveIntegerField(
        default=90, blank=True, null=True,
        help_text="Garantia do serviço em dias (0 ou vazio = sem garantia)",
    )

    class Meta(BaseModel.Meta):
        verbose_name = 'Serviço'
        verbose_name_plural = 'Serviços'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['workshop', 'name'],
                condition=Q(is_active=True),
                name='uniq_service_name_per_workshop',
            ),
            models.CheckConstraint(
                condition=Q(cost_price__gte=0) & Q(sale_price__gte=0) & Q(margin_percentage__gte=0),
                name='service_prices_non_negative',
            ),
        ]

    def __str__(self):
        return self.name
