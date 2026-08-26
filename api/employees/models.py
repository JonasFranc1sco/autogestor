from django.db import models
from core.models import BaseModel, Address
from phonenumber_field.modelfields import PhoneNumberField
# Create your models here.


class Employee(BaseModel):
    name = models.CharField(max_length=155)
    phone = PhoneNumberField(blank=True)
    email = models.EmailField(max_length=254)
    address = models.ForeignKey(Address, on_delete=models.CASCADE)
    
    document_cpf = models.CharField(max_length=18, unique=True, null=True, verbose_name='CPF')
    document_rg = models.CharField(max_length=18, unique=True, null=True, verbose_name='RG')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f'{self.name} ({self.document_cpf})'
    