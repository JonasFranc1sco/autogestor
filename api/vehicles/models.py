from django.db import models
from clients.models import Client
from core.models import BaseModel

# Create your models here.
class Vehicle(BaseModel):
    owner = models.ForeignKey(Client, on_delete=models.CASCADE)
    license_plate = models.CharField(max_length=7, blank=True, null=True)
    year = models.DecimalField(max_digits=10, decimal_places=1, blank=True, null=True)
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=155)
    color = models.CharField(max_length=50, blank=True, null=True)
    chassis = models.CharField(max_length=155, blank=True, null=True)