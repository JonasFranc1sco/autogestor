from django.db import models
from core.models import BaseModel
from django.core.validators import RegexValidator
from phonenumber_field.modelfields import PhoneNumberField
# Create your models here.

class Address(models.Model):
    cep_validator = RegexValidator(
        regex=r'^\d{8}$',
        message="CEP deve conter exatamente 8 digitos."
    )
    
    cep = models.CharField(
        max_length=8,
        validators=[cep_validator],
        help_text="Formato: 76800000"
    )
    street = models.CharField(max_length=255)
    number = models.CharField(max_length=10)
    neighborhood = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    complement = models.TextField(max_length=255)
    
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
    