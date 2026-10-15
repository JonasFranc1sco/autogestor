import uuid
from django.db import models
from django.core.validators import RegexValidator
from phonenumber_field.modelfields import PhoneNumberField


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True


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
    complement = models.TextField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.street}, {self.number} — {self.city}/{self.state}"


class Workshop(BaseModel):
    class Meta(BaseModel.Meta):
        verbose_name = 'Oficina'
        verbose_name_plural = 'Oficinas'
        ordering = ['name']

    name = models.CharField('Nome da oficina', max_length=155)
    cnpj = models.CharField('CNPJ', max_length=18, unique=True, blank=True, null=True)
    phone = PhoneNumberField(blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    address = models.OneToOneField(
        Address,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='workshop',
    )

    def __str__(self):
        return self.name
