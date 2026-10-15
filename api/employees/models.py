from django.db import models
from django.db.models import Q
from core.models import BaseModel, Address, Workshop
from phonenumber_field.modelfields import PhoneNumberField


class Employee(BaseModel):
    workshop = models.ForeignKey(
        Workshop,
        on_delete=models.PROTECT,
        related_name='employees',
        verbose_name='Oficina',
    )
    name = models.CharField(max_length=155)
    phone = PhoneNumberField(blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    address = models.OneToOneField(
        Address,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='employee',
    )

    document_cpf = models.CharField(max_length=18, null=True, blank=True, verbose_name='CPF')
    document_rg = models.CharField(max_length=18, null=True, blank=True, verbose_name='RG')

    class Meta(BaseModel.Meta):
        verbose_name = 'Funcionário'
        verbose_name_plural = 'Funcionários'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['workshop', 'document_cpf'],
                condition=Q(is_active=True) & ~Q(document_cpf=None) & ~Q(document_cpf=''),
                name='uniq_employee_cpf_per_workshop',
            ),
            models.UniqueConstraint(
                fields=['workshop', 'document_rg'],
                condition=Q(is_active=True) & ~Q(document_rg=None) & ~Q(document_rg=''),
                name='uniq_employee_rg_per_workshop',
            ),
        ]

    def __str__(self):
        return f'{self.name} ({self.document_cpf})' if self.document_cpf else self.name
