from django.db import models
from django.core.validators import RegexValidator
from phonenumber_field.modelfields import PhoneNumberField
from core.models import BaseModel
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
    
class Client(BaseModel):
    class PersonType(models.TextChoices):
        FISICA = 'PF', 'Pessoa Física (CPF)'
        JURIDICA = 'PJ', 'Pessoa Jurídica (CNPJ)'
    
    person_type = models.CharField(choices=PersonType, max_length=2, default=PersonType.FISICA, verbose_name='Tipo de Cliente')
    name = models.CharField(max_length=155)
    phone = PhoneNumberField(blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=254)
    address = models.ForeignKey(Address, on_delete=models.CASCADE)
    
    document = models.CharField(max_length=18, unique=True, null=True, verbose_name='CPF / CNPJ')
    responsible = models.CharField(max_length=155, blank=True, null=True, verbose_name='Responsável / Frotista')

    def __str__(self):
        return f'{self.name} ({self.document})'