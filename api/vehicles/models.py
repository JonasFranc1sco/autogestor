from django.db import models
from django.db.models import Q
from django.core.validators import RegexValidator
from clients.models import Client
from core.models import BaseModel, Workshop


class Vehicle(BaseModel):
    license_plate_validator = RegexValidator(
        regex=r'^(?:[A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2})$',
        message="Placa deve estar no formato ABC1234 (antiga) ou ABC1D23 (Mercosul).",
    )

    workshop = models.ForeignKey(
        Workshop,
        on_delete=models.PROTECT,
        related_name='vehicles',
        verbose_name='Oficina',
    )
    owner = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='vehicles')
    license_plate = models.CharField(
        max_length=7,
        validators=[license_plate_validator],
        blank=True,
        null=True,
        verbose_name='Placa',
    )
    year = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name='Ano')
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=155)
    color = models.CharField(max_length=50, blank=True, null=True)
    chassis = models.CharField(max_length=155, blank=True, null=True)
    mileage = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='Quilometragem')

    class Meta(BaseModel.Meta):
        verbose_name = 'Veículo'
        verbose_name_plural = 'Veículos'
        ordering = ['license_plate']
        constraints = [
            models.UniqueConstraint(
                fields=['workshop', 'license_plate'],
                condition=Q(is_active=True) & ~Q(license_plate=None) & ~Q(license_plate=''),
                name='uniq_vehicle_plate_per_workshop',
            ),
        ]

    def __str__(self):
        return f'{self.brand} {self.model} ({self.license_plate})'
