from django.db import models
from django.db.models import Q
from phonenumber_field.modelfields import PhoneNumberField
from core.models import BaseModel, Address, Workshop


class Client(BaseModel):
    class PersonType(models.TextChoices):
        FISICA = 'PF', 'Pessoa Física (CPF)'
        JURIDICA = 'PJ', 'Pessoa Jurídica (CNPJ)'

    workshop = models.ForeignKey(
        Workshop,
        on_delete=models.PROTECT,
        related_name='clients',
        verbose_name='Oficina',
    )
    person_type = models.CharField(choices=PersonType, max_length=2, default=PersonType.FISICA, verbose_name='Tipo de Cliente')
    name = models.CharField(max_length=155)
    phone = PhoneNumberField(blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    address = models.OneToOneField(
        Address,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='client',
    )

    document = models.CharField(max_length=18, blank=True, null=True, verbose_name='CPF / CNPJ')
    responsible = models.CharField(max_length=155, blank=True, null=True, verbose_name='Responsável / Frotista')

    class Meta(BaseModel.Meta):
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['workshop', 'document'],
                condition=Q(is_active=True) & ~Q(document=None) & ~Q(document=''),
                name='uniq_client_document_per_workshop',
            ),
        ]

    def __str__(self):
        return f'{self.name} ({self.document})' if self.document else self.name
