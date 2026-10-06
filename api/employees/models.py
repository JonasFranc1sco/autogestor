from django.db import models
from core.models import BaseModel, Address
from phonenumber_field.modelfields import PhoneNumberField
# Create your models here.


class Employee(BaseModel):
    name = models.CharField(max_length=155)
    phone = PhoneNumberField(blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.CASCADE, blank=True, null=True)
    
    document_cpf = models.CharField(max_length=18, unique=True, null=True, blank=True, verbose_name='CPF')
    document_rg = models.CharField(max_length=18, unique=True, null=True, blank=True, verbose_name='RG')

    def __str__(self):
        return f'{self.name} ({self.document_cpf})'
    