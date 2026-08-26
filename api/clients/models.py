from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from core.models import BaseModel, Address
# Create your models here.

class Client(BaseModel):
    class PersonType(models.TextChoices):
        FISICA = 'PF', 'Pessoa Física (CPF)'
        JURIDICA = 'PJ', 'Pessoa Jurídica (CNPJ)'
    
    person_type = models.CharField(choices=PersonType, max_length=2, default=PersonType.FISICA, verbose_name='Tipo de Cliente')
    name = models.CharField(max_length=155)
    phone = PhoneNumberField(blank=True)
    email = models.EmailField(max_length=254)
    address = models.ForeignKey(Address, on_delete=models.CASCADE)
    
    document = models.CharField(max_length=18, unique=True, null=True, verbose_name='CPF / CNPJ')
    responsible = models.CharField(max_length=155, blank=True, null=True, verbose_name='Responsável / Frotista')

    def __str__(self):
        return f'{self.name} ({self.document})'